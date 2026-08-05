#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Commerce OS · Decision Engine
Вход: сработавшие правила + уверенность по каждому.
Выход: ранжированный roadmap с волнами, Confidence Score отчёта и трассировка решения.

Запуск:  python3 decision_engine.py fired.json
Формат:  {"R12": {"conf": 100, "evidence": "title карточек содержит грн грн, проверено"},
           "R28": {"conf": 50,  "evidence": "виден только welcome-контур"}}

ГЕЙТ ОСНОВАНИЯ: правило без непустого evidence в roadmap не попадает. Это защита от
ложной активации — движок не должен ставить в волну работу по проблеме, которой нет.
Старый формат {"R12": 100} принимается, но такие правила отбраковываются как
неподтверждённые.
"""
import sys, json, os
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = os.path.join(HERE, "..", "data", "decision_rules.yaml")

CONF_W = {100: 1.0, 75: 0.85, 50: 0.6, 25: 0.35}   # вес достоверности в ранге
WAVE_CAP = 5                                        # не более 5 плейбуков в волне


def load_rules(path=RULES):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def normalize(fired):
    """Приводит вход к {id: {conf, evidence}} и делит на подтверждённые и отбракованные."""
    ok, rejected = {}, []
    for rid, v in fired.items():
        if isinstance(v, dict):
            conf = int(v.get("conf", 25)); ev = (v.get("evidence") or "").strip()
        else:
            conf, ev = int(v), ""
        if not ev:
            rejected.append((rid, conf, "нет основания активации"))
        elif len(ev) < 12:
            rejected.append((rid, conf, "основание слишком общее"))
        else:
            ok[rid] = {"conf": conf, "evidence": ev}
    return ok, rejected


def rank(rules, fired):
    """Ранг = impact × вес достоверности × достижимость. Достижимость = 1 - (difficulty-1)/12."""
    out = []
    for r in rules["rules"]:
        if r["id"] not in fired:
            continue
        conf = fired[r["id"]]["conf"]
        w = CONF_W.get(conf, 0.35)
        reach = 1 - (r["difficulty"] - 1) / 12
        roi = round(r["impact"] / r["difficulty"], 2)
        score = round(r["impact"] * w * reach, 2)
        out.append({**r, "confidence": conf, "evidence": fired[r["id"]]["evidence"],
                    "roi": roi, "score": score})
    return sorted(out, key=lambda x: (-x["blocking"], -x["score"]))


def to_waves(ranked):
    """Блокирующие — всегда волна 1. Дальше по рангу, не более WAVE_CAP плейбуков в волне."""
    waves, cur, seen, used = [], [], set(), 0
    for r in ranked:
        new_pbs = [p for p in r["playbooks"] if p not in seen]
        if r["blocking"] and waves == [] :
            cur.append(r); seen.update(new_pbs); used += len(new_pbs)
            continue
        if used + len(new_pbs) > WAVE_CAP and cur:
            waves.append(cur); cur, used = [], 0
        cur.append(r); seen.update(new_pbs); used += len(new_pbs)
    if cur:
        waves.append(cur)
    return waves


def confidence_score(rules, fired, answered=None, total=None, contradictions=0):
    # ВАЖНО: Health Score здесь НЕ считается. Он считается только в ЕКП (лист 44)
    # по формуле 0,6 × Score A + 0,4 × Score B и передаётся сюда как справочное число.
    # Confidence Score — про достоверность отчёта, Health Score — про состояние бизнеса.
    """
    Confidence Score отчёта, 0–100.
    Складывается из трёх частей:
      A · заполненность  — доля отвеченных вопросов                     вес 30
      B · достоверность  — средневзвешенная достоверность сработавших   вес 55
      C · согласованность — штраф за противоречия                       вес 15
    """
    if answered is not None and total:
        fill = answered / total
    else:
        fill = len(fired) / max(len(rules["rules"]), 1)
    a = 30 * min(fill, 1.0)
    if fired:
        weights = [CONF_W.get(v["conf"], 0.35) for v in fired.values()]
        b = 55 * (sum(weights) / len(weights))
    else:
        b = 0
    c = max(0, 15 - contradictions * 5)
    return round(a + b + c), {"заполненность": round(a, 1), "достоверность": round(b, 1),
                              "согласованность": round(c, 1)}


def explain(r):
    """Трассировка решения: почему этот плейбук оказался здесь."""
    return (f"{r['id']} · {r['trigger'][:70]}\n"
            f"      → домены: {r['domains']}\n"
            f"      → плейбуки: {', '.join(r['playbooks']) or '—'}\n"
            f"      → результат: {r['deliverable']}\n"
            f"      → основание: {r['evidence'][:88]}\n"
            f"      → impact {r['impact']}/10 · сложность {r['difficulty']}/10 · ROI {r['roi']} · "
            f"срок ~{r['days']} дн · трудоёмкость {r.get('effort_days','?')} чел-дн · "
            f"достоверность {r['confidence']}")


def report(fired, answered=None, total=None, contradictions=0, health_score=None):
    rules = load_rules()
    fired, rejected = normalize(fired)
    ranked = rank(rules, fired)
    waves = to_waves(ranked)
    cs, parts = confidence_score(rules, fired, answered, total, contradictions)

    print("=" * 78)
    print("COMMERCE OS · DECISION ENGINE")
    print("=" * 78)
    print(f"Подтверждено правил: {len(ranked)} из {len(rules['rules'])}")
    if rejected:
        print(f"Отбраковано без основания: {len(rejected)}")
        for rid, c, why in rejected:
            print(f"   ✗ {rid} · достоверность {c} · {why}")
        print("   Правило без основания в roadmap не попадает: активация должна опираться")
        print("   на наблюдение с адресом, цифру или прямой ответ клиента.")
    if health_score is not None:
        print(f"Health Score (из ЕКП, лист 44): {health_score}/100")
    print(f"Confidence Score отчёта: {cs}/100   {parts}")
    if cs < 50:
        print("  ⚠ Ниже 50 — отчёт не готов к защите. Нужны данные, а не выводы.")
    elif cs < 75:
        print("  Достаточно для чернового scope, недостаточно для бюджета.")
    else:
        print("  Достаточно для программы и бюджета.")

    total_effort = sum(r.get("effort_days", 0) for r in ranked)
    print(f"Оценка трудоёмкости scope: {total_effort} чел-дней "
          f"(сумма effort_days подтверждённых правил)")

    for i, w in enumerate(waves, 1):
        pbs = sorted({p for r in w for p in r["playbooks"]})
        print("\n" + "-" * 78)
        eff = sum(r.get("effort_days", 0) for r in w)
        print(f"ВОЛНА {i} · плейбуков {len(pbs)} · ~{max(r['days'] for r in w)} дн · {eff} чел-дн")
        print("-" * 78)
        for r in w:
            flag = "БЛОК " if r["blocking"] else "     "
            print(f"{flag}{r['score']:>6.2f}  {explain(r)}\n")

    print("=" * 78)
    print("Трассировка: каждая строка выше показывает, из какого триггера, через какое")
    print("правило и с какой достоверностью появился плейбук. Решение без трассировки")
    print("в roadmap не попадает.")
    return {"waves": waves, "confidence": cs, "effort": total_effort, "rejected": rejected}


if __name__ == "__main__":
    if len(sys.argv) > 1:
        fired = json.load(open(sys.argv[1], encoding="utf-8"))
        fired = {k: int(v) for k, v in fired.items()}
    else:
        fired = {"R21": {"conf": 100, "evidence": "CR ниже нормы бракета чека, подтверждено данными Allegro"},
                 "R42": {"conf": 50, "evidence": "промо 9-25% на всём каталоге без видимой связи с маржой"},
                 "R45": 50}
    report(fired, answered=180, total=625, contradictions=1, health_score=56.2)

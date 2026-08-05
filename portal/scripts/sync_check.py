#!/usr/bin/env python3
"""Страж синхронизации: сравнивает выжимки портала (src/data) с первоисточником
методики (method/). Запускать после каждого обновления method/:
    cd portal && python3 scripts/sync_check.py
Ненулевой код выхода = есть дельта, которую надо осознанно принять или внести.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
issues = []


def note(msg: str) -> None:
    issues.append(msg)
    print(f"  · {msg}")


print("== Вопросы: src/data/questions.json vs method/references/questions/")
xlsx = {q["id"]: q for q in json.load(open(ROOT / "src/data/questions.json"))}
reg = {}
for qf in sorted((ROOT / "method/references/questions").glob("q-*.md")):
    for line in qf.read_text().splitlines():
        if not line.startswith("|"):
            continue
        c = [x.strip() for x in line.strip("|").split("|")]
        if len(c) < 11 or not re.match(r"^[A-ZА-Я]{2,4}-\d+$", c[0]):
            continue
        reg[c[0]] = {"text": c[3], "weight": c[10]}
only_reg = {i for i in reg if i not in xlsx and reg[i]["weight"].isdigit() and int(reg[i]["weight"]) >= 2}
if only_reg:
    note(f"в реестре метода есть вопросы веса ≥2, отсутствующие в портале: {sorted(only_reg)}")
wdiff = [i for i in xlsx.keys() & reg.keys() if reg[i]["weight"].isdigit() and str(xlsx[i].get("weight")) != reg[i]["weight"]]
if wdiff:
    note(f"веса расходятся: {wdiff[:10]}")

print("== Роутинг: src/data/routing.json vs method/data/decision_rules.yaml")
rules_txt = (ROOT / "method/data/decision_rules.yaml").read_text()
method_ids = set(re.findall(r"^- id: (R\d+)", rules_txt, re.M))
portal_ids = {r["id"] for r in json.load(open(ROOT / "src/data/routing.json"))}
if method_ids != portal_ids:
    note(f"правила роутинга расходятся: +{sorted(method_ids - portal_ids)} −{sorted(portal_ids - method_ids)}")

print("== Зависимости плейбуков: pb-deps.json vs method/data/playbook_dependencies.json")
a = json.load(open(ROOT / "src/data/pb-deps.json"))
b = json.load(open(ROOT / "method/data/playbook_dependencies.json"))
if a != b:
    note(f"pb-deps рассинхронизированы: в портале {len(a)}, в методе {len(b)}")

print("== Зрелость: capability.json vs method/references/capability_maturity.md")
cap_portal = {c["domain"] for c in json.load(open(ROOT / "src/data/capability.json"))}
cap_method = set(re.findall(r"^\| \*\*(\w[\w /]*?)\*\*", (ROOT / "method/references/capability_maturity.md").read_text(), re.M))
if cap_method - cap_portal:
    note(f"домены зрелости отсутствуют в портале: {sorted(cap_method - cap_portal)}")

print("== Веса матрицы зрелости (Σ = 100)")
mtxt = (ROOT / "src/data/method.ts").read_text()
weights = [int(w) for w in re.findall(r"weight: (\d+),", mtxt)][:18]
if sum(weights) != 100:
    note(f"сумма весов доменов = {sum(weights)}, должна быть 100")

print("=" * 60)
if issues:
    print(f"Дельта найдена: {len(issues)} пунктов — примите решение по каждому.")
    sys.exit(1)
print("Синхронизация чистая: портал соответствует методике.")

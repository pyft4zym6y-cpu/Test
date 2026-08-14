#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Commerce OS · Experiment Planner
Планирование и чтение A/B-тестов: размер выборки, MDE, длительность, значимость.

Запуск:
  python3 experiment_planner.py plan   0.021 0.10 12000     # базовая CR, желаемый подъём, трафик/нед
  python3 experiment_planner.py mde    0.021 12000 4        # базовая CR, трафик/нед, недель
  python3 experiment_planner.py read   5400 118 5390 147    # n_A conv_A n_B conv_B
Без аргументов — демонстрация всех трёх режимов.
"""
import sys
from statistics import NormalDist

ND = NormalDist()
ALPHA, POWER = 0.05, 0.80          # двусторонний тест, мощность 80%
Z_A = ND.inv_cdf(1 - ALPHA / 2)     # 1.96
Z_B = ND.inv_cdf(POWER)             # 0.84


def sample_size(p1, lift_rel):
    """Размер выборки на вариант для относительного подъёма lift_rel."""
    p2 = p1 * (1 + lift_rel)
    if p2 >= 1:
        raise ValueError("Целевая конверсия выше 100%")
    num = (Z_A + Z_B) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))
    return int(num / (p2 - p1) ** 2) + 1, p2


def mde(p1, n_per_variant):
    """Минимально детектируемый эффект при заданной выборке. Решается численно."""
    lo, hi = 1e-5, 5.0
    for _ in range(80):
        mid = (lo + hi) / 2
        try:
            n, _ = sample_size(p1, mid)
        except ValueError:
            hi = mid; continue
        if n > n_per_variant:
            lo = mid
        else:
            hi = mid
    return hi


def read_result(nA, cA, nB, cB):
    """Двухпропорционный z-тест. Возвращает подъём, p-value, доверительный интервал."""
    pA, pB = cA / nA, cB / nB
    lift = (pB - pA) / pA if pA else float("nan")
    p_pool = (cA + cB) / (nA + nB)
    se = (p_pool * (1 - p_pool) * (1 / nA + 1 / nB)) ** 0.5
    z = (pB - pA) / se if se else 0
    pval = 2 * (1 - ND.cdf(abs(z)))
    se_diff = (pA * (1 - pA) / nA + pB * (1 - pB) / nB) ** 0.5
    lo = (pB - pA) - Z_A * se_diff
    hi = (pB - pA) + Z_A * se_diff
    return dict(pA=pA, pB=pB, lift=lift, z=z, p=pval, ci=(lo, hi))


def plan(p1, lift_rel, weekly_traffic):
    n, p2 = sample_size(p1, lift_rel)
    total = n * 2
    weeks = total / weekly_traffic
    print(f"Базовая конверсия      {p1*100:.2f}%")
    print(f"Целевая конверсия      {p2*100:.2f}%  (относительный подъём {lift_rel*100:.0f}%)")
    print(f"Выборка на вариант     {n:,}")
    print(f"Всего наблюдений       {total:,}")
    print(f"Трафик в неделю        {weekly_traffic:,}")
    print(f"Длительность           {weeks:.1f} нед")
    print()
    if weeks > 8:
        print("  ⚠ Дольше 8 недель. Тест не окупается: за это время изменится сезон,")
        print("    ассортимент и трафик. Варианты: увеличить ожидаемый эффект за счёт")
        print("    более радикального изменения, тестировать на более узком сегменте")
        print("    с высокой базовой конверсией, или не тестировать вовсе — внедрять")
        print("    по эталону и мерить до/после.")
    elif weeks < 1:
        print("  Меньше недели. Обязательно добери до полных 7 дней:")
        print("  недельный цикл покупательского поведения перекрывает эффект теста.")
    else:
        print("  Длительность рабочая. Округляй вверх до целых недель.")
    return weeks


def show_mde(p1, weekly, weeks):
    n = int(weekly * weeks / 2)
    m = mde(p1, n)
    print(f"При трафике {weekly:,}/нед за {weeks} нед на вариант приходится {n:,} наблюдений")
    print(f"Минимально детектируемый эффект: {m*100:.1f}% относительного подъёма")
    print(f"То есть конверсия должна вырасти с {p1*100:.2f}% минимум до {p1*(1+m)*100:.2f}%")
    print()
    if m > 0.25:
        print("  ⚠ MDE выше 25%. Тест поймает только очень крупные изменения.")
        print("    Мелкие правки на таком трафике проверить нельзя — внедряй по эталону.")


def show_read(nA, cA, nB, cB):
    r = read_result(nA, cA, nB, cB)
    print(f"Контроль   {cA:,} / {nA:,} = {r['pA']*100:.3f}%")
    print(f"Вариант    {cB:,} / {nB:,} = {r['pB']*100:.3f}%")
    print(f"Подъём     {r['lift']*100:+.1f}%")
    print(f"z = {r['z']:.2f}   p-value = {r['p']:.4f}")
    print(f"95% ДИ разницы конверсий: [{r['ci'][0]*100:+.3f} п.п.; {r['ci'][1]*100:+.3f} п.п.]")
    print()
    if r["p"] < ALPHA:
        if r["ci"][0] > 0 or r["ci"][1] < 0:
            print("  Результат значим. Интервал не пересекает ноль — эффект есть.")
        else:
            print("  p-value значим, но интервал пересекает ноль. Проверь расчёт.")
    else:
        print("  Результат НЕ значим. Это не значит «эффекта нет» — это значит")
        print("  «данных не хватило, чтобы его увидеть». Смотри на границы интервала:")
        print(f"  реальный эффект может быть где угодно от {r['ci'][0]*100:+.3f} до {r['ci'][1]*100:+.3f} п.п.")
    if abs(r["lift"]) > 0.5:
        print("\n  ⚠ Подъём выше 50% — почти всегда ошибка реализации, а не победа.")
        print("    Проверь: разное распределение трафика, попадание бота, битый вариант.")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        print("=" * 70); print("ПЛАНИРОВАНИЕ"); print("=" * 70)
        plan(0.021, 0.10, 12000)
        print("\n" + "=" * 70); print("MDE ПРИ ЗАДАННОМ ТРАФИКЕ"); print("=" * 70)
        show_mde(0.021, 12000, 4)
        print("\n" + "=" * 70); print("ЧТЕНИЕ РЕЗУЛЬТАТА"); print("=" * 70)
        show_read(5400, 118, 5390, 147)
    elif a[0] == "plan":
        plan(float(a[1]), float(a[2]), int(a[3]))
    elif a[0] == "mde":
        show_mde(float(a[1]), int(a[2]), float(a[3]))
    elif a[0] == "read":
        show_read(int(a[1]), int(a[2]), int(a[3]), int(a[4]))

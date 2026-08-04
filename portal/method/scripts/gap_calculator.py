#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Commerce OS · Калькулятор недоотриманого обороту (цепная атрибуция)
Заменяет аддитивную схему «сумма разрывов» на разность двух состояний воронки.
Сумма вкладов рычагов ТОЧНО равна итоговому потенциалу — двойного счёта нет.
"""

from dataclasses import dataclass, replace, fields


@dataclass
class State:
    """Вектор состояния воронки за месяц."""
    traffic: float          # сессии/мес (включая органику)
    cr: float               # конверсия сессия → заявка
    aov: float              # средний чек, ₴
    pay_rate: float         # доля оплаченных заявок
    fulfil_rate: float      # выкуп: доля заказов, дошедших до выручки
    base: float             # активная клиентская база, чел.
    repeat_rate: float      # доля клиентов базы с повторной покупкой за период
    repeat_orders: float    # среднее число повторных заказов на повторного клиента

    def revenue_new(self) -> float:
        return self.traffic * self.cr * self.aov * self.pay_rate * self.fulfil_rate

    def revenue_repeat(self) -> float:
        return (self.base * self.repeat_rate * self.repeat_orders
                * self.aov * self.pay_rate * self.fulfil_rate)

    def revenue(self) -> float:
        return self.revenue_new() + self.revenue_repeat()


# Порядок применения рычагов = порядок движения по воронке.
# Порядок влияет на распределение вкладов, но НЕ на итог.
LEVER_ORDER = [
    ("traffic",       "Трафик / органика"),
    ("cr",            "Конверсия сайта"),
    ("aov",           "Средний чек"),
    ("pay_rate",      "Оплата заявок"),
    ("fulfil_rate",   "Выкуп (отказы+возвраты)"),
    ("base",          "Рост базы"),
    ("repeat_rate",   "Доля повторных"),
    ("repeat_orders", "Частота повторных"),
]


def chain_attribution(fact: State, target: State):
    """Цепная декомпозиция: каждый рычаг применяется поверх уже применённых."""
    cur, rows = fact, []
    for attr, label in LEVER_ORDER:
        f, t = getattr(fact, attr), getattr(target, attr)
        if f == t:
            continue
        before = cur.revenue()
        cur = replace(cur, **{attr: t})
        rows.append((label, f, t, cur.revenue() - before))
    return rows, cur


def naive_sum(fact: State, target: State) -> float:
    """Аддитивная схема из gold_standards.md — для демонстрации переоценки."""
    orders = fact.traffic * fact.cr
    paid = orders * fact.pay_rate
    return (
        fact.traffic * (target.cr - fact.cr) * fact.aov                  # разрыв по конверсии
        + (target.pay_rate - fact.pay_rate) * orders * fact.aov          # разрыв по оплате
        + (target.fulfil_rate - fact.fulfil_rate) * paid * fact.aov      # разрыв по выкупу
        + fact.base * (target.repeat_rate - fact.repeat_rate)
          * fact.aov * fact.repeat_orders                                # разрыв по повторным
    )


def money(x: float) -> str:
    return f"{x:>14,.0f}".replace(",", " ")


def report(fact: State, target: State, extra_streams=None):
    """extra_streams: [(название, ₴/мес)] — новые потоки (МП, ЕС): складываются легитимно."""
    extra_streams = extra_streams or []
    rows, final = chain_attribution(fact, target)
    total = final.revenue() - fact.revenue()

    print("=" * 72)
    print("НЕДООТРИМАНИЙ ОБОРОТ · цепная атрибуция")
    print("=" * 72)
    print(f"Выручка при факте:  {money(fact.revenue())} ₴/мес")
    print(f"Выручка при цели:   {money(final.revenue())} ₴/мес")
    print("-" * 72)
    print(f"{'Рычаг':<28}{'факт':>10}{'цель':>10}{'вклад, ₴/мес':>22}")
    print("-" * 72)
    for label, f, t, contrib in rows:
        fs = f"{f:.3g}" if f < 1 else f"{f:,.0f}".replace(",", " ")
        ts = f"{t:.3g}" if t < 1 else f"{t:,.0f}".replace(",", " ")
        print(f"{label:<28}{fs:>10}{ts:>10}{money(contrib):>22}")
    print("-" * 72)
    print(f"{'ПОТЕНЦИАЛ (существующая воронка)':<48}{money(total):>22}")

    for name, val in extra_streams:
        print(f"{'+ ' + name + ' (новый поток)':<48}{money(val):>22}")
    grand = total + sum(v for _, v in extra_streams)
    print("=" * 72)
    print(f"{'ИТОГО ₴/мес':<48}{money(grand):>22}")
    print(f"{'ИТОГО ₴/год':<48}{money(grand * 12):>22}")

    # контроль
    assert abs(sum(r[3] for r in rows) - total) < 1e-6, "Сумма вкладов ≠ итог"
    naive = naive_sum(fact, target)
    print("-" * 72)
    print(f"Аддитивная схема дала бы:  {money(naive)} ₴/мес "
          f"(+{(naive / total - 1) * 100:.0f}% переоценки)")
    print("=" * 72)
    return rows, total


if __name__ == "__main__":
    # repeat_rate — доля базы, покупающая ПОВТОРНО В ЭТОМ МЕСЯЦЕ (не за всю жизнь).
    fact = State(traffic=50_000, cr=0.018, aov=1800, pay_rate=0.634, fulfil_rate=0.82,
                 base=12_000, repeat_rate=0.030, repeat_orders=1.2)
    target = replace(fact, cr=0.026, pay_rate=0.75, fulfil_rate=0.90, repeat_rate=0.052)

    report(fact, target, extra_streams=[("Маркетплейси UA", 380_000),
                                        ("Польща (Wave 3)", 520_000)])

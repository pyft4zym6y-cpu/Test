#!/usr/bin/env python3
"""Coverage Engine · движок №2 со страницы 15 архитектуры.

Отвечает на вопрос «а я вообще всё проверила?», а не «кажется, всё».
Сверяет фактические записи покрытия проекта с тем, что ОБЯЗАНО было отработать
на заданном слое доступа по конфигурации identity-os.

Ловит три вещи, которые иначе ловятся только чужими глазами:
  1  домен активирован конфигурацией, но записи покрытия нет вообще
  2  домен объявлен «заблокирован слоем», хотя его модуль умеет работать на этом слое
  3  домен объявлен «проверено», но модули не перечислены — то есть запись пустая

    python3 coverage.py projects/lanavitta/coverage.json "производитель D2C + опт" L0
"""
import os, re, json, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ORDER = ['L0', 'L1', 'L2', 'L3', 'L4']

# конфигурация активации — та же, что в simulate.py
ACTIVATION = {
    'производитель D2C + опт': ['identity-os','commerce-os','data-os','brand-os','product-os','pricing-os','ux-os','merchandising-os','seo-os','content-os','b2b-os','ops-os','synthesis-os','finance-os','legal-os','people-os','marketplace-os','retention-os','paid-os','build-os'],
    'дистрибьютор чужих брендов': ['identity-os','commerce-os','data-os','product-os','pricing-os','b2b-os','ops-os','synthesis-os','finance-os','legal-os','people-os','build-os'],
    'реселлер / ритейлер': ['identity-os','commerce-os','data-os','ux-os','merchandising-os','seo-os','pricing-os','product-os','ops-os','synthesis-os','finance-os','legal-os'],
    'marketplace seller': ['identity-os','commerce-os','data-os','marketplace-os','pricing-os','product-os','content-os','ops-os','synthesis-os','finance-os','legal-os'],
    'производитель с нуля': ['identity-os','commerce-os','brand-os','product-os','pricing-os','build-os','legal-os','finance-os','people-os','synthesis-os'],
}


def capability():
    """Что каждый скил УМЕЕТ на каком слое — читается из блока 13, не задаётся здесь."""
    out = {}
    sk = os.path.join(ROOT, 'skills')
    for s in sorted(os.listdir(sk)):
        p = os.path.join(sk, s, 'SKILL.md')
        if not os.path.exists(p):
            continue
        t = open(p, encoding='utf-8').read()
        m = re.search(r'## 13 · Аудит-модуль\n(.*?)\n## 14', t, re.S)
        b = m.group(1) if m else ''
        main = re.search(r'Основной слой доступа:\s*\*\*(L[0-3])\*\*', b)
        out[s] = {'main': main.group(1) if main else 'L2',
                  'partial_l0': 'Частичный L0' in t,
                  'no_module': 'Собственного модуля аудита нет' in b or 'Своего модуля аудита нет' in b}
    return out


def run(cov_path, ctype, layer):
    cov = {c['domain']: c for c in json.load(open(cov_path, encoding='utf-8'))}
    cap = capability()
    obl = ACTIVATION.get(ctype)
    if not obl:
        print(f'неизвестный тип клиента: {ctype}'); return 1
    allowed = set(ORDER[:ORDER.index(layer) + 1])

    missing, wrongly_blocked, empty, ok, legit, overclaimed = [], [], [], [], [], []
    for d in obl:
        c = cap.get(d, {})
        if c.get('no_module'):
            legit.append((d, 'модуля аудита нет по устройству')); continue
        can = c.get('main') in allowed or (c.get('partial_l0') and 'L0' in allowed)
        rec = cov.get(d)
        if rec is None:
            (missing if can else legit).append((d, 'нет записи покрытия' if can else 'вне слоя, записи нет'))
        elif rec['status'] == 'заблокировано' and can:
            wrongly_blocked.append((d, f"объявлен заблокированным, но модуль работает на {c.get('main')}"
                                       + (' + частичный L0' if c.get('partial_l0') else '')))
        elif rec['status'] == 'проверено' and not rec.get('modules_run'):
            empty.append((d, 'статус «проверено», список модулей пуст'))
        elif rec['status'] == 'проверено' and not can:
            overclaimed.append((d, f"объявлен проверенным, но модуль не работает на {layer}"))
        elif rec['status'] == 'проверено':
            ok.append((d, ', '.join(rec['modules_run'])))
        else:
            legit.append((d, rec['status'] + (f" · {rec.get('blocked_by')}" if rec.get('blocked_by') else '')))

    must = len([d for d in obl if not cap.get(d, {}).get('no_module')
                and (cap.get(d, {}).get('main') in allowed or (cap.get(d, {}).get('partial_l0') and 'L0' in allowed))])
    print('=' * 88)
    print(f'COVERAGE ENGINE · {ctype} · слой {layer}')
    print(f'обязательных доменов: {len(obl)} · умеют работать на этом слое: {must} · фактически проверено: {len(ok)}')
    print('=' * 88)
    if ok:
        print(f'\nПРОВЕРЕНО · {len(ok)}')
        for d, m in ok: print(f'   ✓ {d:<20}{m}')
    if legit:
        print(f'\nЗАКОННО НЕ ПРОВЕРЕНО · {len(legit)}')
        for d, m in legit: print(f'   – {d:<20}{m}')
    problems = missing + wrongly_blocked + empty + overclaimed
    if problems:
        print(f'\nДЕФЕКТЫ ПОКРЫТИЯ · {len(problems)}')
        for d, m in missing: print(f'   ✗ {d:<20}ПРОПУЩЕН · {m}')
        for d, m in wrongly_blocked: print(f'   ✗ {d:<20}ЛОЖНАЯ БЛОКИРОВКА · {m}')
        for d, m in empty: print(f'   ✗ {d:<20}ПУСТАЯ ЗАПИСЬ · {m}')
        for d, m in overclaimed: print(f'   ✗ {d:<20}ЗАВЫШЕННАЯ ЗАЯВКА · {m}')
        print(f'\nПокрытие слоя: {len(ok)}/{must} = {100*len(ok)//max(must,1)}%')
        print('ВЕРДИКТ: аудит на этом слое НЕ ЗАВЕРШЁН. Отчёт выпускать нельзя.')
        return 1
    print(f'\nПокрытие слоя: {len(ok)}/{must} = 100%')
    print('ВЕРДИКТ: слой закрыт.')
    return 0


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(__doc__); sys.exit(2)
    sys.exit(run(sys.argv[1], sys.argv[2], sys.argv[3]))

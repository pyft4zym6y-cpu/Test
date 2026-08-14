#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Commerce OS · Validator
Самопроверка пакета: битые коды, сироты, дубли, расхождение счётчиков, размер файлов.

Запуск из корня скила:  python3 scripts/validate.py
Код возврата 1, если есть ошибки уровня ERROR.
"""
import re, os, glob, sys, collections, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

ERR, WARN = [], []
def err(m): ERR.append(m)
def warn(m): WARN.append(m)

def read(p):
    with open(p, encoding='utf-8') as f: return f.read()

MD = glob.glob('**/*.md', recursive=True)
ALL = ''.join(read(f) for f in MD)
SKILL = read('SKILL.md')

# ── 1. Системы кодов: определены ли ─────────────────────────────────────────
DEF = {
 'PB': {os.path.basename(f)[:-3] for f in glob.glob('references/playbooks/PB-*.md')},
 'D':  set(re.findall(r'^\| (D-\d\d) \|', read('references/deliverables_registry.md'), re.M)),
 'AD': set(re.findall(r'^### (AD-\d\d)', read('references/audit_deliverables.md'), re.M)),
 'R':  set(re.findall(r'^\| (R\d\d) \|', read('references/routing.md'), re.M)),
}
QFILES = glob.glob('references/questions/*.md')
DEF['Q'] = set(re.findall(r'^\| ([A-Z]{2}-\d{3}) \|', ''.join(read(f) for f in QFILES), re.M))

USED = {
 'PB': set(re.findall(r'\bPB-\d\d\b', ALL)),
 'D':  set(re.findall(r'\bD-\d\d\b', ALL)),
 'AD': set(re.findall(r'\bAD-\d\d\b', ALL)),
 'R':  set(re.findall(r'\bR\d\d\b', ALL)),
 'Q':  {c for c in re.findall(r'(?<![A-Z-])\b[A-Z]{2}-\d{3}\b', ALL) if not c.startswith(('AP-','DQ-','TC-','MP-0'))},
}
for k in DEF:
    broken = sorted(USED[k] - DEF[k])
    if broken: err(f'{k}: ссылки на несуществующие коды ({len(broken)}): {broken[:8]}')
    orphan = sorted(DEF[k] - USED[k])
    if orphan: warn(f'{k}: определены, но нигде не используются ({len(orphan)}): {orphan[:8]}')

# ── 2. Пропуски в нумерации ─────────────────────────────────────────────────
for k, pat in (('D', r'D-(\d\d)'), ('AD', r'AD-(\d\d)'), ('R', r'R(\d\d)')):
    nums = sorted(int(x) for x in {c[len(k)+1:] if False else re.match(pat, c).group(1) for c in DEF[k]})
    gaps = [i for i in range(nums[0], nums[-1]+1) if i not in nums]
    if gaps: warn(f'{k}: пропуски в нумерации {gaps}')

# ── 3. Ссылки на файлы ──────────────────────────────────────────────────────
for m in set(re.findall(r'`(references/[a-z_/]+\.md)`', ALL)) | set(re.findall(r'`(scripts/[a-z_]+\.py)`', ALL)) | set(re.findall(r'`(data/[a-z_]+\.(?:yaml|json))`', ALL)):
    if not os.path.exists(m): err(f'битая ссылка на файл: {m}')

# ── 4. Справочники, не упомянутые в ядре ────────────────────────────────────
for f in glob.glob('references/*.md'):
    if os.path.basename(f) not in SKILL: warn(f'не упомянут в SKILL.md: {f}')

# ── 5. Счётчики в текстах против факта ──────────────────────────────────────
FACT = {
 'плейбуков': len(DEF['PB']), 'deliverables': len(DEF['D']),
 'правил': len(DEF['R']), 'документов аудита': len(DEF['AD']),
 'вопросов': len(DEF['Q']),
}
CLAIMS = [
 (r'(\d+)\s+исполняемых методик', FACT['плейбуков'], 'плейбуки в SKILL.md'),
 (r'D-01…D-(\d\d)', FACT['deliverables'], 'верхняя граница D'),
 (r'AD-01…AD-(\d\d)\b(?! \(ядро\))', FACT['документов аудита'], 'верхняя граница AD'),
 (r'R01–R(\d\d)', FACT['правил'], 'верхняя граница R'),
 (r'(\d+) вопросов из ЕКП', FACT['вопросов'], 'шапка реестра вопросов'),
 (r'\*\*Всего (\d+) вопросов', FACT['вопросов'], 'подвал реестра вопросов'),
]
for pat, want, label in CLAIMS:
    for got in {int(x) for x in re.findall(pat, ALL)}:
        if got != want: err(f'счётчик разошёлся · {label}: в тексте {got}, фактически {want}')

# ── 6. Размер файлов ────────────────────────────────────────────────────────
LIMIT = 46000
for f in MD:
    n = len(read(f))
    if n > LIMIT: warn(f'файл крупнее {LIMIT//1000}k символов ({n:,}): {f}')

# ── 7. Дубли файлов ─────────────────────────────────────────────────────────
h = collections.defaultdict(list)
for f in MD: h[hashlib.md5(read(f).encode()).hexdigest()].append(f)
for k, v in h.items():
    if len(v) > 1: warn(f'идентичные файлы: {v}')

# ── 8. Плейбуки: обязательные поля шапки ────────────────────────────────────
for f in sorted(glob.glob('references/playbooks/PB-*.md')):
    t = read(f)
    for field in ('| Домен |', '| Deliverable |', '| Длительность |'):
        if field not in t: err(f'{os.path.basename(f)}: нет поля {field.strip("| ")}')

# ── Отчёт ───────────────────────────────────────────────────────────────────
print('=' * 72)
print('COMMERCE OS · VALIDATOR')
print('=' * 72)
print(f"Файлов .md: {len(MD)} · символов: {len(ALL):,}")
for k, v in FACT.items(): print(f"  {k}: {v}")
print()
if ERR:
    print(f'ОШИБКИ ({len(ERR)}):')
    for e in ERR: print('  ✗', e)
else:
    print('Ошибок нет.')
print()
if WARN:
    print(f'ПРЕДУПРЕЖДЕНИЯ ({len(WARN)}):')
    for w in WARN: print('  ·', w)
print('=' * 72)
sys.exit(1 if ERR else 0)

"""
Збірка PDF зі знімків: зміст, закладки, один аркуш на сторінку сайту.

Два проходи. Перший (mode=index) рахує порядок і номери аркушів — з цього
будується зміст. Другий (mode=final) кладе зміст першим аркушем і зшиває
решту, вішаючи дерево закладок «розділ → сторінка»: документ на сотню
аркушів без закладок гортати неможливо.
"""
import json, sys, io, datetime, os, re
from PIL import Image
from pypdf import PdfWriter, PdfReader

# --only=REGEX і --range=A:B дозволяють зібрати частину вигрузки окремим
# файлом. Знадобилось не для краси: повний документ на 91 сторінку важить
# ~60 МБ, а канал доставки приймає 30 — і стискати до ліміту довелось би
# так, що текст на знімках стає нечитабельним.
args = [a for a in sys.argv[1:] if not a.startswith('--')]
opts = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--'))
src, out, mode = args[0], args[1], args[2]
contents_pdf = args[3] if len(args) > 3 else None
ONLY = re.compile(opts['only']) if 'only' in opts else None
RANGE = tuple(int(x) for x in opts['range'].split(':')) if 'range' in opts else None
TITLE = opts.get('title', 'weexp.agency — усі сторінки сайту')

meta = json.load(open(f"{src}/meta.json", encoding="utf-8"))
ok = [m for m in meta if not m.get("error")]

def section(u):
    if u.endswith(".html"):         return "Юридичні сторінки"
    if u.startswith("/en"):         return "English version"
    if u.startswith("/blog"):       return "Блог"
    if u.startswith("/systems/"):   return "Вісім систем"
    if u.startswith("/expansion/"): return "Експертизи"
    return "Основні сторінки"

ORDER = ["Основні сторінки", "Вісім систем", "Експертизи", "Блог",
         "English version", "Юридичні сторінки"]

seq = sorted(ok, key=lambda m: (ORDER.index(section(m["url"])), ok.index(m)))
if ONLY:
    seq = [m for m in seq if ONLY.search(m["url"])]
if RANGE:
    seq = seq[RANGE[0]:RANGE[1]]
assert seq, "після фільтра не лишилось жодної сторінки"
for m in seq:
    t = (m.get("title") or m["url"]).split(" · WEEXP")[0].strip()
    m["label"] = (t[:67] + "…") if len(t) > 70 else t

# Зміст — завжди рівно один аркуш, тому зсув відомий наперед.
for n, m in enumerate(seq, start=2):
    m["sheet"] = n
total = len(seq) + 1

if mode == "index":
    sections = []
    for name in ORDER:
        items = [{"url": m["url"], "title": m["label"], "sheet": m["sheet"]}
                 for m in seq if section(m["url"]) == name]
        if items:
            sections.append({"name": name, "items": items})
    json.dump({"sections": sections, "total": len(seq), "sheets": total,
               "title": TITLE,
               "date": datetime.date.today().strftime("%d.%m.%Y")},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"індекс: {len(seq)} сторінок → {total} аркушів")
    sys.exit()

def page_pdf(path):
    """Знімок → односторінковий PDF. 96 dpi: 1440 px = 15 дюймів завширшки."""
    with Image.open(path) as im:
        buf = io.BytesIO()
        im.convert("RGB").save(buf, "PDF", resolution=96.0)
    buf.seek(0)
    return PdfReader(buf)

w = PdfWriter()
c = PdfReader(contents_pdf)
assert len(c.pages) == 1, f"зміст зайняв {len(c.pages)} аркушів — номери в ньому зсунуться"
w.add_page(c.pages[0])
w.add_outline_item("Зміст", 0)

parents = {}
for m in seq:
    first = len(w.pages)
    r = page_pdf(m["file"])
    assert len(r.pages) == 1, f'{m["url"]}: {len(r.pages)} аркушів замість одного'
    w.add_page(r.pages[0])
    sec = section(m["url"])
    if sec not in parents:
        parents[sec] = w.add_outline_item(sec, first)
    w.add_outline_item(f'{m["url"]}  —  {m["label"]}', first, parent=parents[sec])

w.add_metadata({"/Title": TITLE,
                "/Subject": f"Вигрузка {len(seq)} сторінок сайту",
                "/Creator": "WEEXP"})
with open(out, "wb") as f:
    w.write(f)
mb = os.path.getsize(out) / 1024 / 1024
print(f"готово: {len(seq)} сторінок сайту → {len(w.pages)} аркушів, {mb:.1f} МБ")

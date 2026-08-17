# WEEXP · Commerce OS — карта механіки аудиту

> Повний шлях: з чого починається, як проходить, які дані збираються на кожному етапі,
> які шаблони й документи генеруються, які бази знань підключаються.
> **Це редаговане джерело** — GitHub рендерить Mermaid автоматично. Правте текст діаграм нижче,
> і картинка перебудується. Кольори/підписи/звʼязки — усе змінюється тут.

Легенда: `Крок N` — клієнтські етапи воронки · `[[…]]` — бази знань · `[/…/]` — шаблони/документи · `{{…}}` — ворота (оплата/код).

---

## 1. Огляд — весь шлях за 30 секунд

```mermaid
flowchart TD
  V(["Відвідувач сайту"]) --> DIAG["Діагностика бізнесу<br/>(єдиний вхід, колишній «Калькулятор»)"]

  DIAG --> S1["Крок 1 · Калькулятор втрат"]
  S1 --> S2["Крок 2 · Commerce OS<br/>зрілість систем"]
  S2 --> S3["Крок 3 · Tier-2 кабінет<br/>(реєстрація)"]
  S3 --> G4{{"Access Code / Оплата"}}
  G4 --> S4["Крок 4 · Поглиблена діагностика<br/>Key Problems + Preliminary Roadmap"]
  S4 --> G5{{"Access Code / Оплата"}}
  G5 --> S5["Крок 5 · AI Diagnostic Interview<br/>динамічні питання + запити даних"]

  S5 --> ENG["AI Audit Engine (worker)<br/>краул + аудит-смуги + синтез"]
  ENG --> REP["Full Diagnostic Report<br/>(клієнту)"]
  ENG --> MGR["Manager Profile<br/>(команді WEEXP на пошту)"]
  ENG --> ROAD["Preliminary Roadmap<br/>під цілі й болі"]

  REP --> MEET(["Запланувати зустріч"])
  ROAD --> MEET

  classDef step fill:#eef2ff,stroke:#7E9DFF,color:#15171A;
  classDef gate fill:#fff5f5,stroke:#D6362B,color:#15171A;
  classDef out fill:#edf5ef,stroke:#3a7d5c,color:#15171A;
  class S1,S2,S3,S4,S5,DIAG step;
  class G4,G5 gate;
  class REP,MGR,ROAD out;
```

---

## 2. Клієнтська воронка — дані + глибина покриття на кожному кроці

`Diagnostic Coverage` росте поетапно й **ніколи не дорівнює 100% до Кроку 5**.
Проєкція «Зараз → Куди прийдемо» **не збирається наново** — кожен крок її **уточнює**.

```mermaid
flowchart LR
  subgraph K1["Крок 1 · Втрати"]
    d1["Дані: виторг/міс, AOV, конверсія,<br/>повторні, повернення, маржа, CAC, симптоми"]
    c1["Coverage +3–5%"]
    p1["Проєкція: чорновий діапазон €/рік"]
  end
  subgraph K2["Крок 2 · Commerce OS"]
    d2["Дані: 19 питань зрілості 8 систем + сайт"]
    c2["Coverage +5–10%"]
    p2["Проєкція уточнюється: де саме зосереджені гроші"]
  end
  subgraph K3["Крок 3 · Tier-2 кабінет"]
    d3["Дані: ціль (точка Б), конкуренти, орієнтири,<br/>маркетинг, фінанси, команда"]
    c3["Coverage +10–20%"]
    p3["Проєкція + дорожня карта (розмиті вектори)"]
  end
  subgraph K4["Крок 4 · Поглиблення"]
    d4["Перевірка попередніх відповідей,<br/>додаткові діагностичні теми"]
    c4["Coverage +12–25% (усе ще менше 100%)"]
    p4["Key Problems + Evidence + Preliminary Diagnosis"]
  end
  subgraph K5["Крок 5 · AI Interview"]
    d5["Динамічні питання + файли/доступи/скрипти"]
    c5["Coverage → 75%+"]
    p5["Фінальна проєкція + повний roadmap"]
  end

  K1 --> K2 --> K3 --> K4 --> K5
  p1 -. уточнює .-> p2 -. уточнює .-> p3 -. уточнює .-> p4 -. уточнює .-> p5
```

---

## 3. AI Audit Engine (worker) — краул → аудит-смуги → знання → синтез → документи

Кожна смуга: **старт → збирає дані → звіряється з базою знань → заповнює шаблон**.

```mermaid
flowchart TB
  IN["Вхід: сайт(и) клієнта, файли, доступи (GA4/GSC/ads/CRM), script"] --> CRAWL["crawl.ts<br/>обхід сайту + конкурентів → dataset.json"]
  CRAWL --> LANES

  subgraph LANES["Аудит-смуги (worker/src) — паралельно"]
    direction TB
    UX["UX/UI + Design · uxui.ts, designReview.ts"]
    JR["Customer Journey · journey.ts"]
    SEO["SEO Architecture · seoArchHtml"]
    TECH["Technical · techAudit"]
    CNT["Content · contentAudit"]
    CI["Commerce Intelligence · intelligence.ts"]
    MECH["Marketing Mechanics · mechanics"]
    EXT["Social · Mentions · Reviews · externalAudits.ts"]
  end

  KB[["Knowledge base (worker/knowledge)<br/>method-frame · domain-lenses · benchmark-standards<br/>synthesis-consolidation · tone"]] -. звірка .-> LANES
  OS[["Commerce OS reference (weexp-os)<br/>commerce · ux · seo · data · finance · ops · retention · paid<br/>pricing · merchandising · product · content · marketplace<br/>people · brand · legal · reporting · synthesis"]] -. лінзи систем .-> LANES

  LANES --> CAUSAL["causal.ts<br/>причинна карта (де корінь витоку)"]
  LANES --> COV["coverage.ts<br/>Diagnostic Coverage (домени · глибина · докази)"]

  CAUSAL --> SYN["synthesis.ts<br/>зведення + registryFeed.ts (реєстр гіпотез)<br/>headroom.ts (потенціал) · method.ts"]
  COV --> SYN

  SYN --> DOCS[/"Шаблони/документи (worker/src/export)<br/>PDF: UX-UI · SEO · Tech · Content · Intelligence · Journey · Mechanics · Social · Reviews<br/>DOCX: методологія · гіпотези · прототип · benchmark · coverage<br/>XLSX: sales · KPI · workbook"/]
  SYN --> ROAD[/"Preliminary Roadmap<br/>priority · impact · complexity · dependencies · role · sequence"/]

  DOCS --> REP(["Full Diagnostic Report — клієнту"])
  ROAD --> REP
  SYN --> MGR(["Manager Profile — команді WEEXP"])

  classDef lane fill:#eef2ff,stroke:#7E9DFF,color:#15171A;
  classDef kb fill:#fbf7ea,stroke:#c08a2e,color:#15171A;
  classDef tmpl fill:#f4f4f6,stroke:#7C848B,color:#15171A;
  classDef out fill:#edf5ef,stroke:#3a7d5c,color:#15171A;
  class UX,JR,SEO,TECH,CNT,CI,MECH,EXT lane;
  class KB,OS kb;
  class DOCS,ROAD tmpl;
  class REP,MGR out;
```

---

## 4. Приклад однієї смуги — UX/UI аудит (як читати будь-яку смугу)

```mermaid
flowchart LR
  A["Старт: URL сайту (+ скриншоти / script-дані)"] --> B["Збирає дані: crawl.ts<br/>DOM, навігація, картка товару, checkout,<br/>форми, mobile, швидкість, бар'єри"]
  B --> C["Аналіз: uxui.ts + designReview.ts<br/>бар'єри конверсії, IA, довіра"]
  C -. звіряється з .-> K[["ux-os.md · domain-lenses · benchmark-standards"]]
  C --> D[/"Заповнює шаблон: uxuiDocx.ts → UX-UI-аудит.pdf<br/>+ charts.ts (радар зрілості, воронка)"/]
  D --> E["Формулює: Problem → Evidence → Confidence → Impact → Priority"]
  E --> F(["→ у Roadmap і Manager Profile"])

  classDef lane fill:#eef2ff,stroke:#7E9DFF,color:#15171A;
  classDef kb fill:#fbf7ea,stroke:#c08a2e,color:#15171A;
  classDef tmpl fill:#f4f4f6,stroke:#7C848B,color:#15171A;
  class B,C lane; class K kb; class D tmpl;
```

---

## 5. Логіка roadmap за болями/цілями (векторні приклади)

```mermaid
flowchart TD
  G["Ціль/біль клієнта (з відповідей)"] --> EU["Хоче в Європу"]
  G --> SITE["Незадоволений сайтом"]
  G --> TEAM["Незадоволений відділом/процесами"]

  EU --> EUp["market selection → Allegro → Amazon →<br/>логістика → локалізація → payments → аналітика"]
  SITE --> SITEp["UX audit → CRO audit → technical audit →<br/><b>рішення:</b> оптимізувати чинний сайт АБО новий"]
  TEAM --> TEAMp["organizational audit → process audit →<br/>CRM → KPI → team architecture"]

  EUp --> ROAD(["Preliminary Roadmap"])
  SITEp --> ROAD
  TEAMp --> ROAD

  classDef pain fill:#fff5f5,stroke:#D6362B,color:#15171A;
  classDef out fill:#edf5ef,stroke:#3a7d5c,color:#15171A;
  class EU,SITE,TEAM pain; class ROAD out;
```

> **Важливо (з ТЗ):** система не робить категоричний висновок «потрібен новий сайт» з одного субʼєктивного
> «сайт поганий». Спершу — перевірка UX / аналітики / конверсії / технічних сигналів → лише потім рішення
> «оптимізація vs новий сайт» (Problem → Evidence → Confidence → Impact).

---

## Як редагувати

- Правте будь-який блок ```mermaid``` вище — назви вузлів у `[ ]`, звʼязки `-->`, підписи на стрілках `-->|текст|`, кольори у `classDef`.
- GitHub перемальовує діаграму автоматично при перегляді цього файлу.
- Для швидкої візуальної правки можна вставити блок у https://mermaid.live — і повернути змінений текст сюди.

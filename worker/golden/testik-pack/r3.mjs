// Звіт 3 · Фінансовий: розрив і цільова модель. Виправлення: contribution поруч
// із кожним герой-числом, міст P&L, чутливість УСІХ важелів, чесна окупність.
import { doc, page, cover, toc, kpi } from './gen.mjs';

const PAGES = [
  // 3.01 Головний висновок (стислий — повна логіка в трьох сторінках)
  (p, n) => page('', 'Глава 3.01 · Головний висновок', `
    <span class="ebrow">Глава 3.01 · Головний висновок для CEO</span>
    <h1 class="big" style="font-size:26pt">Бізнес втрачає €433k виручки на рік<br>(≈€156k прибутку) — після кліку.</h1>
    <p class="body" style="margin-top:4mm"><b>Одним реченням:</b> «Тестик» купує достатньо попиту за здоровою ціною (LTV:CAC 3.4),
    але втрачає його на трьох ділянках — оплата (checkout 43.6% проти 65%+), повернення клієнта (repeat 13% проти 25–30%)
    і чесність приладів (GA4 −22%) — і тому росте оборотом, а не прибутком.</p>
    <p class="body"><b>Три причини по глибині:</b> (1) найдорожчі втрати — у кроці оплати й мобільній швидкості: €190k+€120k виручки/рік;
    (2) базі на 41k контактів нема контуру повернення: €150k; (3) рішення ухвалюються по кривих даних однією людиною — це не гроші напряму,
    це причина, чому перші дві існують роками непоміченими.</p>
    <p class="body"><b>Що працює і на що спираємось:</b> юніт-економіка сайту (contribution 12% після реклами), продукт (4.6 Allegro, ядро 58% виручки),
    і головне — власник сам замовив автономність пріоритетом №2: організаційні зміни не доведеться продавати.</p>
    <h2 class="st" style="font-size:12pt">Чого НЕ робити — і чому (захист від інтуїтивних ходів)</h2>
    <table class="t" style="font-size:8.3pt">
      <tr><th>Спокуса</th><th>Чому ні зараз</th><th>Коли можна</th></tr>
      <tr><td>Долити бюджет у рекламу</td><td>кожен € проходить крізь checkout, що втрачає 56% оформлень</td><td>після W2: чесний GA4 + completion ≥52% + MER≥8</td></tr>
      <tr><td>Міняти платформу</td><td>заморожено власником до кінця Q4 — і правильно: сезон 38% виручки</td><td>TCO-оцінка у W3, рішення — 2027</td></tr>
      <tr><td>CZ/RO негайно</td><td>PL LTV:CAC 1.9 < 2.5 — модель ще не готова до множення</td><td>КТ-4 (М7): поріг пройдено → go</td></tr>
      <tr><td>Ще один редизайн</td><td>уже пробували — CR не зросла; проблема у швидкості й checkout</td><td>ніколи як «редизайн»; тільки точкові CRO-зміни</td></tr>
    </table>
    <p class="marg" style="margin-top:3mm">Маршрут: 30 днів — полагодити прилади й зупинити прямі втрати · 31–120 — CRM-контур, mobile, наявність ·
    міс 4–9 — SEO, орг-система, готовність PL/CZ/RO. Деталі — Звіт 4. Умова без якої не спрацює: PM fulltime і щотижневий ритм (див. 2.01 — саме цього бракувало всім 4 минулим спробам).</p>
  `, p, n),
  // 3.02 Міст P&L
  (p, n) => page('', 'Глава 3.02 · Міст P&L', `
    <span class="ebrow">Глава 3.02 · Міст P&L: від €123k/міс до €160k/міс run-rate</span>
    <h1 class="big" style="font-size:26pt">Кожен крок моста — важіль<br>із власною главою доказів.</h1>
    <div style="display:flex;align-items:flex-end;gap:2.5mm;margin-top:6mm;height:60mm">
      ${[['База', 123, 'var(--ink)', ''], ['Checkout', 15.8, 'var(--verd7)', 'd05'], ['CRM', 12.5, 'var(--verd7)', 'd08'], ['Mobile', 10.0, 'var(--verd7)', 'd05'], ['OOS', 7.9, 'var(--verd7)', 'd10'], ['SEO', 7.1, 'var(--verd7)', 'd06'], ['Allegro', 5.0, 'var(--verd7)', 'd01'], ['Бій', 2.6, 'var(--verd7)', 'd10'], ['Перекриття −45%', -24.8, 'var(--mark)', 'метод'], ['Run-rate М9', 159.1, 'var(--ink)', '']]
        .map(([l, v, c]) => {
          const h = Math.abs(v) / 160 * 52;
          return `<div style="flex:${l === 'База' || String(l).startsWith('Run') ? 1.5 : 1};display:flex;flex-direction:column;justify-content:flex-end;height:100%;text-align:center">
            <span class="mono" style="font-size:7.5pt;font-weight:700;${Number(v) < 0 ? 'color:var(--mark)' : ''}">${Number(v) > 0 ? (l === 'База' || String(l).startsWith('Run') ? '€' + v + 'k' : '+' + v) : v}</span>
            <div style="height:${h}mm;background:${c};margin-top:1mm"></div>
            <span class="mono" style="font-size:6.3pt;color:var(--steel);margin-top:1mm;line-height:1.2">${l}</span></div>`;
        }).join('')}
    </div>
    <p class="body" style="font-size:8.5pt;margin-top:4mm"><b>Читання моста:</b> прирости — місячні run-rate ефекти кожного важеля при повній реалізації до М9
    (річна сума важеля ÷ 12). Червоний стовпець — дисконт перекриттів: важелі перетинаються (швидший mobile піднімає і checkout; CRM повертає тих самих людей),
    тому все, крім найбільшого, беремо з коефіцієнтом 0.45. Це емпірично-консервативна константа з практики мульти-важільних програм: чесніше зрізати наперед, ніж скласти все і не дожити.</p>
    <table class="t" style="font-size:8.3pt">
      <tr><th></th><th class="num">Виручка/міс</th><th class="num">Contribution*/міс</th><th class="num">Contribution/рік</th></tr>
      <tr><td>Стан А (сьогодні)</td><td class="num">€123k</td><td class="num">≈€14.8k</td><td class="num">≈€177k</td></tr>
      <tr class="hl"><td><b>Стан Б (run-rate М9, повна реалізація)</b></td><td class="num"><b>€159k</b></td><td class="num"><b>≈€27.8k</b></td><td class="num"><b>≈€334k</b></td></tr>
      <tr><td>Приріст (100% реалізації)</td><td class="num">+€36.1k</td><td class="num">+€13.0k</td><td class="num"><b>+€156k</b></td></tr>
      <tr><td>Реалістичний діапазон (55–70%)</td><td class="num">+€20–25k</td><td class="num">+€7.2–9.1k</td><td class="num">+€86–109k</td></tr>
    </table>
    <p class="marg" style="margin-top:2mm">*Contribution ≈36% приросту виручки (маржа 52% − змінні); база — 12% (після реклами). Сезонність: міст показує
    run-rate у порівнянних місяцях (без Q4-піка); Q4 на здоровій системі — зверху. Шлях до цілі власника €250k/міс — стан Б + масштабування реклами + CZ/RO: розкладено у фінмоделі (задача W2, d01).</p>
  `, p, n),
  // 3.03 Важелі + чутливість
  (p, n) => page('', 'Глава 3.03 · Вісім важелів', `
    <span class="ebrow">Глава 3.03 · 8 важелів: розрахунок і чутливість кожного</span>
    <h1 class="big" style="font-size:26pt">€433k виручки (≈€156k прибутку).<br>Кожен важіль — три сценарії.</h1>
    <table class="t" style="margin-top:4mm;font-size:7.9pt">
      <tr><th>Важіль (глава доказів)</th><th>Механіка</th><th class="num">Песим.</th><th class="num">База</th><th class="num">Оптим.</th><th>Впевн.</th></tr>
      <tr class="hl"><td><b>1 · Checkout</b> (d05)</td><td>completion 43.6→52 / 60 / 65% · ×0.55 еластичність</td><td class="num">€95k</td><td class="num"><b>€190k</b></td><td class="num">€245k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td>2 · CRM/Retention (d08)</td><td>repeat 13→17 / 20 / 23%</td><td class="num">€95k</td><td class="num">€150k</td><td class="num">€205k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td>3 · Mobile (d05)</td><td>CR mob 0.9→1.1 / 1.25 / 1.4% (LCP ≤3.0/2.5)</td><td class="num">€64k</td><td class="num">€120k</td><td class="num">€168k</td><td><span class="sev m">med</span></td></tr>
      <tr><td>4 · OOS топ-20 (d10)</td><td>17%→10 / 7 / 5% часу</td><td class="num">€78k</td><td class="num">€95k</td><td class="num">€118k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td>5 · SEO (d06)</td><td>фасети + OOS-правила + 3 кластери</td><td class="num">€45k</td><td class="num">€85k</td><td class="num">€130k</td><td><span class="sev m">med</span></td></tr>
      <tr><td>6 · Allegro (d01)</td><td>contribution 3→6 / 8 / 10%</td><td class="num">€38k</td><td class="num">€60k</td><td class="num">€82k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td>7 · Бій (d10)</td><td>2.1→1.0 / 0.7 / 0.5%</td><td class="num">€22k</td><td class="num">€31k</td><td class="num">€37k</td><td><span class="sev ok">high</span></td></tr>
      <tr><td>8 · Dead stock (d03) — кеш, не виручка</td><td>розпродаж 210 SKU</td><td class="num">€40k</td><td class="num">€55k</td><td class="num">€70k</td><td><span class="sev ok">high</span></td></tr>
    </table>
    <p class="body" style="font-size:8.5pt;margin-top:3mm"><b>Агрегація без подвійного рахунку:</b> найбільший важіль повністю + 45% решти (виручкових):
    песиміст €95+0.45×342=<b>€249k</b> · база €190+0.45×541=<b>€433k</b> · оптиміст €245+0.45×740=<b>€578k</b>.
    Приклад повного розрахунку (важіль 1): 5 180 входів у checkout/міс × (60−43.6)% = 848 зам. × €42 × 12 = €427k «сирих» × 0.55 еластичності
    (частина недоплативших — нецільові: коефіцієнт із двох реперів — досліджень причин відмов і натурного експерименту порога доставки) = €190–235k → беремо нижню межу.</p>
    <h2 class="st" style="font-size:12pt">Чого в оцінці НЕМАЄ — свідомо</h2>
    <p class="body" style="font-size:8.5pt">Масштабування бюджету реклами (це рішення ПІСЛЯ, не джерело оцінки) · CZ/RO (умова LTV:CAC не виконана) ·
    ефект бренду/GEO (накопичувальний — виміряємо, не обіцяємо) · підняття цін (потребує собівартості по SKU — тест у W2 ПІСЛЯ отримання, потенціал €25–40k окремо) ·
    податки не моделюються (contribution до податків; податковий ефект — з бухгалтером у фінмоделі W2) · валюта: всі € за курсом P&L клієнта, FX-ризик UA/PL відзначено у фінмоделі.</p>
  `, p, n),
  // 3.04 Окупність + ціна бездіяльності
  (p, n) => page('', 'Глава 3.04 · Окупність', `
    <span class="ebrow">Глава 3.04 · Крива окупності та ціна бездіяльності</span>
    <h1 class="big" style="font-size:26pt">Кешова окупність — М3.<br>Прибуткова — М4–М5. Чесно.</h1>
    <table class="t" style="margin-top:4mm;font-size:8pt">
      <tr><th>Місяць</th><th class="num">Ефект у contribution, кум.</th><th class="num">Витрати (WEEXP+нові підрядники), кум.</th><th class="num">Баланс</th><th class="num">+ кеш dead stock, кум.</th></tr>
      <tr><td>М1</td><td class="num">€2k</td><td class="num">€6.4k</td><td class="num" style="color:var(--mark)">−€4.4k</td><td class="num">−€4.4k</td></tr>
      <tr><td>М2</td><td class="num">€8k</td><td class="num">€12.8k</td><td class="num" style="color:var(--mark)">−€4.8k</td><td class="num" style="color:var(--verd7)">+€15k</td></tr>
      <tr><td>М3</td><td class="num">€17k</td><td class="num">€19.2k</td><td class="num" style="color:var(--mark)">−€2.2k</td><td class="num" style="color:var(--verd7)">+€38k</td></tr>
      <tr class="hl"><td><b>М4</b></td><td class="num"><b>€29k</b></td><td class="num">€26.4k</td><td class="num" style="color:var(--verd7)"><b>+€2.6k</b></td><td class="num" style="color:var(--verd7)">+€43k</td></tr>
      <tr><td>М6</td><td class="num">€58k</td><td class="num">€40.8k</td><td class="num" style="color:var(--verd7)">+€17k</td><td class="num" style="color:var(--verd7)">+€62k</td></tr>
      <tr><td>М9</td><td class="num">€112k</td><td class="num">€62.4k</td><td class="num" style="color:var(--verd7)">+€50k</td><td class="num" style="color:var(--verd7)">+€95k</td></tr>
    </table>
    <p class="marg" style="margin-top:2mm">Витрати: WEEXP €6.0k/міс + нові підрядники ≈€0.4–1.2k/міс (копірайтер з М2, студія з М5) — ПОВНИЙ бюджет, як у Звіті 5;
    існуючий розробник (~€1.4k/міс) — поточні витрати клієнта, не нові. Ефект — консервативна крива (≈65% реалізації). Кеш dead stock — каса, не прибуток: показаний окремою колонкою чесно.</p>
    <h2 class="st" style="font-size:12pt;margin-top:4mm">Ціна бездіяльності — якщо не робити нічого</h2>
    <table class="t" style="font-size:8.3pt">
      <tr><th>Горизонт</th><th>Що відбувається (консервативно)</th><th class="num">Ціна</th></tr>
      <tr><td>Кожен місяць</td><td>витік триває: €36k виручки ≈ €13k contribution</td><td class="num">−€13k/міс</td></tr>
      <tr><td>12 місяців</td><td>витік + CAC дорожчає (+8–12%/рік у ніші) + конкурент №2 закріплюється в AI-видачі</td><td class="num" style="color:var(--mark)"><b>−€156k і дорожчий вхід потім</b></td></tr>
      <tr><td>Q4 без підготовки</td><td>OOS 26% на піку + каса в овердрафті + бій на подвоєному обсязі</td><td class="num">найдорожчий квартал повторюється</td></tr>
    </table>
    <div class="callout" style="font-size:8.5pt"><b>Найдешевший місяць для старту — цей.</b> W1 не залежить від сезону, а все, що зроблено до жовтня, множиться сезоном Q4 (38% річної виручки) замість того, щоб згоріти в ньому.</div>
  `, p, n),
  // 3.05 Цільова модель DoD (2 стор)
  (p, n) => page('', 'Глава 3.05 · Цільова модель', `
    <span class="ebrow">Глава 3.05 · Цільова модель (Definition of Done) · 1/2</span>
    <h1 class="big" style="font-size:26pt">«Здоровий Тестик» — 24 пороги.<br>Кожен або пройдено, або ні.</h1>
    <p class="body" style="margin-top:3mm">Цільова модель описана тими самими 12 доменами, що й діагностика — роадмапа (Звіт 4) є механічною різницею станів.
    DoD підписується власником на старті; зміни порогів — лише письмово на контрольних точках.</p>
    <table class="t" style="font-size:7.8pt">
      <tr><th>Домен</th><th>А (сьогодні)</th><th>Б (день 270) — критерій приймання</th><th>Джерело виміру</th></tr>
      <tr><td><b>Business</b></td><td>фінмоделі немає; Allegro 3%</td><td>фінмодель жива (оновлення щомісяця); Allegro contribution ≥8%; правило знижок діє ≥6 міс; каса Q4 без овердрафтів</td><td>P&L-ритм · юніт-звіт каналу</td></tr>
      <tr><td><b>Market</b></td><td>позиція «як усі»; EUIPO ні</td><td>позиція «експерт догляду» на сайті/креативах/контенті; EUIPO подано; щокв. конкурентний зріз ≥2 поспіль</td><td>артефакти + журнал</td></tr>
      <tr><td><b>Product</b></td><td>33% dead stock; ціни наосліп</td><td>dead stock ≤15% SKU; 100% SKU з повною собівартістю; прайс-тест ядра проведено; атрибутика топ-200 = 100%</td><td>ERP + фід</td></tr>
      <tr><td><b>Customer</b></td><td>NPS немає; 2-га ≤90 дн: 9%</td><td>NPS міряється (2 заміри); 2-га покупка ≤90 дн ≥18%; VoC-теми щотижня в ритмі</td><td>NPS-звіт · когорти</td></tr>
      <tr><td><b>Website</b></td><td>CR 1.22% · checkout 43.6% · LCP 4.6s</td><td>CR ≥1.9% · mobile ≥1.4% · checkout ≥60% · LCP ≤2.5s · A/B ≥2 тести/міс ≥2 міс поспіль</td><td>GA4 (звірений) · CrUX</td></tr>
      <tr><td><b>SEO/GEO</b></td><td>індекс ×8 · 3/6 кластерів · AI 0/48</td><td>індекс ≤1.3k URL · 6/6 кластерів мають хаби · зірки на топ-40 · AI-панель: тренд ↑ 3 заміри поспіль (не абсолют — він не повністю наш)</td><td>GSC · панель</td></tr>
    </table>
  `, p, n),
  (p, n) => page('', 'Глава 3.05 · Цільова модель', `
    <span class="ebrow">Глава 3.05 · Цільова модель (Definition of Done) · 2/2</span>
    <table class="t" style="font-size:7.8pt">
      <tr><th>Домен</th><th>А (сьогодні)</th><th>Б (день 270) — критерій приймання</th><th>Джерело виміру</th></tr>
      <tr><td><b>Acquisition</b></td><td>бренд 31% платних; виручка-біддинг</td><td>бренд <10%; біддинг за contribution; креативи 4+/міс ≥3 міс; правило масштабування дотримано</td><td>search terms · кабінети</td></tr>
      <tr><td><b>CRM</b></td><td>1 flow · 4.8% виручки · DMARC ні</td><td>6 flows живі; CRM ≥18% виручки; repeat ≥22%; деліверабіліті ≥97%, скарги <0.2%</td><td>ESP + бекенд</td></tr>
      <tr><td><b>Analytics</b></td><td>GA4 −22% · Excel/міс</td><td>розбіжність <5% (4 тижні поспіль); маржа в подіях; дашборд = основа читок ≥3 міс</td><td>звірка · журнал читок</td></tr>
      <tr><td><b>Operations</b></td><td>OOS 17% · бій 2.1% · OTIF ні</td><td>OOS топ-20 <7%; бій ≤0.7%; OTIF ≥95% і в дашборді; другий постачальник на 2 hero-категоріях</td><td>ERP · перевізники</td></tr>
      <tr><td><b>Technology</b></td><td>без staging; бекап не тестований</td><td>релізи 100% через staging; бекап-тест щокварталу; SLA підписано; TTFB ≤0.8s</td><td>журнал релізів</td></tr>
      <tr><td><b>Organization</b></td><td>все на власнику; ритму немає</td><td>політики делегування діють; власники каналів з KPI; читки без власника працюють; <b>тест 3 тижнів відпустки (М6–7) без падіння метрик >5%</b></td><td>оргсхема · журнал · дашборд</td></tr>
    </table>
    <h2 class="st" style="font-size:12pt;margin-top:4mm">Інтегральні пороги стану Б</h2>
    <div class="kpis">
      ${kpi('≥75', 'Health Score (зараз 52)', 'ok')}
      ${kpi('12/12', 'доменів на L3+', 'ok')}
      ${kpi('€159k/міс', 'run-rate виручки (100% реалізації)', 'ok')}
      ${kpi('≥2.5', 'PL LTV:CAC → відкриває CZ/RO', 'ok')}
    </div>
    <p class="body" style="font-size:8.5pt"><b>Про мрію «3 місяці відпустки»:</b> в анкеті власник назвав 3 місяці; DoD дня 270 фіксує чесний проміжний поріг — 3 тижні без падіння.
    Шлях 3 тижні → 3 місяці — це М9–М15: другий цикл делегування після того, як власники каналів проживуть повний сезон. Не занижуємо мрію — розкладаємо її на етапи.</p>
    <p class="marg">Ціль €250k/міс (18 міс): стан Б (€159k) + масштабування реклами на здоровій воронці (+€35–50k, правило з d07) + CZ/RO після КТ-4 (+€25–40k) — розкладка у фінмоделі W2. Це маршрут, не обіцянка: кожен доданок має свою умову входу.</p>
  `, p, n),
];

const chapters = [
  ['3.01', 'Головний висновок для CEO — три причини і чого не робити', 3],
  ['3.02', 'Міст P&L: €123k → €159k/міс із дисконтом перекриттів', 4],
  ['3.03', '8 важелів: розрахунок і чутливість кожного', 5],
  ['3.04', 'Крива окупності (М4–М5) і ціна бездіяльності', 6],
  ['3.05', 'Цільова модель (DoD): 24 вимірні пороги', '7–8'],
];
const total = PAGES.length + 2;
doc('zvit-3-hroshi.html', 'Звіт 3 · Гроші: розрив і цільова модель — Тестик', [
  cover(3, 'Фінансовий звіт:<br>розрив і цільова модель', 'Скільки коштує розрив (€433k виручки ≈ €156k прибутку/рік), як він розкладається на 8 важелів із чутливістю, коли окупається робота (М4–М5) і які 24 пороги означають «готово». Мова, якою ухвалюється рішення.', '8 сторінок · міст P&L · сценарії песиміст/база/оптиміст · DoD'),
  toc(chapters, 2, total),
  ...PAGES.map((f, i) => f(i + 3, total)),
].join(''));
console.log('r3 done:', total, 'pages');

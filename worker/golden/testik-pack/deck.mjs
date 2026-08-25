// Звіт 1 · Презентація аудиту — 16:9, 18 слайдів. Виправлення: contribution поруч
// із герой-числами, чесна окупність М4–М5, повний бюджет, слайди «ціна бездіяльності» і «ризики».
import { doc } from './gen.mjs';

const sl = (cls, body, n) => [cls, body];
const render = (cls, body, i, N) => `<div class="sl ${cls}">${body}<div class="foot"><span>WEEXP · Глибокий аудит · «Тестик» · дані станом на 20.08.2026</span><span style="color:#D6362B">ПРОТОТИП · СИНТЕТИЧНІ ДАНІ</span><span>${String(i).padStart(2, '0')} / ${N}</span></div></div>`;
function slideRadar() {
  const vals = [['Business',2],['Market',2],['Product',2],['Customer',1],['Website',2],['SEO',2],['Acquisition',3],['CRM',1],['Analytics',1],['Operations',2],['Technology',2],['Organization',2]];
  const size = 460, cx = size/2, cy = size/2, R = size/2 - 88;
  const pt = (i, r) => { const a = -Math.PI/2 + i*2*Math.PI/vals.length; return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; };
  const grid = [1,2,3,4,5].map((lv)=>'<polygon points="'+vals.map((_,i)=>pt(i,R*lv/5).map(x=>x.toFixed(1)).join(',')).join(' ')+'" fill="none" stroke="#dfe4e6"/>').join('');
  const poly = '<polygon points="'+vals.map((v,i)=>pt(i,R*v[1]/5).map(x=>x.toFixed(1)).join(',')).join(' ')+'" fill="rgba(214,54,43,.15)" stroke="#D6362B" stroke-width="2.5"/>';
  const dots = vals.map((v,i)=>{const [x,y]=pt(i,R*v[1]/5);return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4" fill="'+(v[1]<=1?'#D6362B':'#070d12')+'"/>';}).join('');
  const labs = vals.map((v,i)=>{const [x,y]=pt(i,R+30);return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" font-family="IBM Plex Mono,monospace" font-size="12" fill="'+(v[1]<=1?'#D6362B':'#6E7C86')+'" text-anchor="middle" font-weight="'+(v[1]<=1?'700':'400')+'">'+v[0]+' L'+v[1]+'</text>';}).join('');
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+grid+poly+dots+labs+'</svg>';
}
const S = [];

// 01 обкладинка
S.push(sl('ink', `
  <span class="ebrow">Звіт 1 із 5 · Читка результатів</span>
  <h1 style="font-size:84px">«Тестик» щомісяця не доотримує<br><span class="mk">≈€13 000 прибутку</span>.<br>Ми знайшли, де саме.</h1>
  <p style="margin-top:32px;font-family:var(--mono);font-size:15px;color:rgba(255,255,255,.55)">≈€156k прибутку/рік (€433k у виручковому еквіваленті) · 12 аудитів · 160 перевірок · 14 систем · 24 місяці замовлень · вивід — Звіт 3, гл. 3.00</p>
`, 1));

// 02 головний висновок
S.push(sl('', `
  <span class="ebrow">Головний висновок</span>
  <h1>Попиту достатньо.<br>Гроші зливаються <span class="mk">після кліку</span>.</h1>
  <p style="margin-top:40px;font-size:24px;line-height:1.45;color:#3A3D42;max-width:1050px">
    Реклама окупається: CAC €18 — нижчий за маржу першого замовлення €21.8. Але з тих, хто почав оформлення, платить лише 43.6%.
    Друга покупка — у 13% клієнтів проти 25–30% у ніші. І компанія цього не бачить:
    аналітика розходиться з реальністю на 22%.</p>
  <p style="margin-top:28px;font-family:var(--mono);font-size:13px;color:#94A0A8">джерела: бекенд-замовлення 24 міс · GA4 · кабінети · метод Baymard · Звіт 2, глави 2.08 / 2.11 / 2.12</p>
`, 2));

// 03 число-герой + contribution поруч
S.push(sl('ink', `
  <span class="ebrow">Розрив у грошах · без подвійного рахунку</span>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="heron" style="color:#D6362B;font-size:190px">€433k</div>
    <p style="margin-top:6px;font-size:24px;color:rgba(255,255,255,.85)">виручки на рік · <b style="color:#fff">у прибутку (contribution) це ≈€156k</b></p>
    <p style="margin-top:10px;font-size:17px;color:rgba(255,255,255,.6)">воронкова модель: важелі — множники вузлів воронки, ефект = добуток (не сума) · програма = добуток ×1.325 по сайту + прибуткові важелі</p>
    <p style="margin-top:10px;font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.45)">сценарії: песиміст ≈€250k · база €433k · стеля за бенчами ≈€600k+ — розрахунок у Звіті 3, гл. 3.03</p>
  </div>
`, 3));

// 04 воронка
S.push(sl('', `
  <span class="ebrow">Доказ №1 · Воронка сайту, місяць</span>
  <h1>З 185 000 візитів платять 2 260.<br>Втрата — <span class="mk">у кроці оплати</span>.</h1>
  <div style="display:flex;gap:8px;align-items:flex-end;margin-top:52px;height:260px">
    ${[['Сесії', '185 000', 100, ''], ['Картка товару', '96 200', 52, ''], ['Кошик', '12 950', 7.0, ''], ['Checkout', '5 180', 2.8, ''], ['Покупка', '2 260', 1.22, 'bad']]
      .map(([l, v, pct, bad]) => `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">
        <div style="font-family:var(--mono);font-size:16px;margin-bottom:6px;${bad ? 'color:#D6362B;font-weight:700' : ''}">${v}</div>
        <div style="height:${Math.max(pct, 2.2)}%;background:${bad ? '#D6362B' : '#070d12'}"></div>
        <div style="font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6E7C86;margin-top:8px">${l}</div></div>`).join('')}
  </div>
  <p style="margin-top:24px;font-family:var(--mono);font-size:13px;color:#94A0A8">checkout completion 43.6% — бенчмарк 65%+ (Baymard) · GA4, звірено з бекендом · Звіт 2, гл. 2.08</p>
`, 4));

// 05 mobile
S.push(sl('', `
  <span class="ebrow">Доказ №2 · Мобільна швидкість</span>
  <h1>74% трафіку — mobile.<br>Він вантажиться <span class="mk">4.6 секунди</span>.</h1>
  <div style="display:flex;gap:64px;margin-top:56px">
    <div><div style="font-family:var(--mono);font-weight:700;font-size:110px;letter-spacing:-.04em;color:#D6362B">0.9%</div>
      <div style="font-family:var(--mono);font-size:13px;color:#6E7C86;letter-spacing:.1em;text-transform:uppercase;margin-top:6px">конверсія mobile</div></div>
    <div style="align-self:center;font-size:38px;color:#94A0A8">проти</div>
    <div><div style="font-family:var(--mono);font-weight:700;font-size:110px;letter-spacing:-.04em;color:#070d12">2.1%</div>
      <div style="font-family:var(--mono);font-size:13px;color:#6E7C86;letter-spacing:.1em;text-transform:uppercase;margin-top:6px">конверсія desktop</div></div>
  </div>
  <p style="margin-top:40px;font-size:20px;color:#3A3D42;max-width:1000px">LCP 4.6s · INP 310ms · CLS 0.18 — всі три метрики Google червоні (пороги 2.5s / 200ms / 0.1). Причини відомі: зображення, скрипти, CSS, кеш — усе лікується в межах OpenCart.</p>
  <p style="margin-top:16px;font-family:var(--mono);font-size:13px;color:#94A0A8">CrUX p75 · розкладка причин — Звіт 2, гл. 2.08 §4</p>
`, 5));

// 06 retention
S.push(sl('', `
  <span class="ebrow">Доказ №3 · Утримання</span>
  <h1>Кожен клієнт купує <span class="mk">1.15 раза</span>.<br>База на 41 000 контактів мовчить.</h1>
  <div style="margin-top:52px;max-width:1050px">
    ${[['Повторні покупки, 365 дн', '13%', 13, 27, 'бенч ніші 25–30%'], ['Частка виручки з email/CRM', '4.8%', 4.8, 25, 'зрілий D2C: 25%+']]
      .map(([l, v, pct, b, bt]) => `<div style="margin-bottom:34px">
        <div style="display:flex;justify-content:space-between;font-size:18px;margin-bottom:8px"><span>${l}</span><span style="font-family:var(--mono);font-weight:700;color:#D6362B">${v}</span></div>
        <div style="position:relative;height:26px;background:#E7EAE7">
          <div style="position:absolute;left:0;top:0;bottom:0;width:${pct * 2.4}%;background:#D6362B"></div>
          <div style="position:absolute;left:${b * 2.4}%;top:-6px;bottom:-6px;width:2px;background:#2A6D5C"></div>
          <span style="position:absolute;left:${b * 2.4 + 1}%;top:-30px;font-family:var(--mono);font-size:12px;color:#2A6D5C">${bt}</span>
        </div></div>`).join('')}
  </div>
  <p style="font-size:20px;color:#3A3D42;max-width:1020px">Один welcome-ланцюжок із шести потрібних. Вікно повернення (30–60 день) — порожнє. І застереження: базу будитимемо обережно — 62% адрес старші двох років, різка реактивація спалить домен.</p>
  <p style="margin-top:12px;font-family:var(--mono);font-size:13px;color:#94A0A8">замовлення 24 міс · eSputnik · план прогріву — Звіт 2, гл. 2.11</p>
`, 6));


// 06b — історія (емоційний якір)
S.push(sl('ink', `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;max-width:1050px">
    <span class="ebrow">Один відгук, який пояснює половину пакета</span>
    <p style="font-size:30px;line-height:1.5;color:rgba(255,255,255,.92)">«Замовила каструлю мамі на день народження. Приїхала <span style="color:#F08379">розбита</span>.
    Поки переслали заміну — свято минуло. Більше не замовлятиму»</p>
    <p style="margin-top:22px;font-family:var(--mono);font-size:14px;color:rgba(255,255,255,.5)">відгук №147 з 214 тегованих · тема «доставка/бій» — 62% усього негативу</p>
    <p style="margin-top:30px;font-size:20px;color:rgba(255,255,255,.75)">Це не одна історія: 2.1% відправлень приходять з боєм, і після бою клієнт повертається вдвічі рідше.
    Посуд — подарункова категорія: зірваний подарунок = втрачений клієнт назавжди. Фікс — стандарт пакування, тиждень 1.</p>
  </div>
`, 0));

// 07 аналітика
S.push(sl('ink', `
  <span class="ebrow">Доказ №4 · Аналітика</span>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="heron" style="color:#fff">22%</div>
    <p style="margin-top:6px;font-size:26px;color:rgba(255,255,255,.85);max-width:1000px">замовлень <span style="color:#F08379">невидимі для GA4</span>.
    Минулорічна «оптимізація» різала найплатоспроможніших клієнтів — бо їх не бачила.</p>
    <p style="margin-top:16px;font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.45)">Apple Pay redirect ≈13% + consent ≈7% + дублі · звірка по днях, 6 міс · фікс ≈30 год у хвилі 1 · Звіт 2, гл. 2.12</p>
  </div>
`, 7));

// 08 Allegro
S.push(sl('', `
  <span class="ebrow">Доказ №5 · Канали</span>
  <h1>Сайт заробляє 12% з обороту.<br>Allegro — <span class="mk">3%</span>. Ніхто не рахував.</h1>
  <div style="display:flex;gap:10px;margin-top:60px;max-width:900px">
    <div style="flex:95"><div style="height:160px;background:#070d12;position:relative"><span style="position:absolute;bottom:10px;left:14px;color:#fff;font-family:var(--mono);font-size:15px">сайт · €95k/міс</span></div>
      <div style="font-family:var(--mono);font-size:15px;margin-top:10px">contribution <b>12%</b></div></div>
    <div style="flex:28"><div style="height:160px;background:#D6362B;position:relative"><span style="position:absolute;bottom:10px;left:14px;color:#fff;font-family:var(--mono);font-size:15px">Allegro · €28k</span></div>
      <div style="font-family:var(--mono);font-size:15px;margin-top:10px;color:#D6362B">contribution <b>3%</b></div></div>
  </div>
  <p style="margin-top:36px;font-size:20px;color:#3A3D42;max-width:1020px">Канал не закриваємо — лікуємо: спершу тест цін на 10 SKU (2 тижні), потім розкат на 40, потім логістика. Якщо обсяг просяде понад 15% — відкат (ризик R5 у реєстрі).</p>
  <p style="margin-top:12px;font-family:var(--mono);font-size:13px;color:#94A0A8">юніт-розрахунок каналу — Звіт 2, гл. 2.04 · ризики — Звіт 4, гл. 4.04</p>
`, 8));

// 09 матриця — радар зрілості (канон charts.ts svgRadar)
S.push(sl('', `
  <span class="ebrow">Системний діагноз · Радар зрілості, 12 аудитів</span>
  <h1>Хвороба не в маркетингу.<br>У <span class="mk">даних і організації</span>.</h1>
  <div style="display:flex;gap:48px;align-items:center;margin-top:8px">
    ${slideRadar()}
    <div style="flex:1">
      <div style="font-family:var(--mono);font-weight:700;font-size:88px;letter-spacing:-.04em">52<span style="font-size:36px;color:#94A0A8">/100</span></div>
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;margin-top:2px">Health Score · розрахунок показано у Звіті 2, гл. 2.17</div>
      <p style="margin-top:22px;font-size:19px;line-height:1.5;color:#3A3D42">Провал радара — три домени на L1: <b>Customer, CRM, Analytics</b>. Саме вони тримають стелю решти.
      Єдиний зрілий домен — Acquisition (L3): масштабувати його поверх трьох L1 означає купувати некерований трафік. Тому порядок хвиль саме такий.</p>
      <p style="margin-top:14px;font-family:var(--mono);font-size:12px;color:#94A0A8">шкала L1–L5 за CMMI · рівень = найнижчий ПОВНІСТЮ виконаний</p>
    </div>
  </div>
`, 9));

// 10 розворот
S.push(sl('verd', `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <span class="ebrow" style="color:#6FAA9A">Від діагнозу — до маршруту</span>
    <h1 style="font-size:76px;max-width:1050px">Нічого з цього не лікується<br>«ще одним підрядником».<br>Лікується системою.</h1>
  </div>
`, 10));


// 10b — «ми це вже пробували»
S.push(sl('', `
  <span class="ebrow">Головне заперечення цієї кімнати — розберемо чесно</span>
  <h1>«Ми вже пробували». Так.<br>Чотири рази. Ось чому не вийшло.</h1>
  <table style="width:100%;border-collapse:collapse;margin-top:34px;font-size:16.5px">
    <tr style="border-bottom:2.5px solid #070d12"><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Спроба (12 міс)</th><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Чим скінчилось</th><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Справжня причина → що інакше цього разу</th></tr>
    ${[['Performance-агентство, 6 міс', 'CAC +22%', 'оптимізація по GA4, який не бачив 22% замовлень → спершу лагодимо вимірювання (тиждень 1–3)'],
       ['Редизайн головної', 'CR без змін', 'головна — не вузьке місце → працюємо там, де втрати: checkout і mobile'],
       ['Знижки −25% на залежаний товар', 'виручка ↑, прибуток ↓', 'без собівартості по SKU → правило: жодної знижки без contribution-розрахунку'],
       ['Найм маркетолога-универсала', 'пішов за 4 міс', 'роль без даних і ритму → спочатку дашборд і щотижнева читка, потім люди']]
      .map(([a, b, c]) => `<tr style="border-bottom:1px solid #dfe4e6"><td style="padding:11px 8px;font-weight:700">${a}</td><td style="padding:11px 8px;color:#D6362B;font-family:var(--mono)">${b}</td><td style="padding:11px 8px;color:#3A3D42">${c}</td></tr>`).join('')}
  </table>
  <p style="margin-top:26px;font-size:19px;color:#3A3D42;max-width:1060px">Усі чотири вмерли з однієї причини: <b>не було власника метрики і ритму перевірки</b>. Саме це — а не задачі — і є те, що ми будуємо 9 місяців.</p>
`, 0));

// 11 важелі
S.push(sl('', `
  <span class="ebrow">Вісім важелів · виручка на рік · сценарій «база»</span>
  <h1>Сім важелів + кеш-важіль:<br>сума стель €731k → добуток €433k.</h1>
  <div style="margin-top:40px;max-width:1080px">
    ${[['Checkout 43.6% → 60%', 190, 'high'], ['Retention 13% → 20%', 150, 'high'], ['Mobile LCP 4.6 → 2.5s', 120, 'med'], ['OOS топ-20: 17% → 7%', 95, 'high'], ['SEO: фасети, кластери, зірки', 85, 'med'], ['Allegro: ціни й логістика', 60, 'high'], ['Бій 2.1% → 0.7%', 31, 'high']]
      .map(([l, v, c], i) => `<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
        <span style="width:330px;font-size:16px">${l}</span>
        <div style="flex:1;height:21px;background:#E7EAE7;position:relative"><div style="position:absolute;left:0;top:0;bottom:0;width:${(v / 190) * 100}%;background:${i === 0 ? '#D6362B' : '#070d12'}"></div></div>
        <span style="font-family:var(--mono);font-weight:700;font-size:17px;width:80px;text-align:right">€${v}k</span>
        <span style="font-family:var(--mono);font-size:11px;color:${c === 'high' ? '#2A6D5C' : '#a06a00'};width:40px">${c}</span></div>`).join('')}
  </div>
  <p style="margin-top:20px;font-family:var(--mono);font-size:13.5px;color:#6E7C86">суми на барах — СТЕЛІ важелів окремо (Σ €731k); важелі перетинаються як множники воронки → чесний добуток програми: <b style="color:#070d12">€433k виручки ≈ €156k прибутку/рік</b> + €55k кешу (одноразово) · перехід сума→добуток і сценарії — Звіт 3, гл. 3.03</p>
`, 11));

// 12 ціна бездіяльності (НОВИЙ)
S.push(sl('ink', `
  <span class="ebrow">Ціна бездіяльності</span>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <h1 style="font-size:64px">Не вирішувати — теж рішення.<br>Воно коштує <span class="mk">€13k прибутку на місяць</span>.</h1>
    <div style="display:flex;gap:56px;margin-top:48px">
      <div><div style="font-family:var(--mono);font-weight:700;font-size:54px;color:#F08379">−€13k</div><div style="font-size:14px;color:rgba(255,255,255,.65);margin-top:6px">contribution щомісяця, поки витік триває</div></div>
      <div><div style="font-family:var(--mono);font-weight:700;font-size:54px;color:#F08379">+8–12%</div><div style="font-size:14px;color:rgba(255,255,255,.65);margin-top:6px">річне подорожчання CAC у ніші — вхід потім дорожчий</div></div>
      <div><div style="font-family:var(--mono);font-weight:700;font-size:54px;color:#F08379">11/48</div><div style="font-size:14px;color:rgba(255,255,255,.65);margin-top:6px">AI-відповідей уже займає конкурент №2 — нова полиця закривається</div></div>
    </div>
    <p style="margin-top:44px;font-size:19px;color:rgba(255,255,255,.8);max-width:1000px">І найголовніше: Q4 (38% річної виручки) повториться на хворій системі — з OOS 26%, боєм на подвоєному обсязі та касою в овердрафті.</p>
  </div>
`, 12));

// 13 роадмапа
S.push(sl('', `
  <span class="ebrow">Роадмапа · 9 місяців, три хвилі</span>
  <h1>Спочатку прилади. Потім гроші.<br>Потім масштаб.</h1>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:44px">
    <div style="border-top:6px solid #D6362B;padding-top:16px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#D6362B">Хвиля 1 · дні 1–30 · по тижнях</div>
      <div style="font-size:21px;font-weight:700;margin:10px 0 10px">Полагодити й зупинити</div>
      <p style="font-size:15.5px;line-height:1.5;color:#3A3D42">GA4-фікс · DMARC · пакування · доставка видима до оплати · Allegro-тест цін · бренд-виключення · розпродаж dead stock · політики делегування</p></div>
    <div style="border-top:6px solid #070d12;padding-top:16px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#6E7C86">Хвиля 2 · дні 31–120</div>
      <div style="font-size:21px;font-weight:700;margin:10px 0 10px">Запустити двигуни</div>
      <p style="font-size:15.5px;line-height:1.5;color:#3A3D42">checkout-поля · 6 CRM-flows із прогрівом · LCP-пакет · закупівлі під OOS · щотижневий дашборд · staging · прайс-тест ядра</p></div>
    <div style="border-top:6px solid #2A6D5C;padding-top:16px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#2A6D5C">Хвиля 3 · міс 4–9</div>
      <div style="font-size:21px;font-weight:700;margin:10px 0 10px">Система і масштаб</div>
      <p style="font-size:15.5px;line-height:1.5;color:#3A3D42">SEO-фасети й контент-ядро · юніт-економіка PL → поріг CZ/RO · власники каналів · тест відпустки (М6–7) · Q4-план</p></div>
  </div>
  <p style="margin-top:30px;font-family:var(--mono);font-size:13px;color:#94A0A8">Гант 12×9 із залежностями і ресурсною моделлю без перевантажень — Звіт 4 · 6 контрольних точок, найдовша пауза між ними — 6 тижнів</p>
`, 13));


// 13b — три формати участі (архітектура вибору)
S.push(sl('', `
  <span class="ebrow">Три способи пройти цей маршрут</span>
  <h1>Обирається не «чи робити».<br>Обирається — хто веде.</h1>
  <div style="display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:20px;margin-top:40px">
    <div style="border:2px solid #94A0A8;padding:20px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.12em;color:#6E7C86">ФОРМАТ А · СУПРОВІД</div>
      <div style="font-family:var(--mono);font-weight:700;font-size:40px;margin:10px 0">€2.9k/міс</div>
      <p style="font-size:15.5px;line-height:1.5;color:#3A3D42">Ритм, пріоритети, приймання — наші. Виконання — повністю ваше. Для команди, якій бракує лише навігації.</p>
      <p style="font-family:var(--mono);font-size:12px;color:#94A0A8;margin-top:12px">чесно: 4 минулі DIY-спроби вмерли без ритму — формат А лишає виконання там само</p></div>
    <div style="border:3px solid #070d12;padding:20px;background:#F4F6F5">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.12em;color:#D6362B">ФОРМАТ Б · РАЗОМ · рекомендовано</div>
      <div style="font-family:var(--mono);font-weight:700;font-size:40px;margin:10px 0">€6.0k/міс</div>
      <p style="font-size:15.5px;line-height:1.5;color:#26292e">Ми: аналітика, CRO/CRM, ритм, підрядники, КТ. Ви: PM і виконавці. Гарантія КТ-2 нашим коштом.</p>
      <p style="font-family:var(--mono);font-size:12px;color:#6E7C86;margin-top:12px">повний бюджет €70–74k / 9 міс — наступний слайд</p></div>
    <div style="border:2px solid #94A0A8;padding:20px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.12em;color:#6E7C86">ФОРМАТ В · ПІД КЛЮЧ</div>
      <div style="font-family:var(--mono);font-weight:700;font-size:40px;margin:10px 0">€9.5k+/міс</div>
      <p style="font-size:15.5px;line-height:1.5;color:#3A3D42">Формат Б + наші підрядники під нашим управлінням. Коли внутрішньої ємності немає зовсім.</p></div>
  </div>
  <p style="margin-top:28px;font-family:var(--mono);font-size:13px;color:#94A0A8">перехід Б → А можливий після КТ-3, коли власники каналів і ритм живуть самі · деталі і умови — Звіт 5</p>
`, 0));

// 14 гроші проекту — формат AD-15: CAPEX + ретейнери, повний бюджет
S.push(sl('', `
  <span class="ebrow">Інвестиція · формат AD-15: разово + ретейнери · без дрібного шрифту</span>
  <h1>€70–74k за 9 місяців.<br>Окупність — <span class="mk">М4–М5</span>, кешово раніше.</h1>
  <table style="width:100%;border-collapse:collapse;margin-top:36px;font-size:17px">
    <tr style="border-bottom:2.5px solid #070d12"><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Стаття</th><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Тип</th><th style="text-align:right;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Сума 9 міс</th><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Статус</th></tr>
    ${[['WEEXP формат Б', 'ретейнер €6.0k × 9', '€54 000', 'мінус залік аудиту в М1'],
       ['Копірайтер (М2–М9)', 'ретейнер €0.4k × 8', '≈€3 200', 'нова витрата — згода у Звіті 5'],
       ['Контент-студія (М5–М9)', 'ретейнер €0.8k × 5', '≈€4 000', 'нова витрата — згода у Звіті 5'],
       ['Разове (CAPEX): пакувальні матеріали, тест', 'разово', '≈€800', 'W1'],
       ['Ваш існуючий розробник', 'поточна витрата ≈€1.4k×9', '≈€12 600', 'НЕ нова — для повноти картини']]
      .map(([a,b,c,d]) => `<tr style="border-bottom:1px solid #dfe4e6"><td style="padding:10px 8px;font-weight:700">${a}</td><td style="padding:10px 8px;font-family:var(--mono);font-size:14px">${b}</td><td style="padding:10px 8px;text-align:right;font-family:var(--mono);font-weight:700">${c}</td><td style="padding:10px 8px;color:#3A3D42;font-size:14px">${d}</td></tr>`).join('')}
  </table>
  <p style="margin-top:26px;font-size:19px;color:#3A3D42;max-width:1060px">Разом нових грошей ≈€62k (з разовим CAPEX €800), повна інвестиція €70–74k — проти €156k/рік потенціалу в прибутку.
  Крива окупності по місяцях — Звіт 3, гл. 3.04: прибуткова окупність М4–М5, кешово раніше (€40–55k із dead stock у М2–3).</p>
`, 14));

// 15 команда
S.push(sl('', `
  <span class="ebrow">Команда · хто що закриває</span>
  <h1>Ми не «робимо за вас».<br>Ми будуємо систему разом.</h1>
  <table style="width:100%;border-collapse:collapse;margin-top:40px;font-size:16px">
    <tr style="border-bottom:2.5px solid #070d12"><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:9px 8px">Напрям</th>
      <th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:9px 8px">WEEXP</th>
      <th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:9px 8px">Підрядники</th>
      <th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:9px 8px">Команда «Тестик»</th></tr>
    ${[['Аналітика', 'архітектура, дашборд, звірка', '—', 'PM: доступи, приймання'],
       ['CRO / mobile', 'гіпотези, ТЗ, аналіз', 'ваш розробник (≤40 год/міс — перевірено)', 'PM: релізи через staging'],
       ['CRM / retention', 'сценарії, прогрів, запуск', 'копірайтер (новий, €400/міс)', 'маркетолог 25%'],
       ['SEO / контент (W3)', 'стратегія, ТЗ', 'студія (нова, з М5, €800/міс)', 'контентник'],
       ['Операції', 'правила, консультації', '—', 'ops-лід'],
       ['Ритм і PM', 'фасилітація · роль PM у М1 до найму', '—', 'PM з тижня 5–6 · власник 2 год/тиж']]
      .map(([a, b, c, d]) => `<tr style="border-bottom:1px solid #dfe4e6"><td style="padding:10px 8px;font-weight:700">${a}</td><td style="padding:10px 8px">${b}</td><td style="padding:10px 8px;color:#3A3D42">${c}</td><td style="padding:10px 8px;color:#3A3D42">${d}</td></tr>`).join('')}
  </table>
  <p style="margin-top:20px;font-family:var(--mono);font-size:13px;color:#94A0A8">ресурсна модель по місяцях, жодної ролі понад ємність — Звіт 4, гл. 4.02</p>
`, 15));

// 16 ризики (НОВИЙ)
S.push(sl('', `
  <span class="ebrow">Ризики · ми їх бачимо і тримаємо</span>
  <h1>8 ризиків плану.<br>У кожного — мітигація і план Б.</h1>
  <table style="width:100%;border-collapse:collapse;margin-top:36px;font-size:15.5px">
    <tr style="border-bottom:2.5px solid #070d12"><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Топ-4 ризики</th><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;padding:8px">Мітигація</th></tr>
    ${[['Розробник один на всю платформу', 'SLA + документація (W2) · другий підрядник «на підхваті» з М3'],
       ['PM не найнято вчасно', 'WEEXP тримає роль у М1 · найм стартує до кікофу'],
       ['Реактивація бази палить домен', 'прогрів 15%/тиждень · стоп-правило: скарги >0.2%'],
       ['Allegro-ціни просаджують обсяг', 'тест на 10 SKU 2 тижні до розкату · відкат при −15%']]
      .map(([r, m]) => `<tr style="border-bottom:1px solid #dfe4e6"><td style="padding:11px 8px;font-weight:700">${r}</td><td style="padding:11px 8px;color:#3A3D42">${m}</td></tr>`).join('')}
  </table>
  <p style="margin-top:26px;font-size:18px;color:#3A3D42;max-width:1000px">Повний реєстр 8 ризиків із тригерами планів Б — Звіт 4, гл. 4.04. Ризики не ховаємо в додатки — вони частина плану.</p>
`, 16));

// 17 точка Б — три горизонти (канон AD-15: тактика 0–3 · програма 3–12 · стратегія 12–36)
S.push(sl('verd', `
  <span class="ebrow" style="color:#6FAA9A">Точка Б · три горизонти (канон AD-15)</span>
  <h1>Куди прийдемо — і що за горизонтом</h1>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px;margin-top:40px">
    <div style="border-top:5px solid rgba(255,255,255,.9);padding-top:16px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6FAA9A">0–3 міс · тактика</div>
      <p style="font-size:17px;line-height:1.55;color:rgba(255,255,255,.9);margin-top:12px">GA4 ≤5% · checkout ≥52% · бій ≤0.9% · CRM ≥8% виручки · кеш ≥€40k із dead stock · брендові кліки &lt;10% · ритм читок живий</p>
      <p style="font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.5);margin-top:10px">= цілі дня 90, Звіт 4 гл. 4.03</p></div>
    <div style="border-top:5px solid rgba(255,255,255,.9);padding-top:16px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6FAA9A">3–12 міс · програма</div>
      <p style="font-size:17px;line-height:1.55;color:rgba(255,255,255,.9);margin-top:12px">CR ≥1.7–1.9% · repeat ≥22% · CRM ≥18% · LCP ≤2.5s · OOS &lt;7% · 12/12 доменів L3+ · Health ≥75 · тест 3 тижнів відпустки · run-rate ≈€160k/міс</p>
      <p style="font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.5);margin-top:10px">= 24 пороги DoD, Звіт 3 гл. 3.05</p></div>
    <div style="border-top:5px solid rgba(255,255,255,.9);padding-top:16px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6FAA9A">12–36 міс · стратегія</div>
      <p style="font-size:17px;line-height:1.55;color:rgba(255,255,255,.9);margin-top:12px">масштабування реклами на здоровій воронці · CZ/RO після порога «PL окупається 1-ю покупкою» · рішення по платформі (TCO) · автономність до «3 місяців» · шлях до €250k/міс</p>
      <p style="font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.5);margin-top:10px">= кожен доданок зі своєю умовою входу</p></div>
  </div>
  <p style="margin-top:30px;font-size:17px;color:rgba(255,255,255,.8)">Не «стане краще», а пороги «пройдено/ні» — і чесна межа між обіцянкою програми (3–12) і стратегічною ставкою (12–36).</p>
`, 17));

// 18 фінал
S.push(sl('ink', `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <span class="ebrow">Рішення</span>
    <h1 style="font-size:66px">Стартуємо хвилю 1<br>з понеділка 01.09?</h1>
    <div style="display:flex;gap:44px;margin-top:36px">
      <div><div style="font-family:var(--mono);font-weight:700;font-size:40px;color:#fff">100%</div><div style="font-size:14px;color:rgba(255,255,255,.6);max-width:220px">вартості аудиту зараховується — при старті впродовж 30 днів від читки (далі згорає до 50%)</div></div>
      <div><div style="font-family:var(--mono);font-weight:700;font-size:40px;color:#F08379">−€13k</div><div style="font-size:14px;color:rgba(255,255,255,.6);max-width:220px">прибутку коштує кожен місяць паузи — порахованих у цьому ж пакеті</div></div>
      <div><div style="font-family:var(--mono);font-weight:700;font-size:40px;color:#fff">КТ-2</div><div style="font-size:14px;color:rgba(255,255,255,.6);max-width:220px">гарантія нашим коштом: цілі дня 90 не досягнуто → М4 не оплачується, вихід з передачею всього</div></div>
    </div>
    <p style="margin-top:34px;font-size:20px;color:rgba(255,255,255,.8);max-width:1000px">Від вас на старті — пʼять рішень і два години на місяць (Звіт 5). Решта — наша робота.</p>
    <p style="margin-top:36px;font-family:var(--mono);font-size:15px;color:rgba(255,255,255,.55)">hello@weexp.agency · weexp.agency</p>
  </div>
`, 18));

doc('zvit-1-prezentatsiia.html', 'Звіт 1 · Презентація аудиту — Тестик', S.map(([c, b], i) => render(c, b, i + 1, S.length)).join(''));
console.log('r1 done:', S.length, 'slides');

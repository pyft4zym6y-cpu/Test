// Звіт 1 · Презентація аудиту — 16:9, 18 слайдів. Виправлення: contribution поруч
// із герой-числами, чесна окупність М4–М5, повний бюджет, слайди «ціна бездіяльності» і «ризики».
import { doc } from './gen.mjs';

const N = 18;
const foot = (n) => `<div class="foot"><span>WEEXP · Глибокий аудит · «Тестик» · дані станом на 20.08.2026</span><span style="color:#D6362B">ПРОТОТИП · СИНТЕТИЧНІ ДАНІ</span><span>${String(n).padStart(2, '0')} / ${N}</span></div>`;
const sl = (cls, body, n) => `<div class="sl ${cls}">${body}${foot(n)}</div>`;
const S = [];

// 01 обкладинка
S.push(sl('ink', `
  <span class="ebrow">Звіт 1 із 5 · Читка результатів</span>
  <h1 style="font-size:84px">«Тестик»: де бізнес втрачає<br><span class="mk">€433k виручки</span> —<br>≈€156k прибутку на рік</h1>
  <p style="margin-top:32px;font-family:var(--mono);font-size:15px;color:rgba(255,255,255,.55)">12 аудитів · 163 перевірки · 14 відкритих систем · 24 місяці замовлень · усі розрахунки — у Звітах 2–3</p>
`, 1));

// 02 головний висновок
S.push(sl('', `
  <span class="ebrow">Головний висновок</span>
  <h1>Попиту достатньо.<br>Гроші зливаються <span class="mk">після кліку</span>.</h1>
  <p style="margin-top:40px;font-size:24px;line-height:1.45;color:#3A3D42;max-width:1050px">
    Реклама окупається (LTV:CAC 3.4). Але з тих, хто почав оформлення, платить лише 43.6%.
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
    <p style="margin-top:10px;font-size:17px;color:rgba(255,255,255,.6)">вісім важелів, пораховані від бекенд-замовлень; найбільший — повністю, решта — консервативні 45% (перекриваються)</p>
    <p style="margin-top:10px;font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.45)">сценарії: песиміст €249k · база €433k · оптиміст €578k — розрахунки в Звіті 3, гл. 3.03</p>
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

// 09 матриця
S.push(sl('', `
  <span class="ebrow">Системний діагноз · Матриця зрілості, 12 аудитів</span>
  <h1>Хвороба не в маркетингу.<br>У <span class="mk">даних і організації</span>.</h1>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:44px">
    ${[['Business', 2], ['Market', 2], ['Product', 2], ['Customer', 1], ['Website', 2], ['SEO', 2], ['Acquisition', 3], ['CRM', 1], ['Analytics', 1], ['Operations', 2], ['Technology', 2], ['Organization', 2]]
      .map(([d, l]) => `<div style="border:2px solid ${l <= 1 ? '#D6362B' : '#070d12'};padding:13px 12px">
        <div style="font-family:var(--mono);font-weight:700;font-size:32px;${l <= 1 ? 'color:#D6362B' : ''}">L${l}</div>
        <div style="font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6E7C86;margin-top:4px">${d}</div>
        <div style="display:flex;gap:3px;margin-top:8px">${[1, 2, 3, 4, 5].map((i) => `<span style="flex:1;height:5px;background:${i <= l ? (l <= 1 ? '#D6362B' : '#070d12') : '#E7EAE7'}"></span>`).join('')}</div>
      </div>`).join('')}
  </div>
  <p style="margin-top:28px;font-size:19px;color:#3A3D42;max-width:1060px">Health <b class="mono">52/100</b> (розрахунок показаний у Звіті 2, гл. 2.17). Масштабувати зрілий Acquisition поверх трьох L1 — купувати некерований трафік. Тому порядок хвиль саме такий.</p>
`, 9));

// 10 розворот
S.push(sl('verd', `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <span class="ebrow" style="color:#6FAA9A">Від діагнозу — до маршруту</span>
    <h1 style="font-size:76px;max-width:1050px">Нічого з цього не лікується<br>«ще одним підрядником».<br>Лікується системою.</h1>
  </div>
`, 10));

// 11 важелі
S.push(sl('', `
  <span class="ebrow">Вісім важелів · виручка на рік · сценарій «база»</span>
  <h1>Один важіль — повністю.<br>Решта — консервативні 45%.</h1>
  <div style="margin-top:40px;max-width:1080px">
    ${[['Checkout 43.6% → 60%', 190, 'high'], ['Retention 13% → 20%', 150, 'high'], ['Mobile LCP 4.6 → 2.5s', 120, 'med'], ['OOS топ-20: 17% → 7%', 95, 'high'], ['SEO: фасети, кластери, зірки', 85, 'med'], ['Allegro: ціни й логістика', 60, 'high'], ['Бій 2.1% → 0.7%', 31, 'high']]
      .map(([l, v, c], i) => `<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
        <span style="width:330px;font-size:16px">${l}</span>
        <div style="flex:1;height:21px;background:#E7EAE7;position:relative"><div style="position:absolute;left:0;top:0;bottom:0;width:${(v / 190) * 100}%;background:${i === 0 ? '#D6362B' : '#070d12'}"></div></div>
        <span style="font-family:var(--mono);font-weight:700;font-size:17px;width:80px;text-align:right">€${v}k</span>
        <span style="font-family:var(--mono);font-size:11px;color:${c === 'high' ? '#2A6D5C' : '#a06a00'};width:40px">${c}</span></div>`).join('')}
  </div>
  <p style="margin-top:20px;font-family:var(--mono);font-size:13.5px;color:#6E7C86">разом: <b style="color:#070d12">€433k виручки ≈ €156k прибутку/рік</b> · + €55k кешу з dead stock (одноразово) · кожен важіль із трьома сценаріями — Звіт 3, гл. 3.03</p>
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

// 14 гроші проекту (ЧЕСНО)
S.push(sl('', `
  <span class="ebrow">Інвестиція та окупність · повний бюджет, без дрібного шрифту</span>
  <h1>€70–74k за 9 місяців.<br>Окупність — <span class="mk">М4–М5</span>, кешово раніше.</h1>
  <div style="display:flex;gap:48px;margin-top:48px">
    <div><div style="font-family:var(--mono);font-weight:700;font-size:56px">€61k</div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6E7C86;margin-top:6px;max-width:200px">нових грошей: WEEXP €54k + 2 нові підрядники €7.2k</div></div>
    <div><div style="font-family:var(--mono);font-weight:700;font-size:56px">€12.6k</div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6E7C86;margin-top:6px;max-width:200px">ваш існуючий розробник — показуємо для повноти</div></div>
    <div><div style="font-family:var(--mono);font-weight:700;font-size:56px;color:#2A6D5C">€156k</div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6E7C86;margin-top:6px;max-width:200px">річний потенціал у прибутку при 100% реалізації</div></div>
    <div><div style="font-family:var(--mono);font-weight:700;font-size:56px;color:#2A6D5C">€86–109k</div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6E7C86;margin-top:6px;max-width:210px">при реалістичних 55–70% — все одно >1× за перший рік</div></div>
  </div>
  <p style="margin-top:44px;font-size:19px;color:#3A3D42;max-width:1060px">Крива по місяцях — Звіт 3, гл. 3.04: прибуткова окупність настає на М4–М5 (не «з другого місяця» — кажемо чесно); кешово — раніше, бо розпродаж dead stock повертає €40–55k уже в М2–3. Вартість аудиту зараховується у впровадження.</p>
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

// 17 точка Б
S.push(sl('verd', `
  <span class="ebrow" style="color:#6FAA9A">Точка Б · через 9 місяців · критерії приймання</span>
  <h1>Як виглядає «здоровий Тестик»</h1>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:40px">
    ${[['1.9%', 'конверсія (зараз 1.22%)'], ['60%', 'checkout (43.6%)'], ['22%', 'repeat (13%)'], ['18%', 'виручки з CRM (4.8%)'],
       ['≤2.5s', 'LCP mobile (4.6s)'], ['<5%', 'розбіжність GA4 (22%)'], ['<7%', 'OOS топ-20 (17%)'], ['3 тижні', 'відпустка власника без падіння — крок до «3 місяців»']]
      .map(([v, k]) => `<div style="border:2px solid rgba(255,255,255,.4);padding:16px 15px">
        <div style="font-family:var(--mono);font-weight:700;font-size:38px;color:#fff">${v}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:6px;line-height:1.35">${k}</div></div>`).join('')}
  </div>
  <p style="margin-top:28px;font-size:18px;color:rgba(255,255,255,.85);max-width:1060px">24 пороги Definition of Done — Звіт 3, гл. 3.05. Не «стало краще», а «пройдено/ні». Шлях до вашої цілі €250k/міс — стан Б + масштабування + CZ/RO, кожен доданок зі своєю умовою входу.</p>
`, 17));

// 18 фінал
S.push(sl('ink', `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <span class="ebrow">Наступний крок</span>
    <h1 style="font-size:70px">30 днів — і перші важелі<br>вже працюють.</h1>
    <p style="margin-top:34px;font-size:22px;color:rgba(255,255,255,.8);max-width:980px">Читка пакета (4 години включено) → старт хвилі 1 → КТ-1 через 30 днів.
    Гарантія на КТ-2 — з нашим коштом (Звіт 5). Вартість аудиту зараховується у впровадження.</p>
    <p style="margin-top:36px;font-family:var(--mono);font-size:15px;color:rgba(255,255,255,.55)">hello@weexp.agency · weexp.agency</p>
  </div>
`, 18));

doc('zvit-1-prezentatsiia.html', 'Звіт 1 · Презентація аудиту — Тестик', S.join(''));
console.log('r1 done: 18 slides');

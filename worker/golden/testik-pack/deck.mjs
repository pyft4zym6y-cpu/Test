// a04 · Презентація аудиту — 16:9, 16 слайдів. Арка: розрив → причини → докази → план → гроші → команда.
import { doc } from './gen.mjs';

const foot = (n) => `<div class="foot"><span>WEEXP · Глибокий аудит · «Тестик» · 23.08.2026</span><span style="color:#D6362B">ПРОТОТИП · СИНТЕТИЧНІ ДАНІ</span><span>${String(n).padStart(2, '0')} / 16</span></div>`;
const sl = (cls, body, n) => `<div class="sl ${cls}">${body}${foot(n)}</div>`;

const S = [];

// 01 — обкладинка
S.push(sl('ink', `
  <span class="ebrow">Глибокий аудит · Читка результатів</span>
  <h1 style="font-size:88px">«Тестик»:<br>де бізнес втрачає<br><span class="mk">€433 000 на рік</span></h1>
  <p style="margin-top:36px;font-family:var(--mono);font-size:15px;color:rgba(255,255,255,.55)">
    12 аудитів · 160+ перевірок · 14 відкритих систем · 24 місяці замовлень</p>
`, 1));

// 02 — головний висновок
S.push(sl('', `
  <span class="ebrow">Головний висновок</span>
  <h1>Попиту достатньо.<br>Гроші зливаються <span class="mk">після кліку</span>.</h1>
  <p style="margin-top:40px;font-size:24px;line-height:1.45;color:#3A3D42;max-width:1050px">
    Реклама окупається (LTV:CAC 3.4). Але з тих, хто почав оформлення, платить лише 43.6%.
    Друга покупка — у 13% клієнтів проти 25–30% у ніші. І компанія цього не бачить:
    аналітика розходиться з реальністю на 22%.</p>
  <p style="margin-top:28px;font-family:var(--mono);font-size:13px;color:#94A0A8">джерела: бекенд-замовлення 24 міс · GA4 · рекламні кабінети · метод Baymard</p>
`, 2));

// 03 — число-герой: витік
S.push(sl('ink', `
  <span class="ebrow">Розрив у грошах · без подвійного рахунку</span>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="heron" style="color:#D6362B">€433k</div>
    <p style="margin-top:8px;font-size:22px;color:rgba(255,255,255,.75)">на рік — вісім важелів, порахованих від бекенд-замовлень, а не від кліків</p>
    <p style="margin-top:10px;font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.45)">метод: найбільший важіль повністю + 45% решти · документ a10</p>
  </div>
`, 3));

// 04 — воронка
S.push(sl('', `
  <span class="ebrow">Доказ №1 · Воронка сайту, місяць</span>
  <h1>З 185 000 візитів платять 2 260.<br>Втрата — <span class="mk">у кроці оплати</span>.</h1>
  <div style="display:flex;gap:8px;align-items:flex-end;margin-top:56px;height:270px">
    ${[['Сесії', '185 000', 100, ''], ['Картка товару', '96 200', 52, ''], ['Кошик', '12 950', 7.0, ''], ['Checkout', '5 180', 2.8, ''], ['Покупка', '2 260', 1.22, 'bad']]
      .map(([l, v, p, bad]) => `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">
        <div style="font-family:var(--mono);font-size:16px;margin-bottom:6px;${bad ? 'color:#D6362B;font-weight:700' : ''}">${v}</div>
        <div style="height:${Math.max(p, 2.2)}%;background:${bad ? '#D6362B' : '#070d12'}"></div>
        <div style="font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6E7C86;margin-top:8px">${l}</div></div>`).join('')}
  </div>
  <p style="margin-top:26px;font-family:var(--mono);font-size:13px;color:#94A0A8">checkout completion 43.6% — бенчмарк 65%+ (Baymard) · джерело: GA4, звірено з бекендом</p>
`, 4));

// 05 — mobile
S.push(sl('', `
  <span class="ebrow">Доказ №2 · Мобільна швидкість</span>
  <h1>74% трафіку — mobile.<br>Він вантажиться <span class="mk">4.6 секунди</span>.</h1>
  <div style="display:flex;gap:64px;margin-top:60px">
    <div><div style="font-family:var(--mono);font-weight:700;font-size:120px;letter-spacing:-.04em;color:#D6362B">0.9%</div>
      <div style="font-family:var(--mono);font-size:13px;color:#6E7C86;letter-spacing:.1em;text-transform:uppercase;margin-top:6px">конверсія mobile</div></div>
    <div style="align-self:center;font-size:40px;color:#94A0A8">проти</div>
    <div><div style="font-family:var(--mono);font-weight:700;font-size:120px;letter-spacing:-.04em;color:#070d12">2.1%</div>
      <div style="font-family:var(--mono);font-size:13px;color:#6E7C86;letter-spacing:.1em;text-transform:uppercase;margin-top:6px">конверсія desktop</div></div>
  </div>
  <p style="margin-top:44px;font-size:20px;color:#3A3D42;max-width:1000px">LCP 4.6s · INP 310ms · CLS 0.18 — усі три метрики Google в червоній зоні (поріг 2.5s / 200ms / 0.1).
  Кожна зайва секунда на mobile — це недоотримані замовлення, за які реклама вже заплатила.</p>
  <p style="margin-top:18px;font-family:var(--mono);font-size:13px;color:#94A0A8">джерело: CrUX (польові дані), 75-й перцентиль</p>
`, 5));

// 06 — retention
S.push(sl('', `
  <span class="ebrow">Доказ №3 · Утримання</span>
  <h1>Кожен клієнт купує <span class="mk">1.15 раза</span>.<br>База на 41 000 контактів мовчить.</h1>
  <div style="margin-top:56px;max-width:1050px">
    ${[['Повторні покупки, 365 дн', '13%', 13, 27, 'бенч ніші 25–30%'], ['Частка виручки з email/CRM', '4.8%', 4.8, 25, 'зрілий D2C: 25%+']]
      .map(([l, v, p, b, bt]) => `<div style="margin-bottom:36px">
        <div style="display:flex;justify-content:space-between;font-size:18px;margin-bottom:8px"><span>${l}</span><span style="font-family:var(--mono);font-weight:700;color:#D6362B">${v}</span></div>
        <div style="position:relative;height:26px;background:#E7EAE7">
          <div style="position:absolute;left:0;top:0;bottom:0;width:${p * 2.4}%;background:#D6362B"></div>
          <div style="position:absolute;left:${b * 2.4}%;top:-6px;bottom:-6px;width:2px;background:#2A6D5C"></div>
          <span style="position:absolute;left:${b * 2.4 + 1}%;top:-30px;font-family:var(--mono);font-size:12px;color:#2A6D5C">${bt}</span>
        </div></div>`).join('')}
  </div>
  <p style="font-size:20px;color:#3A3D42;max-width:1000px">Налаштований один welcome-ланцюжок. Немає кинутого кошика, післяпродажного циклу, реактивації. DMARC відсутній — листи ризикують спамом.</p>
  <p style="margin-top:14px;font-family:var(--mono);font-size:13px;color:#94A0A8">джерела: замовлення 24 міс · eSputnik · DNS-перевірка</p>
`, 6));

// 07 — прилади брешуть
S.push(sl('ink', `
  <span class="ebrow">Доказ №4 · Аналітика</span>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="heron" style="color:#fff">22%</div>
    <p style="margin-top:6px;font-size:26px;color:rgba(255,255,255,.85);max-width:1000px">замовлень <span style="color:#F08379">невидимі для GA4</span>.
    Маржа в аналітику не передається. Рішення про бюджети ухвалюються по зіпсованих даних.</p>
    <p style="margin-top:16px;font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.45)">причини: Apple Pay redirect + consent-блокування ЄС · звірка GA4 ↔ бекенд, 6 міс</p>
  </div>
`, 7));

// 08 — Allegro
S.push(sl('', `
  <span class="ebrow">Доказ №5 · Канали</span>
  <h1>Сайт заробляє 12% з обороту.<br>Allegro — <span class="mk">3%</span>. Це не помітно без юніт-економіки.</h1>
  <div style="display:flex;gap:10px;margin-top:64px;max-width:900px">
    <div style="flex:95"><div style="height:170px;background:#070d12;position:relative"><span style="position:absolute;bottom:10px;left:14px;color:#fff;font-family:var(--mono);font-size:15px">сайт · €95k/міс</span></div>
      <div style="font-family:var(--mono);font-size:15px;margin-top:10px">contribution <b>12%</b></div></div>
    <div style="flex:28"><div style="height:170px;background:#D6362B;position:relative"><span style="position:absolute;bottom:10px;left:14px;color:#fff;font-family:var(--mono);font-size:15px">Allegro · €28k</span></div>
      <div style="font-family:var(--mono);font-size:15px;margin-top:10px;color:#D6362B">contribution <b>3%</b></div></div>
  </div>
  <p style="margin-top:40px;font-size:20px;color:#3A3D42;max-width:1000px">Комісія 12% + логістика + Ads з'їдають майже всю маржу каналу. Канал не збитковий — але кожен € виручки тут учетверо «худіший». Рішення: передоцінка + перегляд логістичної схеми, не вихід з каналу.</p>
  <p style="margin-top:14px;font-family:var(--mono);font-size:13px;color:#94A0A8">джерела: Allegro Seller Center 12 міс · P&L · розрахунок у документі a08</p>
`, 8));

// 09 — матриця зрілості
S.push(sl('', `
  <span class="ebrow">Системний діагноз · Матриця зрілості, 12 доменів</span>
  <h1>Хвороба не в маркетингу.<br>У <span class="mk">даних і організації</span>.</h1>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:48px">
    ${[['Business', 2], ['Market', 2], ['Product', 2], ['Customer', 1], ['Website', 2], ['SEO', 2], ['Acquisition', 3], ['CRM', 1], ['Analytics', 1], ['Operations', 2], ['Technology', 2], ['Organization', 2]]
      .map(([d, l]) => `<div style="border:2px solid ${l <= 1 ? '#D6362B' : '#070d12'};padding:14px 12px">
        <div style="font-family:var(--mono);font-weight:700;font-size:34px;${l <= 1 ? 'color:#D6362B' : ''}">L${l}</div>
        <div style="font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6E7C86;margin-top:4px">${d}</div>
        <div style="display:flex;gap:3px;margin-top:8px">${[1, 2, 3, 4, 5].map((i) => `<span style="flex:1;height:5px;background:${i <= l ? (l <= 1 ? '#D6362B' : '#070d12') : '#E7EAE7'}"></span>`).join('')}</div>
      </div>`).join('')}
  </div>
  <p style="margin-top:30px;font-size:19px;color:#3A3D42;max-width:1050px">Health Score <b class="mono">52/100</b>. Найнижчі рівні — Customer, CRM, Analytics (L1): саме вони обмежують решту. Шкала L1–L5 за CMMI; рівень = найнижчий ПОВНІСТЮ виконаний.</p>
`, 9));

// 10 — розворот: смена плоскости
S.push(sl('verd', `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <span class="ebrow" style="color:#6FAA9A">Від діагнозу — до маршруту</span>
    <h1 style="font-size:76px;max-width:1050px">Нічого з цього не лікується<br>«ще одним підрядником».<br>Лікується системою.</h1>
  </div>
`, 10));

// 11 — 8 важелів
S.push(sl('', `
  <span class="ebrow">Вісім важелів · виручка на рік</span>
  <h1>Один важіль — повністю.<br>Решта — консервативні 45%.</h1>
  <div style="margin-top:44px;max-width:1080px">
    ${[['Checkout 43.6% → 60%', 190, 'high'], ['Retention 13% → 20%', 150, 'high'], ['Mobile LCP 4.6 → 2.5s', 120, 'med'], ['OOS топ-20: 17% → 7%', 95, 'high'], ['SEO: фасети та дублі', 85, 'med'], ['Allegro: ціни й логістика', 60, 'high'], ['Бій у доставці 2.1% → 0.7%', 31, 'high']]
      .map(([l, v, c], i) => `<div style="display:flex;align-items:center;gap:16px;margin-bottom:13px">
        <span style="width:340px;font-size:17px">${l}</span>
        <div style="flex:1;height:22px;background:#E7EAE7;position:relative"><div style="position:absolute;left:0;top:0;bottom:0;width:${(v / 190) * 100}%;background:${i === 0 ? '#D6362B' : '#070d12'}"></div></div>
        <span style="font-family:var(--mono);font-weight:700;font-size:18px;width:90px;text-align:right">€${v}k</span>
        <span style="font-family:var(--mono);font-size:11px;color:${c === 'high' ? '#2A6D5C' : '#a06a00'};width:44px">${c}</span></div>`).join('')}
  </div>
  <p style="margin-top:22px;font-family:var(--mono);font-size:14px;color:#6E7C86">разом без подвійного рахунку: <b style="color:#070d12">€433k/рік</b> · + €70k розмороженого кешу з dead stock (одноразово) · метод і чутливість — документ a10</p>
`, 11));

// 12 — роадмапа хвилями
S.push(sl('', `
  <span class="ebrow">Роадмапа · 9 місяців, три хвилі</span>
  <h1>Спочатку прилади. Потім гроші.<br>Потім масштаб.</h1>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:48px">
    <div style="border-top:6px solid #D6362B;padding-top:18px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#D6362B">Хвиля 1 · дні 1–30</div>
      <div style="font-size:22px;font-weight:700;margin:10px 0 12px">Полагодити й зупинити</div>
      <p style="font-size:16px;line-height:1.5;color:#3A3D42">Фікс GA4 · DMARC · стандарт пакування · перші правки checkout · передоцінка Allegro · правила знижок</p></div>
    <div style="border-top:6px solid #070d12;padding-top:18px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#6E7C86">Хвиля 2 · дні 31–120</div>
      <div style="font-size:22px;font-weight:700;margin:10px 0 12px">Запустити двигуни</div>
      <p style="font-size:16px;line-height:1.5;color:#3A3D42">4 CRM-flows · mobile-швидкість · закупівлі під OOS · щотижневий дашборд · PDP-оптимізація</p></div>
    <div style="border-top:6px solid #2A6D5C;padding-top:18px">
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#2A6D5C">Хвиля 3 · міс 4–9</div>
      <div style="font-size:22px;font-weight:700;margin:10px 0 12px">Система і масштаб</div>
      <p style="font-size:16px;line-height:1.5;color:#3A3D42">SEO-фасети · юніт-економіка PL · оргструктура з власниками каналів · підготовка CZ/RO</p></div>
  </div>
  <p style="margin-top:34px;font-family:var(--mono);font-size:13px;color:#94A0A8">повний Гант А→Б по 12 доменах — документ a15 · план перших 90 днів по тижнях — a16</p>
`, 12));

// 13 — строки/бюджет
S.push(sl('', `
  <span class="ebrow">Строки та бюджет проекту</span>
  <h1>9 місяців. <span class="mk">€6 000/міс</span>.<br>Окупність — з другого місяця.</h1>
  <div style="display:flex;gap:56px;margin-top:56px">
    <div><div style="font-family:var(--mono);font-weight:700;font-size:64px">€54k</div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;margin-top:6px">бюджет 9 міс — у межах €6k/міс з анкети</div></div>
    <div><div style="font-family:var(--mono);font-weight:700;font-size:64px;color:#2A6D5C">€156k</div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;margin-top:6px">річний потенціал у contribution (36% від €433k)</div></div>
    <div><div style="font-family:var(--mono);font-weight:700;font-size:64px;color:#2A6D5C">2.9×</div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6E7C86;margin-top:6px">консервативне співвідношення ефект/бюджет при реалізації 100%</div></div>
  </div>
  <p style="margin-top:48px;font-size:19px;color:#3A3D42;max-width:1050px">При реалістичних 55–70% реалізації (a10) проект повертає бюджет у 1.6–2.0× уже за перший рік. Вартість аудиту зараховується у впровадження.</p>
  <p style="margin-top:14px;font-family:var(--mono);font-size:13px;color:#94A0A8">деталізація по місяцях і пакетах — комерційна пропозиція a18</p>
`, 13));

// 14 — команда і розподіл
S.push(sl('', `
  <span class="ebrow">Команда · хто що закриває</span>
  <h1>Ми не «робимо за вас».<br>Ми будуємо систему разом.</h1>
  <table style="width:100%;border-collapse:collapse;margin-top:44px;font-size:17px">
    <tr style="border-bottom:2.5px solid #070d12"><th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:10px 8px">Напрям</th>
      <th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:10px 8px">WEEXP</th>
      <th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:10px 8px">Партнери</th>
      <th style="text-align:left;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6E7C86;padding:10px 8px">Команда «Тестик»</th></tr>
    ${[['Аналітика і дані', 'архітектура, дашборд, звірка — part-time лід', '—', 'PM: доступи, приймання'],
       ['CRO / checkout / mobile', 'гіпотези, ТЗ, пріоритети — part-time', 'розробник OpenCart (підрядник, ~40 год/міс)', 'PM: координація релізів'],
       ['CRM / retention', 'сценарії, сегменти, запуск — part-time', 'копірайтер (підрядник)', 'маркетолог: контент, 25% часу'],
       ['SEO / контент', 'стратегія і ТЗ', 'контент-студія (хвиля 3)', 'контентник: картки товарів'],
       ['Операції / закупівлі', 'правила OOS і пакування — консультації', '—', 'ops-лід: впровадження, fulltime-задача'],
       ['Управлінський ритм', 'фасилітація щотижневих читок, 9 міс', '—', 'власник: 2 год/тиждень, не більше']]
      .map(([a, b, c, d]) => `<tr style="border-bottom:1px solid #dfe4e6"><td style="padding:11px 8px;font-weight:700">${a}</td><td style="padding:11px 8px">${b}</td><td style="padding:11px 8px;color:#3A3D42">${c}</td><td style="padding:11px 8px;color:#3A3D42">${d}</td></tr>`).join('')}
  </table>
  <p style="margin-top:24px;font-family:var(--mono);font-size:13px;color:#94A0A8">склад: WEEXP 2 part-time ролі + PM-фасилітація · партнери 2 підрядники · клієнт: PM fulltime (умова плану) + наявна команда</p>
`, 14));

// 15 — цільова модель
S.push(sl('verd', `
  <span class="ebrow" style="color:#6FAA9A">Точка Б · через 9 місяців</span>
  <h1>Як виглядає «здоровий Тестик»</h1>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:44px">
    ${[['1.9%', 'конверсія сайту (зараз 1.22%)'], ['60%', 'checkout completion (43.6%)'], ['22%', 'repeat rate (13%)'], ['18%', 'виручки з CRM (4.8%)'],
       ['≤2.5s', 'LCP mobile (4.6s)'], ['<5%', 'розбіжність GA4 (22%)'], ['<7%', 'OOS топ-20 (17%)'], ['3 міс', 'відпустка власника без падіння']]
      .map(([v, k]) => `<div style="border:2px solid rgba(255,255,255,.4);padding:18px 16px">
        <div style="font-family:var(--mono);font-weight:700;font-size:40px;color:#fff">${v}</div>
        <div style="font-size:13.5px;color:rgba(255,255,255,.75);margin-top:6px;line-height:1.35">${k}</div></div>`).join('')}
  </div>
  <p style="margin-top:32px;font-size:19px;color:rgba(255,255,255,.85);max-width:1050px">Кожна цифра — критерій приймання з Definition of Done (a17). Не «стало краще», а вимірний поріг, який або пройдено, або ні.</p>
`, 15));

// 16 — фінал
S.push(sl('ink', `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <span class="ebrow">Наступний крок</span>
    <h1 style="font-size:72px">30 днів — і перші важелі<br>вже працюють.</h1>
    <p style="margin-top:36px;font-size:22px;color:rgba(255,255,255,.8);max-width:950px">Читка пакета (4 години консультацій включено) → старт хвилі 1 → контрольний дзвінок через 30 днів.
    Вартість аудиту зараховується у впровадження.</p>
    <p style="margin-top:40px;font-family:var(--mono);font-size:15px;color:rgba(255,255,255,.55)">hello@weexp.agency · weexp.agency</p>
  </div>
`, 16));

doc('04-prezentatsiia.html', 'a04 · Презентація аудиту — Тестик', S.join(''));
console.log('deck done');

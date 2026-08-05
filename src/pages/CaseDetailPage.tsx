import { Link, Navigate, useParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import { Eyebrow, Section, SectionTitle, Stat, Chip } from '../components/ui';
import { PageCta } from '../components/NewSections';
import { CASE_COVERS } from './CasesPage';

/*
 * Єдиний шаблон кейсу: Було → Проблема → Рішення → Результат → Уроки.
 * Усі кейси — завершені проєкти з реальними цифрами; анонімізовані на
 * прохання клієнтів. Дані заповнені з брифів власника (CASES_BRIEF).
 */

type CaseData = {
  eyebrow: string;
  title: JSX.Element;
  lede: string;
  context: string[];
  pointA: { k: string; v: string }[];
  diagnosis: string[];
  wow?: string;
  myth?: string;
  waves: { t: string; d: string }[];
  stats: { value: string; label: string; color: string }[];
  results: { k: string; a: string; b: string }[];
  honest: { t: string; d: string }[];
  status?: string;
  audience: string[];
  tags: string[];
  note?: string;
};

const CASES: Record<string, CaseData> = {
  'premium-textile': {
    eyebrow: 'Кейс · Виробник · UA → EU · анонімізовано',
    title: (
      <>
        З нуля в D2C: <span className="lime-text">×18 обороту</span>
        <br />
        за 18 місяців
      </>
    ),
    lede:
      'Виробник із 12-річною історією та командою ~40 людей. Уся виручка — B2B/B2G-контракти, ' +
      'e-commerce фактично не існував: старий сайт із конверсією 0,8% і €48K обороту на рік. ' +
      'Власник хотів три речі: власний D2C-канал, незалежність від дистрибʼюторів і вихід у Європу.',
    context: [
      '12 років на ринку · ~40 людей у компанії',
      'Основа бізнесу — B2B / B2G, роздрібу немає',
      'Мета: D2C-канал + вихід у ЄС + незалежність від дистрибуції',
    ],
    pointA: [
      { k: 'Оборот e-com', v: '€48K / рік' },
      { k: 'Конверсія сайту', v: '0,8%' },
      { k: 'Аналітика', v: 'немає' },
      { k: 'Повторні покупки', v: 'немає' },
      { k: 'Бренд у digital · контент', v: 'немає' },
      { k: 'Логістика', v: 'під B2B, не під роздріб' },
    ],
    diagnosis: [
      'Аудит зайняв 4–6 тижнів: дані були брудні, доступи збирали довго — стартували з чистого листа.',
      'Найбільше вразило власника: реальна вартість клієнта, розмір втрат у грошах і відрив від конкурентів — але й потенціал росту.',
      'Порахували ціну бездіяльності — скільки коштує кожен місяць без системи.',
    ],
    myth:
      'Власник вважав, що «в усьому винна реклама». Аудит показав: реклама була найменшою з проблем — ' +
      'не було фундаменту, на якому їй працювати.',
    waves: [
      { t: 'Фундамент: аналітика спершу', d: 'GA4, BI-дашборд, P&L у реальному часі, юніт-економіка по кожному SKU. Далі кожне рішення — тільки від цифр.' },
      { t: 'Платформа і бренд', d: 'Нова платформа, повний редизайн, нейминг, сторітелінг, фото-контент, преміум-пакування. Скоротили SKU, підняли ціни.' },
      { t: 'Канали з нуля', d: 'Платна реклама, SEO, маркетплейси, email/CRM, соцмережі — усі канали будувались одночасно, з чистого листа.' },
      { t: 'Вихід у ЄС', d: 'Польща й Німеччина: Amazon + Allegro + власний сайт для ЄС. Логістика — через власний склад.' },
      { t: 'Retention-контур', d: 'Email-ланцюжки, програма лояльності, підписка — повторні продажі дають 10–20% виручки.' },
      { t: 'B2B / HoReCa як бонус', d: 'Збудували напрям спеціально: готелі, ресторани, корпоративні подарунки — повторюваність 78%, чек ×5.' },
    ],
    stats: [
      { value: '×18', label: 'Оборот · €48K → €900K/рік', color: 'var(--lime)' },
      { value: '4,2%', label: 'Конверсія · з 0,8% · топ-1% сегмента', color: 'var(--cyan)' },
      { value: '3.8×', label: 'ROI за перший рік · CAPEX ~$80K', color: 'var(--yellow)' },
      { value: '6–10', label: 'Країн купують · 25–50% виручки — ЄС', color: 'var(--purple)' },
    ],
    results: [
      { k: 'Оборот e-com', a: '€48K/рік', b: '€900K/рік (2024) · ріст триває' },
      { k: 'Замовлення', a: '<100/міс', b: '500+/міс' },
      { k: 'Конверсія', a: '0,8%', b: '4,2%' },
      { k: 'Повторні покупки', a: '~10%', b: '20–25%' },
      { k: 'Середній чек', a: 'база', b: '+30–70% · ЄС-чек вищий за UA' },
      { k: 'Органіка', a: '~0', b: '45% трафіку · 50–100K сесій/міс' },
      { k: 'Юніт-економіка', a: 'не рахувалась', b: 'CAC ≈ €7 · ROAS 5×+' },
      { k: 'Маржа', a: 'база', b: 'зросла суттєво (частину зʼїдає логістика ЄС)' },
    ],
    honest: [
      { t: 'Було боляче', d: 'По дорозі — касовий розрив і проблеми з поставками. Система пережила обидва: пріоритети хвиль перерахували від цифр.' },
      { t: 'Найскладніше', d: 'Переконувати власника рухатись системно, а не «швидко полатати». Кредит довіри вирішив усе.' },
      { t: 'Головний урок', d: 'Спершу аналітика — потім усе інше. Кожен долар, вкладений до фундаменту, працює вдвічі гірше.' },
    ],
    status: 'Співпраця триває — формат супроводу.',
    audience: ['Виробникам', 'Нішевим брендам', 'Тим, хто хоче в ЄС'],
    tags: ['D2C з нуля', 'UA → EU', 'Amazon · Allegro', 'Retention', 'Юніт-економіка'],
    note: 'Платформа кейсу — OpenCart: результат дає система, а не рушій сайту. Кейс анонімізовано на прохання клієнта.',
  },

  'fashion-apparel': {
    eyebrow: 'Кейс · Аудит · Виробник одягу · 2026 · анонімізовано',
    title: (
      <>
        Аудит знайшов <span className="lime-text">≥19 млн ₴/рік</span>
        <br />
        там, де «винна реклама»
      </>
    ),
    lede:
      'Виробник одягу з 10+ роками історії: власний сайт, Rozetka, Prom, Kasta, Instagram. ' +
      'Запит на вході: «хочемо рости, реклама задорога, дивимось на Європу». ' +
      'Діагностика показала: конверсія 3,9% — вища за норму ніші. Гроші втрачались не в трафіку.',
    context: [
      '10+ років · текстильне виробництво повного циклу',
      'Канали: сайт · Rozetka · Prom · Kasta · Instagram',
      'Єдиний платний канал — Meta (FB/IG)',
    ],
    pointA: [
      { k: 'Оборот e-com', v: '23,2 млн ₴ / рік' },
      { k: 'Конверсія', v: '3,9% — вище норми ✓' },
      { k: 'Оплата заявок', v: '63,4% · ціль ≥75%' },
      { k: 'Викуп', v: '82% · ціль ≥88%' },
      { k: 'Повторні', v: '15–20% · бази майже немає' },
      { k: 'SEO', v: 'позиція ~14 · потенціал ×3–5' },
    ],
    diagnosis: [
      'Від брифа до презентації — 5–6 тижнів. Доступи: GA4, CRM, вивантаження замовлень, рекламні кабінети.',
      'Втрати ховались в обробці: наложка й відмови, слабкі скрипти, повільна обробка заявок; викуп зʼїдали розмірна сітка та фото, що не відповідали товару.',
      'Конкурентна розвідка проти лідерів ніші: відставання в SEO, цінах і контенті.',
      'Сумарний розрив — ≥19 млн ₴ недоотриманого обороту на рік.',
    ],
    wow: 'Вау-момент для власника: розмір розриву в грошах, потенціал SEO ×3–5 і ціна кожного місяця бездіяльності.',
    waves: [
      { t: 'Роадмапа: 3 хвилі', d: 'Хвиля 1 — аналітика: спершу навести різкість, потім чіпати процеси. Далі — обробка заявок і викуп, CRM-контур, SEO, розширення каналів.' },
      { t: 'Що радили НЕ робити', d: 'Не лити більше реклами: до полагодження обробки заявок кожна нова гривня трафіку працює на третину.' },
      { t: 'Європа — за планом', d: 'Польща, Німеччина, Франція, Італія: маркетплейси ЄС + власний сайт. Після того, як процеси витримають обʼєм.' },
      { t: 'Бюджет і прогноз', d: 'Бюджет трансформації $50K+ з окупністю до 6 місяців; прогноз на 12 міс — ціль +30–50% обороту.' },
    ],
    stats: [
      { value: '≥19 млн ₴', label: 'Знайдений розрив · на рік', color: 'var(--lime)' },
      { value: '3,9%', label: 'Конверсія — вже вище норми ніші', color: 'var(--cyan)' },
      { value: '×3–5', label: 'Потенціал SEO-трафіку', color: 'var(--purple)' },
      { value: '5–6', label: 'Тижнів від брифа до презентації', color: 'var(--yellow)' },
    ],
    results: [
      { k: 'Збитковий канал', a: 'працював роками', b: 'закритий ще під час аудиту' },
      { k: 'Викуп', a: '82%', b: 'зростає — впровадження триває' },
      { k: 'Повторні', a: '15–20%', b: 'зростають — будуємо CRM-контур' },
      { k: 'SEO', a: 'позиція ~14', b: 'зростає' },
      { k: 'Реклама', a: '«давайте більше бюджету»', b: 'спершу процеси — потім масштаб' },
    ],
    honest: [
      { t: 'Головна знахідка', d: 'Конверсія була в нормі. Виробники часто шукають проблему в трафіку — а вона в обробці замовлень і в базі клієнтів, з якою ніхто не працює.' },
      { t: 'Оцінка власника', d: 'За оцінкою власника, аудит окупився ще до старту впровадження — на самому лише закритті збиткового каналу.' },
      { t: 'Типова помилка ніші', d: 'Лити рекламу замість процесів та ігнорувати базу клієнтів. Найдешевші гроші лежать у повторних продажах.' },
    ],
    status: 'Впроваджуємо разом: консультації тривають, метрики рухаються.',
    audience: ['Виробникам одягу', 'Брендам з Instagram-продажами', 'Обіг ₴1–3 млн/міс'],
    tags: ['Аудит', 'Розрив у грошах', 'Обробка заявок', 'SEO', 'CRM-контур'],
    note: 'Кейс анонімізовано; цифри — з реального звіту аудиту, публікуються з дозволу клієнта без назви компанії.',
  },

  'consumer-dtc': {
    eyebrow: 'Кейс · Consumer DTC · Forbes TOP-250 UA (2023) · без імені',
    title: (
      <>
        DTC ≠ дистрибуція:
        <br />
        <span className="lime-text">+65% продажів</span> за 9 місяців
      </>
    ),
    lede:
      'Міжнародний виробник споживчих товарів — бренд із Forbes TOP-250 UA. Бренд сильний, ' +
      'e-commerce давав 50%+ продажів, але зростання зупинилось: залежність від одного каналу, ' +
      'CAC зʼїдав маржу, LTV ніхто не рахував. Завдання — побудувати справжній DTC і нові ринки.',
    context: [
      'Бренд із Forbes TOP-250 UA (2023) · сильний бренд, слабка система',
      'E-com — 50%+ продажів, але стагнація',
      'Мета: DTC-модель + нові ринки + керована юніт-економіка',
    ],
    pointA: [
      { k: 'Конверсія', v: '0,64%' },
      { k: 'Повторні', v: '14,7%' },
      { k: 'CAC', v: '$40–50 · зʼїдав маржу' },
      { k: 'LTV', v: 'не рахувався' },
      { k: 'Дані', v: 'розрізнені · ручні таблиці' },
    ],
    diagnosis: [
      'Аудит 4–6 тижнів; найважче — зібрати розрізнені дані з ручних таблиць у одну картину.',
      'Розриви: конверсія, повторні покупки, retention, аналітика.',
      'Юніт-економіка не сходилась: канал не можна було масштабувати, поки CAC зʼїдав маржу.',
    ],
    waves: [
      { t: 'Платформа й аналітика', d: 'Нова платформа + наскрізна аналітика замість ручних таблиць. LTV і CAC — на дашборді, а не в голові.' },
      { t: '6 нових ринків — послідовно', d: 'Німеччина та ще 5 ринків, один за одним: локальні маркетплейси, Amazon, власний сайт із локалізацією, дистрибʼютори, соцмережі + інфлюенсери.' },
      { t: 'Локалізація по-справжньому', d: 'Мова, ціни під ринок, сертифікація, логістика, упаковка — для кожного ринку окремо. Це і було найскладніше.' },
      { t: 'Retention з нуля', d: 'Email/CRM-контур з нуля — повторні покупки виросли вчетверо.' },
      { t: 'Контент-машина', d: 'Фото-продакшн, відео, UGC, інфлюенсери — контент під кожен ринок.' },
      { t: 'Ефективність замість бюджетів', d: 'Реклама: ефективність зросла при тих самих бюджетах — CAC знизився, ROAS зріс.' },
    ],
    stats: [
      { value: '+65%', label: 'Продажі · за 9 місяців', color: 'var(--lime)' },
      { value: '×4', label: 'Повторні покупки · з 14,7%', color: 'var(--purple)' },
      { value: '6', label: 'Нових ринків · 15–30% виручки', color: 'var(--yellow)' },
      { value: '×1,5–2', label: 'Конверсія · з 0,64%', color: 'var(--cyan)' },
    ],
    results: [
      { k: 'Продажі', a: 'стагнація', b: '+65% за 9 міс · ріст триває' },
      { k: 'Повторні', a: '14,7%', b: '×4' },
      { k: 'Нові ринки', a: '0', b: '6 · дають 15–30% виручки' },
      { k: 'CAC / ROAS', a: 'CAC $40–50', b: 'CAC ↓ · ROAS ↑ при тих самих бюджетах' },
      { k: 'Маржа', a: 'під тиском', b: 'зросла' },
      { k: 'Інвестиції', a: '—', b: '$100K+ · окупність 9–12 міс' },
    ],
    honest: [
      { t: 'Найскладніше', d: 'Локалізація: кожен ринок — окрема мова, ціни, сертифікація й логістика. Це не «переклали сайт», це шість запусків.' },
      { t: 'Команда', d: 'Повний под 5+ фахівців з нашого боку + команда клієнта. Формат — змішаний: частину вели ми, частину — їхні руки під нашим контролем.' },
      { t: 'Головний урок', d: 'DTC ≠ дистрибуція. Це інша операційна модель: свій трафік, свої дані, свій retention — і своя економіка.' },
    ],
    audience: ['Брендам із дистрибуцією → DTC', 'Тим, хто хоче в ЄС', 'FMCG-виробникам'],
    tags: ['DTC-запуск', '6 ринків', 'Локалізація', 'Retention ×4', 'Amazon'],
    note: 'Бренд не називаємо за умовами співпраці — «бренд із Forbes TOP-250» і цифри погоджені до публікації.',
  },

  'fmcg-distribution': {
    eyebrow: 'Кейс · FMCG-дистрибуція · Beauty',
    title: (
      <>
        E-com трансформація
        <br />
        національного <span className="lime-text">FMCG-дистрибʼютора</span>
      </>
    ),
    lede:
      'Запуск web-інфраструктури з нуля, управління 17 000 SKU на маркетплейсах, дропшипінг для ' +
      'роздрібних партнерів, вихід на міжнародні ринки та запуск власного beauty-бренду: UA · PL · NL · CY.',
    context: [
      'Національний дистрибʼютор beauty/FMCG',
      'Виробники: Henkel · SC Johnson · Kimberly-Clark · Schwarzkopf · J&J · Missha · NYX',
      'Клієнти: Watsons · MAKEUP · Rozetka · Pampik · Kasta · Lamoda',
    ],
    pointA: [
      { k: 'Web-інфраструктура', v: 'не існувала' },
      { k: 'SKU онлайн', v: 'частка від 17 000' },
      { k: 'Процеси', v: 'ручні · телефон і таблиці' },
    ],
    diagnosis: [
      'Дистрибуція трималась на ручних процесах: замовлення телефоном, прайси в таблицях, каталог розрізнений.',
      'Головні втрати — на ручній обробці та нереалізованому асортименті.',
    ],
    waves: [
      { t: 'Web-інфраструктура з нуля', d: 'Побудували цифровий канал продажів дистрибʼютора: каталог, замовлення, інтеграції з обліком.' },
      { t: '17K SKU на маркетплейсах', d: 'Оцифрували та вивели асортимент на маркетплейси — з керуванням контентом і залишками.' },
      { t: 'Дропшипінг для партнерів', d: 'Роздрібні партнери продають без власного складу — дистрибʼютор відвантажує напряму.' },
      { t: 'CRM', d: 'Операційна ефективність +25%: менше рутини, швидша обробка, повторювані замовлення.' },
      { t: 'Власний beauty-бренд', d: 'Запуск і просування власного бренду на ринках UA · PL · NL · CY.' },
    ],
    stats: [
      { value: '17 000', label: 'SKU на маркетплейсах', color: 'var(--pink)' },
      { value: '+40%', label: 'Зростання продажів', color: 'var(--lime)' },
      { value: '+25%', label: 'Опер. ефективність · CRM', color: 'var(--purple)' },
      { value: '12–17', label: 'Фахівців у керуванні', color: 'var(--cyan)' },
    ],
    results: [
      { k: 'Продажі', a: 'база', b: '+40%' },
      { k: 'Операційна ефективність', a: 'ручні процеси', b: '+25% через CRM' },
      { k: 'Географія', a: 'UA', b: 'UA · PL · NL · CY' },
    ],
    honest: [
      { t: 'Масштаб', d: '17 000 SKU — це не «зробити сайт», це система керування контентом, залишками й цінами, яка не ламається на обʼємі.' },
      { t: 'B2B теж хоче зручності', d: 'Роздрібні партнери замовляють так само, як люди купують у магазинах: швидко, самостійно, без дзвінків.' },
      { t: 'Команда', d: 'У керуванні — 12–17 фахівців: власна команда + підрядники під задачі.' },
    ],
    audience: ['Дистрибʼюторам FMCG', 'Оптовикам з великим асортиментом', 'Виробникам із дилерською мережею'],
    tags: ['B2B + B2C', '17K SKU', 'Дропшипінг', 'CRM', 'Власний бренд'],
  },
};

const STEPS = ['Було', 'Проблема', 'Рішення', 'Результат', 'Уроки'];

function CaseStory({ data }: { data: CaseData }) {
  return (
    <>
      {/* ---- Hero ---- */}
      <Section className="grid-bg">
        <div className="glow-lime w-[420px] h-[420px] top-10 -right-40" />
        <FadeIn>
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle as="h1">{data.title}</SectionTitle>
          <p className="text-[#5A6472] mt-5 max-w-2xl leading-relaxed">{data.lede}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-7" aria-label="Структура кейсу">
            {STEPS.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="font-pixel text-[0.44rem] px-2 py-1.5 border border-[#65A30D]/40 text-[#4D7C0F]">
                  0{i + 1} {s}
                </span>
                {i < STEPS.length - 1 && <span className="text-black/25 text-xs">→</span>}
              </span>
            ))}
          </div>
        </FadeIn>

        {/* ---- Контекст + Точка А ---- */}
        <div className="grid lg:grid-cols-2 gap-5 mt-10 items-start">
          <FadeIn delay={0.1}>
            <div className="card p-6 h-full">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#0F9488] mb-4">
                01 · Хто клієнт
              </p>
              <ul className="flex flex-col gap-2.5">
                {data.context.map((c) => (
                  <li key={c} className="text-sm text-[#2F3742] flex gap-2.5">
                    <span className="text-[#0F9488] shrink-0">—</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={0.18}>
            <div className="card p-6 h-full">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#DC2626] mb-4">
                Точка А
              </p>
              <div className="flex flex-col">
                {data.pointA.map((r, i) => (
                  <div key={r.k} className={`flex justify-between gap-4 py-2.5 ${i > 0 ? 'border-t border-[#ECEEF0]' : ''}`}>
                    <span className="font-bold text-sm">{r.k}</span>
                    <span className="font-mono text-[0.68rem] text-[#DC2626] text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ---- Діагноз ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>02 · Проблема — що показав аудит</Eyebrow>
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
            <div className="card accent-left p-6" style={{ '--accent': 'var(--red)' } as React.CSSProperties}>
              <ul className="flex flex-col gap-3">
                {data.diagnosis.map((d) => (
                  <li key={d} className="text-sm text-[#2F3742] leading-relaxed flex gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--red)' }} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            {(data.myth || data.wow) && (
              <div className="card accent-left p-6" style={{ '--accent': 'var(--yellow)' } as React.CSSProperties}>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#B45309] mb-2.5">
                  {data.myth ? 'Міф, який зняли' : 'Вау-момент'}
                </p>
                <p className="text-sm text-[#2F3742] leading-relaxed">{data.myth ?? data.wow}</p>
              </div>
            )}
          </div>
        </FadeIn>
      </Section>

      {/* ---- Рішення ---- */}
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>03 · Рішення — що робили</Eyebrow>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {data.waves.map((w, i) => (
            <FadeIn key={w.t} delay={i * 0.06}>
              <div className="card card-hover p-6 h-full">
                <p className="font-pixel text-[0.5rem] text-[#4D7C0F] mb-2.5">{`0${i + 1}`}</p>
                <p className="font-bold text-[0.95rem] leading-snug">{w.t}</p>
                <p className="text-[#5A6472] text-xs mt-2 leading-relaxed">{w.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ---- Результат ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>04 · Результат — цифри</Eyebrow>
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {data.stats.map((s) => (
            <Stat key={s.label} value={s.value} label={s.label} color={s.color} />
          ))}
        </div>
        <FadeIn delay={0.15}>
          <div className="card p-6 mt-5">
            <div className="flex flex-col">
              {data.results.map((r, i) => (
                <div key={r.k} className={`grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1.2fr_1fr_1.4fr] gap-x-4 py-2.5 items-baseline ${i > 0 ? 'border-t border-[#ECEEF0]' : ''}`}>
                  <span className="font-bold text-sm">{r.k}</span>
                  <span className="font-mono text-[0.68rem] text-[#5A6472]">{r.a}</span>
                  <span className="font-mono text-[0.68rem] text-[#4D7C0F] text-right sm:text-left">→ {r.b}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ---- Чесна частина ---- */}
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>05 · Уроки — чесна частина</Eyebrow>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {data.honest.map((h, i) => (
            <FadeIn key={h.t} delay={i * 0.08}>
              <div className="card accent-top p-6 h-full" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
                <p className="font-bold">{h.t}</p>
                <p className="text-[#5A6472] text-sm mt-2 leading-relaxed">{h.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.2}>
          <div className="card p-6 mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
            {data.status && (
              <p className="text-sm text-[#2F3742]">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#4D7C0F] mr-2">Статус</span>
                {data.status}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#5A6472]">Кому корисно</span>
              {data.audience.map((a) => (
                <Chip key={a}>{a}</Chip>
              ))}
            </div>
          </div>
          {data.note && <p className="text-[#5A6472] text-xs mt-4 leading-relaxed max-w-2xl">{data.note}</p>}
          <div className="flex flex-wrap gap-2.5 mt-5">
            {data.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </FadeIn>
      </Section>
    </>
  );
}

export default function CaseDetailPage() {
  const { slug } = useParams();
  if (!slug || !CASES[slug]) return <Navigate to="/cases" replace />;

  const idx = CASE_COVERS.findIndex((c) => c.slug === slug);
  const next = CASE_COVERS[(idx + 1) % CASE_COVERS.length];

  return (
    <div className="pt-16">
      <nav
        aria-label="Хлібні крихти"
        className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 pt-8 -mb-12 font-mono text-xs uppercase tracking-wider"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/cases" className="text-[#5A6472] hover:text-[#4D7C0F] transition-colors">
              Кейси
            </Link>
          </li>
          <li aria-hidden="true" className="text-black/30">
            /
          </li>
          <li aria-current="page" className="text-[#12161C]">
            {CASE_COVERS[idx]?.title ?? 'Кейс'}
          </li>
        </ol>
      </nav>

      <CaseStory data={CASES[slug]} />

      <Section>
        <FadeIn>
          <Link
            to={`/cases/${next.slug}`}
            className="card card-hover accent-top p-7 flex flex-wrap items-center justify-between gap-5 group"
            style={{ '--accent': next.color } as React.CSSProperties}
          >
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472] mb-1.5">
                Наступний кейс
              </p>
              <p className="font-extrabold text-2xl">
                {next.title}{' '}
                <span className="font-mono text-lg ml-2" style={{ color: next.color }}>
                  {next.num}
                </span>
              </p>
            </div>
            <span className="font-mono text-sm uppercase tracking-wider text-black/60 group-hover:text-[#4D7C0F] transition-colors">
              Читати →
            </span>
          </Link>
        </FadeIn>
      </Section>

      <PageCta label="Скільки втрачає ваш магазин?" />
    </div>
  );
}

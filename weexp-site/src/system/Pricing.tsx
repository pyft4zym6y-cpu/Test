import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useT, useLp } from '@/i18n';
import './system.css';

/**
 * Формати співпраці — три моделі за рівнем НАШОЇ відповідальності за результат:
 *   01 Аудит       — разовий проєкт, далі клієнт діє сам (потрібна карта, не руки);
 *   02 Консалтинг  — ми архітектор і контроль, руки — команда клієнта;
 *   03 Управління  — проєкт ведемо ми, фінальна відповідальність наша.
 * Портовано зі старої версії у світлу систему .sysx (монохром + синій акцент).
 */
type Model = {
  n: string; name: string; tag: string; period: string; price: string; priceNote: string;
  scopes?: { name: string; price: string }[];
  featured?: boolean; forWhom: string; includes: string[]; format: string; terms: string; resp: string;
};

export function Pricing() {
  const t = useT();
  const lp = useLp();
  // SEO (title/description/lang/hreflang) для /pricing і /en/pricing — централізовано в RouteSeo.
  const [open, setOpen] = useState<number | null>(0);

  const MODELS: Model[] = [
    {
      n: '01', name: t('Аудит', 'Audit'), tag: t('Diagnostic · разовий проєкт', 'Diagnostic · one-off project'), period: t('4–6 тижнів', '4–6 weeks'),
      price: '$2,900 / $4,900',
      scopes: [
        { name: t('Аудит інтернет-магазину', 'Online-store audit'), price: '$2,900' },
        { name: t('Аудит відділу e-commerce в цілому', 'E-commerce department audit'), price: '$4,900' },
      ],
      priceNote: t('Обираєте глибину: сам магазин чи весь відділ e-commerce. Сума фіксується до старту.', 'Choose the depth: the store itself or the whole e-commerce department. The amount is fixed before we start.'),
      forWhom: t('У вас сильна внутрішня команда. Потрібні не руки, а карта: де саме витікають гроші й що робити першим.', 'You have a strong in-house team. You need a map, not hands: exactly where the money leaks and what to fix first.'),
      includes: [
        t('Discovery-портал: опитувальники, передача доступів, бриф ЛПР', 'Discovery portal: questionnaires, access handover, decision-maker brief'),
        t('Health Score і зрілість по 18 доменах', 'Health Score and maturity across 18 domains'),
        t('Розрив у грошах: 8 важелів, baseline, прогноз на 12 місяців', 'The gap in money: 8 levers, baseline, 12-month forecast'),
        t('Повний пакет документів аудиту — 19 артефактів', 'Full audit document pack — 19 artifacts'),
        t('Роадмапа хвилями: пріоритети, бюджет, строки, команда', 'Roadmap in waves: priorities, budget, timelines, team'),
      ],
      format: t('Передача документів + 4 години консультацій із розбором + контрольний дзвінок через 30 днів: перевіряємо, що впровадження пішло.', 'Document handover + 4 hours of consulting with a walkthrough + a check-in call after 30 days: we confirm implementation is underway.'),
      terms: t('100% вартості аудиту зараховується в перший місяць формату 03 (50% — у формат 02), якщо старт упродовж 30 днів. Аудит фактично стає безкоштовним входом.', '100% of the audit fee is credited to the first month of format 03 (50% to format 02) if you start within 30 days. The audit effectively becomes a free entry.'),
      resp: t('Впровадження та результат — ваша команда.', 'Implementation and the result — your team.'),
    },
    {
      n: '02', name: t('Консалтинг і супровід', 'Consulting & advisory'), tag: t('Advisory · зовнішній експерт', 'Advisory · external expert'), period: t('помісячно · від 1 міс', 'monthly · from 1 mo'),
      price: t('$50 / год', '$50 / hr'), priceNote: t('мінімум 30 год/міс — рахунок не буває менше $1,500/міс; понад мінімум — за фактом годин.', 'minimum 30 hrs/mo — the invoice is never below $1,500/mo; above the minimum — by actual hours.'),
      featured: true,
      forWhom: t('У вас є виконавці та проджект-менеджер. Потрібен архітектор: що робити, в якому порядку і чи якісно зроблено.', "You have doers and a project manager. You need an architect: what to do, in what order, and whether it's done well."),
      includes: [
        t('Щотижневі спринт-сесії: пріоритети, розбори, рішення', 'Weekly sprint sessions: priorities, reviews, decisions'),
        t('Роадмапа та беклог трансформації під нашим контролем', 'Transformation roadmap and backlog under our control'),
        t('Ревʼю виконаного проти DoD і еталонів Commerce OS', 'Review of delivered work against DoD and Commerce OS benchmarks'),
        t('Доступ до плейбуків, стандартів і чеклістів', 'Access to playbooks, standards, and checklists'),
        t('Прозорий звіт по годинах щомісяця', 'A transparent monthly hours report'),
      ],
      format: t('Обовʼязкова умова: на вашому боці є виділений проджект або відповідальний, який керує виконанням. Без нього рекомендації зависають — тоді чесніше одразу формат 03.', 'A mandatory condition: on your side there is a dedicated project lead or owner who drives execution. Without one, recommendations stall — then format 03 is the honest choice from the start.'),
      terms: t('Старт — після аудиту (формат 01): він дає карту, за якою ведемо. Початковий термін — 3 місяці, далі помісячно з відмовою за 30 днів. Передоплата на місяць; до 20% невикористаних годин переносяться. Щоквартальне ревʼю цінності.', 'Start — after the audit (format 01): it provides the map we steer by. Initial term — 3 months, then monthly with 30-day notice. Prepaid monthly; up to 20% of unused hours roll over. Quarterly value review.'),
      resp: t('Якість рішень і контроль — ми. Виконання руками та результат — ваша команда.', 'Quality of decisions and control — us. Hands-on execution and the result — your team.'),
    },
    {
      n: '03', name: t('Управління під ключ', 'Managed delivery'), tag: t('Managed · трансформація під ключ', 'Managed · turnkey transformation'), period: t('6–12 місяців', '6–12 months'),
      price: t('від $4,900 / міс', 'from $4,900 / mo'), priceNote: t('залежить від масштабу проєкту; фіксується після аудиту.', 'depends on project scale; fixed after the audit.'),
      forWhom: t('Нема кому вести це зсередини. Потрібен результат, а не поради — і один відповідальний за нього.', "There's no one to lead this from inside. You need a result, not advice — and one person accountable for it."),
      includes: [
        t('Керуємо всім проєктом: план, люди, бюджет, ризики', 'We run the whole project: plan, people, budget, risks'),
        t('Команда: ваші люди + наша мережа партнерів з OKR і DoD', 'Team: your people + our partner network with OKRs and DoD'),
        t('KPI та RACI на кожну хвилю, транші під результат', 'KPIs and RACI for each wave, tranches tied to results'),
        t('Швидкі перемоги першої хвилі фінансують наступні', 'First-wave quick wins fund the ones that follow'),
        t('Щомісячна звітність власнику: цифри проти плану', 'Monthly reporting to the owner: numbers against plan'),
      ],
      format: t('Старт — тільки після аудиту (формат 01): без діагностики керувати проєктом означає вести його навмання.', 'Start — only after the audit (format 01): without diagnostics, running the project means running it blind.'),
      terms: t('Пілот — перші 3 місяці з фіксованими KPI першої хвилі; далі 6–12 міс. Продовження — рішення за цифрами. Опційно — бонус за результат (% від приросту, у договорі).', 'Pilot — the first 3 months with fixed first-wave KPIs; then 6–12 mo. Renewal — a decision by the numbers. Optionally — a performance bonus (% of the uplift, in the contract).'),
      resp: t('Фінальна відповідальність за результат — на нас.', 'Final responsibility for the result — on us.'),
    },
  ];

  const COMPARE: { k: string; v: [string, string, string] }[] = [
    { k: t('Відповідальний за результат', 'Responsible for the result'), v: [t('Ваша команда', 'Your team'), t('Ви · ми — за якість рішень', 'You · us — for decision quality'), t('Ми', 'Us')] },
    { k: t('Хто виконує руками', 'Who does the hands-on work'), v: [t('Ваша команда', 'Your team'), t('Ваша команда під контролем', 'Your team, under our control'), t('Ваші люди + наші партнери', 'Your people + our partners')] },
    { k: t('Що потрібно від вас', 'What we need from you'), v: [t('Дані й доступи', 'Data and access'), t('Проджект + виконавці', 'A project lead + doers'), t('Рішення та бюджет', 'Decisions and budget')] },
    { k: t('Модель оплати', 'Payment model'), v: [t('Фіксована за проєкт', 'Fixed per project'), t('$50/год · мін. 30 год/міс', '$50/hr · min. 30 hrs/mo'), t('від $4,900/міс', 'from $4,900/mo')] },
    { k: t('Мінімальний вхід', 'Minimum entry'), v: ['$2,900', t('$1,500/міс', '$1,500/mo'), t('$4,900/міс', '$4,900/mo')] },
    { k: t('Мінімальний термін', 'Minimum term'), v: [t('разово', 'one-off'), t('3 місяці', '3 months'), t('пілот 3 міс → 6–12 міс', 'pilot 3 mo → 6–12 mo')] },
    { k: t('Зарахування аудиту', 'Audit credited'), v: ['—', t('50% у 1-й місяць', '50% in month 1'), t('100% у 1-й місяць', '100% in month 1')] },
  ];

  const FAQ = [
    { q: t('Скільки це коштує?', 'How much does it cost?'), a: t('Три формати — від разового аудиту до управління під ключ: кожен знаходить свій за масштабом і ситуацією. Усі ціни відкриті вище, у блоці «Формати та ціни».', 'Three formats — from a one-off audit to managed delivery: each finds its own by scale and situation. All prices are open above, in the "Pricing & formats" block.') },
    { q: t('Коли буде результат?', 'When will there be a result?'), a: t('Перший вимірюваний — за 30–60 днів. Швидкі перемоги в першій хвилі.', 'The first measurable one — within 30–60 days. Quick wins in the first wave.') },
    { q: t('У нас своя CMS / специфіка', 'We have our own CMS / specifics'), a: t('Платформо-незалежний підхід. Міграція — лише за реальної потреби.', 'A platform-independent approach. Migration — only when genuinely needed.') },
    { q: t('Хто виконує роботу?', 'Who does the work?'), a: t('Залежить від формату: в аудиті й консалтингу — ваша команда, в управлінні — ваші люди + керована мережа партнерів з OKR і DoD.', 'It depends on the format: in audit and consulting — your team; in managed delivery — your people + a managed partner network with OKRs and DoD.') },
    { q: t('Чому дешевше за ринок?', 'Why cheaper than the market?'), a: t('Ринок США бере за таку експертизу $75–250/год, fractional-керівники — $8–22K/міс. Ми працюємо напряму, без офісних накладних агенції — ви платите за експертизу, а не за бренд.', "The US market charges $75–250/hr for this expertise, fractional executives — $8–22K/mo. We work directly, without an agency's office overhead — you pay for expertise, not for a brand.") },
    { q: t('Чим захищений мій бюджет?', 'How is my budget protected?'), a: t('Кожен етап має Definition of Done — вимірюваний критерій приймання. Наступний транш стартує лише після прийнятого результату попереднього, а звітність щомісяця показує факт проти плану.', 'Each stage has a Definition of Done — a measurable acceptance criterion. The next tranche starts only after the previous result is accepted, and monthly reporting shows actuals against plan.') },
  ];

  return (
    <section className="sysx pric" aria-label={t('Формати та ціни', 'Pricing & formats')}>
      <div className="pric-in">
        <header className="pric-head">
          <span className="sysx-kick">{t('Формати співпраці · хто відповідає за результат', 'Cooperation formats · who is responsible for the result')}</span>
          <h1 className="sysx-display pric-h1">{t('Три формати — за рівнем', 'Three formats — by the level of')}<br />{t('нашої ', 'our ')}<span className="sysx-em">{t('відповідальності', 'responsibility')}</span></h1>
          <p className="sysx-lead">{t('Різниця не в «пакетах послуг», а в тому, хто несе фінальну відповідальність за результат: ваша команда з нашою картою, ваша команда під нашим контролем — чи ми повністю.', 'The difference isn\'t in "service packages" but in who bears final responsibility for the result: your team with our map, your team under our control — or us entirely.')}</p>
        </header>

        <div className="pric-grid">
          {MODELS.map((m) => (
            <article key={m.n} className={'pric-card' + (m.featured ? ' is-featured' : '')}>
              {m.featured && <span className="pric-badge mono">{t('Найчастіший вибір', 'Most common choice')}</span>}
              <span className="pric-tag mono">{m.n} · {m.tag}</span>
              <h2 className="pric-name">{m.name}</h2>
              <div className="pric-price-row">
                <b className="pric-price">{m.price}</b>
                <span className="pric-period mono">{m.period}</span>
              </div>
              {m.scopes && (
                <ul className="pric-scopes">
                  {m.scopes.map((s) => (
                    <li key={s.name}><span>{s.name}</span><b className="mono">{s.price}</b></li>
                  ))}
                </ul>
              )}
              <p className="pric-note">{m.priceNote}</p>

              <span className="pric-lab mono">{t('Кому підходить', "Who it's for")}</span>
              <p className="pric-txt">{m.forWhom}</p>

              <span className="pric-lab mono">{t('Що входить', "What's included")}</span>
              <ul className="pric-list">
                {m.includes.map((it) => <li key={it}><span aria-hidden="true">—</span>{it}</li>)}
              </ul>

              <span className="pric-lab mono">{t('Формат роботи', 'How we work')}</span>
              <p className="pric-txt">{m.format}</p>

              <span className="pric-lab mono">{t('Умови', 'Terms')}</span>
              <p className="pric-txt">{m.terms}</p>

              <p className="pric-resp">{m.resp}</p>
              <Link to={lp('/contact')} className={'sysx-cta pric-cta' + (m.featured ? ' is-primary' : '')}>{t('Обговорити формат', 'Discuss format')} {m.n} →</Link>
            </article>
          ))}
        </div>

        {/* Порівняльна таблиця (десктоп) / стопка (мобайл) */}
        <div className="pric-compare">
          <table className="pric-table">
            <thead>
              <tr><th /><th>{t('01 · Аудит', '01 · Audit')}</th><th>{t('02 · Консалтинг', '02 · Consulting')}</th><th>{t('03 · Управління', '03 · Managed')}</th></tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.k}>
                  <td className="pric-table-k mono">{row.k}</td>
                  {row.v.map((cell, ci) => <td key={ci}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pric-compare-m">
            {COMPARE.map((row) => (
              <div key={row.k} className="pric-compare-card">
                <span className="pric-table-k mono">{row.k}</span>
                {row.v.map((cell, ci) => (
                  <p key={ci}><b className="mono">0{ci + 1}</b> {cell}</p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Завжди — вхід через діагностику */}
        <div className="pric-always">
          <span className="pric-always-lab mono">{t('Завжди', 'Always')}</span>
          <p>{t('Будь-яка співпраця починається з діагностики — без неї ми не консультуємо і не беремо управління. Інвестиція зіставляється з упущеним оборотом із калькулятора, кожен етап — з DoD і траншами під результат.', "Any cooperation begins with diagnostics — without it we don't consult and don't take on delivery. The investment is compared with the revenue lost from the calculator, each stage — with DoD and tranches tied to results.")}</p>
          <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Почати з діагностики', 'Start with diagnostics')} →</Link>
        </div>

        {/* FAQ + обмежена доступність */}
        <div className="pric-faqwrap">
          <div className="pric-faq">
            <span className="sysx-kick">{t('FAQ · знімаємо заперечення', 'FAQ · removing objections')}</span>
            <div className="pric-faq-list">
              {FAQ.map((f, i) => (
                <div key={f.q} className={'pric-faq-item' + (open === i ? ' is-open' : '')}>
                  <button className="pric-faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                    <span>{f.q}</span><i aria-hidden="true">{open === i ? '−' : '+'}</i>
                  </button>
                  {open === i && <p className="pric-faq-a">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
          <aside className="pric-avail">
            <span className="pric-always-lab mono">{t('Обмежена доступність', 'Limited availability')}</span>
            <b className="pric-avail-h">{t('Глибина замість потоку', 'Depth over volume')}</b>
            <p>{t('Беремо обмежену кількість активних мандатів одночасно — щоб кожен клієнт отримав увагу рівня P&L-власника, а не «ще один проєкт у черзі».', 'We take on a limited number of active mandates at once — so each client gets attention at the level of a P&L owner, not "one more project in the queue".')}</p>
            <div className="pric-avail-ratio"><b>1 : 1</b><span>{t('один власник —', 'one owner —')}<br />{t('один фокус на результат', 'one focus on the result')}</span></div>
          </aside>
        </div>
      </div>
    </section>
  );
}

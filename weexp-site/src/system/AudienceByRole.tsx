import { Link } from 'react-router-dom';
import './system.css';

/**
 * «Ваша роль — ваш результат» (ТЗ §8). Одна система — але комунікація під
 * кожного ЛПР: власник/CEO, комерційний директор, маркетинг/CMO, керівник
 * e-commerce. Кожна картка: що турбує роль → що вона отримує → на чому фокус.
 * Знімає розрив «сайт говорить в середньому до всіх».
 */
type Role = { key: string; role: string; worry: string; get: string; focus: string[] };
const ROLES: Role[] = [
  {
    key: 'owner', role: 'Власник / CEO',
    worry: 'Бізнес тримається на мені — я і є вузьке місце.',
    get: 'Система, що працює без вас: власник у кожної частини, метрики й регулярний цикл. Independence Score як KPI передачі.',
    focus: ['Незалежність', 'Модель росту', 'Governance'],
  },
  {
    key: 'commercial', role: 'Комерційний директор',
    worry: 'Оборот є, а прибутку — ні.',
    get: 'Керована економіка продажів: конверсія, чек, повторні, маржа й contribution — рішення за юніт-економікою, а не за оборотом.',
    focus: ['Маржа', 'LTV', 'Contribution'],
  },
  {
    key: 'cmo', role: 'Маркетинг / CMO',
    worry: 'Усе тримається на платному трафіку, а CAC росте.',
    get: 'Органіка, retention і бренд замість залежності від реклами: CRM-контур, повертаність, зростання LTV.',
    focus: ['CAC', 'Retention', 'Органіка'],
  },
  {
    key: 'ecom', role: 'Керівник e-commerce',
    worry: 'Вітрина не конвертує, дані розходяться, усе вручну.',
    get: 'Робоча вітрина й єдині дані: CRO, наскрізна аналітика (GA4 / P&L), інтеграції та операції без ручного режиму.',
    focus: ['Конверсія', 'Дані', 'Операції'],
  },
];

export function AudienceByRole() {
  return (
    <section className="abr sysx" aria-label="Ваша роль — ваш результат">
      <div className="abr-in">
        <div className="abr-head">
          <span className="sysx-kick">Кому це · за роллю</span>
          <h2 className="sysx-display abr-h">Одна система —<br /><span className="sysx-em">різні виграші</span></h2>
          <p className="abr-lead">Ми говоримо мовою кожного ЛПР. У кожної ролі свій біль і свій результат від однієї побудованої системи.</p>
        </div>

        <div className="abr-grid">
          {ROLES.map((r) => (
            <article key={r.key} className="abr-card">
              <span className="abr-role mono">{r.role}</span>
              <p className="abr-worry">«{r.worry}»</p>
              <p className="abr-get">{r.get}</p>
              <div className="abr-focus">{r.focus.map((f) => <span key={f} className="abr-chip">{f}</span>)}</div>
            </article>
          ))}
        </div>

        <div className="abr-cta">
          <span className="abr-cta-note mono">Ваша роль тут є? Діагностика покаже виграш саме під вас — за 5 хвилин.</span>
          <Link to="/diagnose" className="sysx-cta is-primary">Побачити мій виграш →</Link>
        </div>
      </div>
    </section>
  );
}

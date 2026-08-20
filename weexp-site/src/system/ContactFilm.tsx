import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import { sendLead } from '@/lib/leads';
import { track } from '@/lib/analytics';
import { DIAG_SUMMARY_KEY } from '@/data/xray';
import { getExpressAudit } from '@/system/cabinetData';
import { eur } from '@/system/lossModel';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * Контакт у світлому cinematic-напрямі (/contact) — конверсійний фініш арки.
 * Та сама логіка ліда, що й раніше (sendLead → /api/lead, mailto-fallback,
 * додається підсумок X-Ray), у мові превʼю: зібраний об'єкт як тло, форма в
 * скляній картці. «Це ще не робота, це діагноз».
 */
const MAIL = 'hello@weexp.agency';
type Status = 'idle' | 'sending' | 'ok' | 'fallback';

export function ContactFilm() {
  const t = useT();
  const lp = useLp();
  const TURNOVER = [t('до $0.5M', 'up to $0.5M'), '$0.5–1M', '$1–3M', '$3–10M', '> $10M'];
  // Кваліфікація ліда (ТЗ §9): роль ЛПР, головна задача, терміни, бюджет —
  // щоб відділ продажів одразу бачив, з ким і про що говорити.
  const ROLES = [t('Власник / CEO', 'Owner / CEO'), t('Комерційний директор', 'Commercial director'), t('Маркетинг / CMO', 'Marketing / CMO'), t('Керівник e-commerce', 'Head of e-commerce'), t('Інше', 'Other')];
  const TASKS = [t('Знайти вузьке місце', 'Find the bottleneck'), t('Зростання виторгу', 'Grow revenue'), t('Вихід у ЄС / США', 'Launch into the EU / US'), t('Новий сайт / платформа', 'New site / platform'), t('CRM / відділ продажів', 'CRM / sales team'), t('Аналітика й дані', 'Analytics and data'), t('Ще не визначився', 'Not decided yet')];
  const TIMELINE = [t('Готовий почати зараз', 'Ready to start now'), t('Протягом 1–3 місяців', 'Within 1–3 months'), t('Досліджую ринок', 'Exploring the market')];
  const BUDGET = [t('Ще не визначено', 'Not decided yet'), t('до €5k', 'up to €5k'), '€5–15k', '€15–40k', '€40k+'];
  const [status, setStatus] = useState<Status>('idle');
  const [diag, setDiag] = useState('');
  const [keepDiag, setKeepDiag] = useState(false);   // ЗА ЗАМОВЧУВАННЯМ не додаємо — клієнт вирішує чекбоксом
  const [fallbackUrl, setFallbackUrl] = useState('');

  // Підсумок аудиту: спершу текстовий X-Ray, інакше — будуємо з експрес-аудиту калькулятора.
  useEffect(() => {
    try {
      const x = localStorage.getItem(DIAG_SUMMARY_KEY) || '';
      if (x) { setDiag(x); return; }
      const ex = getExpressAudit();
      if (ex) setDiag(`${t('Експрес-аудит', 'Express audit')}: ${eur(ex.total)}${t('/рік', '/yr')} (${t('діапазон', 'range')} ${eur(ex.range[0])}–${eur(ex.range[1])}), Health ${ex.overallHealth}/100`);
    } catch { /* ignore */ }
  }, [t]);
  const attach = keepDiag ? diag : '';   // додаємо лише якщо клієнт увімкнув чекбокс

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    const f = new FormData(e.currentTarget);
    const payload = {
      source: attach ? 'diagnosis' : 'contact',
      name: String(f.get('name') || ''), email: String(f.get('email') || ''),
      phone: String(f.get('phone') || ''), store: String(f.get('store') || ''),
      turnover: String(f.get('turnover') || ''), comment: String(f.get('comment') || ''),
      role: String(f.get('role') || ''), task: String(f.get('task') || ''),
      timeline: String(f.get('timeline') || ''), budget: String(f.get('budget') || ''),
      diag: attach || undefined, company_website: String(f.get('company_website') || ''),
    };
    setStatus('sending');
    const res = await sendLead(payload);
    track('lead_submit', { source: payload.source, result: res, has_diag: Boolean(attach) });
    if (res === 'ok') { setStatus('ok'); return; }
    const body = [
      `${t("Ім'я", 'Name')}: ${payload.name}`, `${t('Роль', 'Role')}: ${payload.role}`, `Email: ${payload.email}`, `${t('Телефон', 'Phone')}: ${payload.phone}`,
      `${t('Магазин', 'Store')}: ${payload.store}`, `${t('Оборот', 'Turnover')}: ${payload.turnover}`, `${t('Задача', 'Task')}: ${payload.task}`,
      `${t('Терміни', 'Timeline')}: ${payload.timeline}`, `${t('Бюджет', 'Budget')}: ${payload.budget}`, `${t('Коментар', 'Comment')}: ${payload.comment}`,
      attach ? `\n— ${t('Результат діагностики', 'Diagnostics result')} —\n${attach}` : '',
    ].filter(Boolean).join('\n');
    const url = `mailto:${MAIL}?subject=${encodeURIComponent(t('Запит на діагноз — WEEXP', 'Request a diagnosis — WEEXP'))}&body=${encodeURIComponent(body)}`;
    try { navigator.clipboard?.writeText(body); } catch { /* ignore */ }
    setFallbackUrl(url); setStatus('fallback'); window.location.href = url;
  };

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className="sysx-calc-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.68} /></Suspense></div>

      <div className="sysx-calc-panel">
        <header className="sysx-calc-head">
          <div className="sysx-kick">{t('Наступний крок · Діагноз у грошах', 'Next step · A diagnosis in money')}</div>
          <h1 className="sysx-display sysx-calc-h1">{t('Зростання — це ', 'Growth is a ')}<span className="sysx-em">{t('система', 'system')}</span>.<br />{t('Почнімо з діагнозу.', 'Let’s start with a diagnosis.')}</h1>
          <p className="sysx-lead">{t('Залиште контакт — повернемося з першим зрізом розриву у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M. Це ще не робота, це діагноз.', 'Leave your contact — we’ll come back with a first read on the gap in money. For e-commerce manufacturers and D2C brands $0.5–10M. This isn’t the work yet — it’s a diagnosis.')}</p>
        </header>

        {status === 'ok' ? (
          <div className="sysx-card cf-thanks">
            <div className="sysx-kick">{t('Заявку отримано', 'Request received')}</div>
            <h2 className="sysx-display">{t('Дякуємо. Ми на звʼязку.', 'Thank you. We’re in touch.')}</h2>
            <p className="sysx-lead">{t('Заявка з вашими даними', 'Your request with your details')}{attach ? t(' і результатом діагностики', ' and diagnostics result') : ''}{t(' вже у нас. Повернемося протягом робочого дня з планом діагностики у грошах.', ' is already with us. We’ll come back within a business day with a plan for the diagnosis in money.')}</p>
            <a className="sysx-cta" href={`mailto:${MAIL}`}>{MAIL}</a>
          </div>
        ) : (
          <div className="sysx-card">
            {diag ? (
              <div className="ctf-attach">
                <label className="ctf-attach-check">
                  <input type="checkbox" checked={keepDiag} onChange={(e) => setKeepDiag(e.target.checked)} />
                  <span>{t('Додати підсумок мого аудиту до заявки', 'Attach my audit summary to the request')}</span>
                </label>
                {keepDiag && <pre className="ctf-diag-body mono">{diag}</pre>}
              </div>
            ) : (
              <div className="ctf-attach ctf-attach-none">
                <span className="ctf-attach-lab">{t('Аудит ще не пройдено', 'No audit yet')}</span>
                <p>{t('Хочете, щоб ми відштовхувались від цифр? Пройдіть безкоштовний Express Audit — і його підсумок можна буде додати сюди.', 'Want us to start from numbers? Take the free Express Audit — its summary can then be attached here.')}</p>
                <Link to={lp('/diagnose')} className="sysx-cta">{t('Пройти Express Audit', 'Take the Express Audit')} →</Link>
              </div>
            )}
            <form className="ctf-form" onSubmit={submit}>
              <label className="ctf-field"><span className="mono">{t("Ім'я", 'Name')}</span><input name="name" required autoComplete="name" /></label>
              <label className="ctf-field"><span className="mono">{t('Ваша роль', 'Your role')}</span>
                <select name="role" required defaultValue="">
                  <option value="" disabled>{t('оберіть…', 'select…')}</option>
                  {ROLES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="ctf-field"><span className="mono">Email</span><input name="email" type="email" required autoComplete="email" /></label>
              <label className="ctf-field"><span className="mono">{t('Телефон', 'Phone')}</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label className="ctf-field"><span className="mono">{t('Магазин / сайт', 'Store / site')}</span><input name="store" required /></label>
              <label className="ctf-field"><span className="mono">{t('Оборот / міс', 'Turnover / mo')}</span>
                <select name="turnover" required defaultValue="">
                  <option value="" disabled>{t('оберіть…', 'select…')}</option>
                  {TURNOVER.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="ctf-field"><span className="mono">{t('Головна задача', 'Main task')}</span>
                <select name="task" required defaultValue="">
                  <option value="" disabled>{t('оберіть…', 'select…')}</option>
                  {TASKS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="ctf-field"><span className="mono">{t('Терміни', 'Timeline')}</span>
                <select name="timeline" defaultValue="">
                  <option value="" disabled>{t('оберіть…', 'select…')}</option>
                  {TIMELINE.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="ctf-field ctf-full"><span className="mono">{t('Орієнтовний бюджет ', 'Approximate budget ')}<i className="ctf-opt">{t('(необовʼязково)', '(optional)')}</i></span>
                <select name="budget" defaultValue="">
                  <option value="" disabled>{t('оберіть…', 'select…')}</option>
                  {BUDGET.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="ctf-field ctf-full"><span className="mono">{t('Коментар / поточна проблема', 'Comment / current problem')}</span><textarea name="comment" rows={3} placeholder={t('Що зараз найбільше турбує у продажах?', 'What worries you most about sales right now?')} /></label>
              <input name="company_website" tabIndex={-1} autoComplete="off" className="ctf-hp" aria-hidden="true" />
              <div className="sysx-calc-actions ctf-full">
                <button className="sysx-cta is-primary" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? t('Надсилаємо…', 'Sending…') : t('Отримати діагноз →', 'Get the diagnosis →')}
                </button>
                <span className="sysx-note mono">UA · EU · US · {MAIL}</span>
              </div>
              {status === 'fallback' && (
                <p className="sysx-note mono ctf-full">{t('Пошту відкрито з готовим листом (також скопійовано в буфер).', 'Your email client opened with a ready message (also copied to the clipboard).')}
                  {t(' Якщо не відкрилась — ', ' If it didn’t open — ')}<a href={fallbackUrl}>{t('натисніть тут', 'click here')}</a>{t(' або напишіть на ', ' or write to ')}<a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>
              )}
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

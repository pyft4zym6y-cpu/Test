import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { sendLead } from '@/lib/leads';
import { track } from '@/lib/analytics';
import { DIAG_SUMMARY_KEY } from '@/data/xray';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * Контакт у світлому cinematic-напрямі (/contact) — конверсійний фініш арки.
 * Та сама логіка ліда, що й раніше (sendLead → /api/lead, mailto-fallback,
 * додається підсумок X-Ray), у мові превʼю: зібраний об'єкт як тло, форма в
 * скляній картці. «Це ще не робота, це діагноз».
 */
const TURNOVER = ['до $0.5M', '$0.5–1M', '$1–3M', '$3–10M', '> $10M'];
const MAIL = 'pashasidorenko18@gmail.com';
type Status = 'idle' | 'sending' | 'ok' | 'fallback';

export function ContactFilm() {
  const [status, setStatus] = useState<Status>('idle');
  const [diag, setDiag] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');

  useEffect(() => { try { setDiag(localStorage.getItem(DIAG_SUMMARY_KEY) || ''); } catch { /* ignore */ } }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    const f = new FormData(e.currentTarget);
    const payload = {
      source: diag ? 'diagnosis' : 'contact',
      name: String(f.get('name') || ''), email: String(f.get('email') || ''),
      phone: String(f.get('phone') || ''), store: String(f.get('store') || ''),
      turnover: String(f.get('turnover') || ''), comment: String(f.get('comment') || ''),
      diag: diag || undefined, company_website: String(f.get('company_website') || ''),
    };
    setStatus('sending');
    const res = await sendLead(payload);
    track('lead_submit', { source: payload.source, result: res, has_diag: Boolean(diag) });
    if (res === 'ok') { setStatus('ok'); return; }
    const body = [
      `Ім'я: ${payload.name}`, `Email: ${payload.email}`, `Телефон: ${payload.phone}`,
      `Магазин: ${payload.store}`, `Оборот: ${payload.turnover}`, `Коментар: ${payload.comment}`,
      diag ? `\n— Результат діагностики —\n${diag}` : '',
    ].filter(Boolean).join('\n');
    const url = `mailto:${MAIL}?subject=${encodeURIComponent('Запит на діагноз — WEEXP')}&body=${encodeURIComponent(body)}`;
    try { navigator.clipboard?.writeText(body); } catch { /* ignore */ }
    setFallbackUrl(url); setStatus('fallback'); window.location.href = url;
  };

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className="sysx-calc-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.68} /></Suspense></div>

      <div className="sysx-calc-panel">
        <header className="sysx-calc-head">
          <div className="sysx-kick">Наступний крок · Діагноз у грошах</div>
          <h1 className="sysx-display sysx-calc-h1">Зростання — це <span className="sysx-em">система</span>.<br />Почнімо з діагнозу.</h1>
          <p className="sysx-lead">Залиште контакт — повернемося з першим зрізом розриву у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M. Це ще не робота, це діагноз.</p>
        </header>

        {status === 'ok' ? (
          <div className="sysx-card cf-thanks">
            <div className="sysx-kick">Заявку отримано</div>
            <h2 className="sysx-display">Дякуємо. Ми на звʼязку.</h2>
            <p className="sysx-lead">Заявка з вашими даними{diag ? ' і результатом X-Ray' : ''} вже у нас. Повернемося протягом робочого дня з планом діагностики у грошах.</p>
            <a className="sysx-cta" href={`mailto:${MAIL}`}>{MAIL}</a>
          </div>
        ) : (
          <div className="sysx-card">
            {diag && (
              <div className="ctf-diag mono">
                <span className="ctf-diag-lab">До заявки додається ваш результат X-Ray</span>
                <pre className="ctf-diag-body">{diag}</pre>
              </div>
            )}
            <form className="ctf-form" onSubmit={submit}>
              <label className="ctf-field"><span className="mono">Ім'я</span><input name="name" required autoComplete="name" /></label>
              <label className="ctf-field"><span className="mono">Email</span><input name="email" type="email" required autoComplete="email" /></label>
              <label className="ctf-field"><span className="mono">Телефон</span><input name="phone" type="tel" autoComplete="tel" /></label>
              <label className="ctf-field"><span className="mono">Магазин / сайт</span><input name="store" required /></label>
              <label className="ctf-field ctf-full"><span className="mono">Оборот / міс</span>
                <select name="turnover" required defaultValue="">
                  <option value="" disabled>оберіть…</option>
                  {TURNOVER.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="ctf-field ctf-full"><span className="mono">Коментар</span><textarea name="comment" rows={3} /></label>
              <input name="company_website" tabIndex={-1} autoComplete="off" className="ctf-hp" aria-hidden="true" />
              <div className="sysx-calc-actions ctf-full">
                <button className="sysx-cta is-primary" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Надсилаємо…' : 'Отримати діагноз →'}
                </button>
                <span className="sysx-note mono">UA · EU · US · {MAIL}</span>
              </div>
              {status === 'fallback' && (
                <p className="sysx-note mono ctf-full">Пошту відкрито з готовим листом (також скопійовано в буфер).
                  Якщо не відкрилась — <a href={fallbackUrl}>натисніть тут</a> або напишіть на <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>
              )}
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

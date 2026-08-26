import { useEffect, useState, type FormEvent } from 'react';
import { Eyebrow, FadeIn } from '@/lib/primitives';
import { say } from '@/lib/bus';
import { sendLead } from '@/lib/leads';
import { Turnstile, turnstileEnabled } from './Turnstile';
import { track } from '@/lib/analytics';
import { DIAG_SUMMARY_KEY } from '@/data/xray';
import './contact.css';

/**
 * Контакт — лид-форма → /api/lead (Resend). Реальна відправка з чесним
 * статусом; до листа додається підсумок Business X-Ray, якщо клієнт проходив
 * діагностику. Якщо бекенд не налаштований або впав — запасний mailto.
 */
const TURNOVER = ['до $0.5M', '$0.5–1M', '$1–3M', '$3–10M', '> $10M'];
const MAIL = 'pashasidorenko18@gmail.com';
type Status = 'idle' | 'sending' | 'ok' | 'fallback';

export function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  // Токен перевірки «я не робот». Порожній, поки віджет не відпрацював.
  const [tsToken, setTsToken] = useState('');
  const [diag, setDiag] = useState<string>('');
  const [fallbackUrl, setFallbackUrl] = useState<string>('');

  useEffect(() => {
    try { setDiag(localStorage.getItem(DIAG_SUMMARY_KEY) || ''); } catch { /* ignore */ }
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    const f = new FormData(e.currentTarget);
    const payload = {
      source: diag ? 'diagnosis' : 'contact',
      name: String(f.get('name') || ''),
      email: String(f.get('email') || ''),
      phone: String(f.get('phone') || ''),
      store: String(f.get('store') || ''),
      turnover: String(f.get('turnover') || ''),
      comment: String(f.get('comment') || ''),
      diag: diag || undefined,
      company_website: String(f.get('company_website') || ''), // honeypot
      turnstile: tsToken || undefined,
    };
    setStatus('sending');
    const res = await sendLead(payload);
    track('lead_submit', { source: payload.source, result: res, has_diag: Boolean(diag) });
    if (res === 'ok') {
      setStatus('ok');
      say('Дякую! Заявку отримано — повернемося з планом діагностики у грошах.');
      return;
    }
    // Ліміт і бот-перевірка — не привід кидати людину в mailto: це поправно
    // прямо тут, треба лише сказати, що саме сталось.
    if (res === 'too_many' || res === 'robot') {
      setStatus('idle');
      say(res === 'too_many'
        ? 'Забагато заявок з цієї адреси за годину. Напишіть на hello@weexp.agency — відповімо так само.'
        : 'Перевірка «я не робот» не пройдена. Оновіть сторінку і спробуйте ще раз.');
      return;
    }
    // Бекенд не налаштований або збій — готуємо чесний mailto-fallback.
    const body = [
      `Ім'я: ${payload.name}`, `Email: ${payload.email}`, `Телефон: ${payload.phone}`,
      `Магазин: ${payload.store}`, `Оборот: ${payload.turnover}`, `Коментар: ${payload.comment}`,
      diag ? `\n— Результат діагностики —\n${diag}` : '',
    ].filter(Boolean).join('\n');
    const url = `mailto:${MAIL}?subject=${encodeURIComponent('Запит на діагноз — WEEXP')}&body=${encodeURIComponent(body)}`;
    try { navigator.clipboard?.writeText(body); } catch { /* ignore */ }
    setFallbackUrl(url);
    setStatus('fallback');
    window.location.href = url;
    say('Автовідправлення недоступне — відкрив пошту з готовим листом. Натисніть «Надіслати».');
  };

  if (status === 'ok') {
    return (
      <section className="ct" id="contact">
        <div className="wrap ct-grid">
          <FadeIn className="ct-left">
            <Eyebrow>Заявку отримано</Eyebrow>
            <h2 className="ct-h">Дякуємо. Ми <span className="mk">на звʼязку</span>.</h2>
            <p className="ct-lead">Заявка з вашими даними{diag ? ' і результатом діагностики' : ''} вже у нас.
              Повернемося протягом робочого дня з планом діагностики у грошах.</p>
            <div className="ct-alt mono"><a href={`mailto:${MAIL}`}>{MAIL}</a><span>UA · EU · US</span></div>
          </FadeIn>
        </div>
      </section>
    );
  }

  return (
    <section className="ct" id="contact" data-say="Наступний крок — діагноз у грошах. Залиште контакт, решту зробимо ми.">
      <div className="wrap ct-grid">
        <FadeIn className="ct-left">
          <Eyebrow>Наступний крок</Eyebrow>
          <h2 className="ct-h">Зростання — це <span className="mk">система</span>. Почнімо з діагнозу.</h2>
          <p className="ct-lead">Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.</p>
          {diag && (
            <div className="ct-diag mono">
              <span className="ct-diag-lab">До заявки додається ваш результат X-Ray</span>
              <pre className="ct-diag-body">{diag}</pre>
            </div>
          )}
          <div className="ct-alt mono">
            <a href={`mailto:${MAIL}`}>{MAIL}</a>
            <span>UA · EU · US</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.1} className="ct-formwrap">
          <form className="ct-form" onSubmit={submit}>
            <label className="ct-field"><span className="mono">Ім'я</span><input name="name" required autoComplete="name" /></label>
            <label className="ct-field"><span className="mono">Email</span><input name="email" type="email" required autoComplete="email" /></label>
            <label className="ct-field"><span className="mono">Телефон</span><input name="phone" type="tel" autoComplete="tel" /></label>
            <label className="ct-field"><span className="mono">Магазин / сайт</span><input name="store" required /></label>
            <label className="ct-field"><span className="mono">Оборот / міс</span>
              <select name="turnover" required defaultValue="">
                <option value="" disabled>оберіть…</option>
                {TURNOVER.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="ct-field ct-full"><span className="mono">Коментар</span><textarea name="comment" rows={3} /></label>
            {/* honeypot: приховане поле, люди його не бачать */}
            <input name="company_website" tabIndex={-1} autoComplete="off" className="ct-hp" aria-hidden="true" />
            {/* Показується тільки якщо задано VITE_TURNSTILE_SITE_KEY. */}
            <Turnstile onToken={setTsToken} />
            <button className="ct-submit mono" type="submit" disabled={status === 'sending' || (turnstileEnabled && !tsToken)}>
              {status === 'sending' ? 'Надсилаємо…' : turnstileEnabled && !tsToken ? 'Перевірка…' : 'Отримати діагноз →'}
            </button>
            {status === 'fallback' && (
              <p className="ct-note mono">Пошту відкрито з готовим листом (також скопійовано в буфер).
                Якщо не відкрилась — <a href={fallbackUrl}>натисніть тут</a> або напишіть на <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>
            )}
          </form>
        </FadeIn>
      </div>
    </section>
  );
}

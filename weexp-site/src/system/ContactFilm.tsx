import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import { useLiteVisuals } from '@/lib/liteVisuals';
import { sendLead } from '@/lib/leads';
import { Turnstile, turnstileEnabled } from '@/components/Turnstile';
import { track } from '@/lib/analytics';
import { DIAG_SUMMARY_KEY } from '@/data/xray';
import { getExpressAudit } from '@/system/expressLocal';
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
type Status = 'idle' | 'sending' | 'ok' | 'error';

export function ContactFilm() {
  const t = useT();
  const lp = useLp();
  const lite = useLiteVisuals();
  // Коротка форма: імʼя + телефон обовʼязкові, решта — необовʼязкова.
  const loc = useLocation();
  const [status, setStatus] = useState<Status>('idle');
  // Перевірка «я не робот». Форма анонімна — саме тут захист і потрібен.
  // Якщо віджет не піднявся (блокувальник, мережа) — кнопку НЕ блокуємо:
  // мертва кнопка на формі заявок означає, що заявки просто не приходять.
  const [tsToken, setTsToken] = useState('');
  const [tsBroken, setTsBroken] = useState(false);
  const [failMsg, setFailMsg] = useState('');
  const [emailErr, setEmailErr] = useState('');   // мʼяка інлайн-підказка по email
  const [phoneErr, setPhoneErr] = useState('');
  // «Формат співпраці»: необовʼязковий select; префіл з ?format=1|2|3 (кнопки
  // «Обговорити формат N» на /pricing). Користувач може змінити вручну.
  // У списку — НАЗВА послуги без «Формат N —»: нумерація має сенс на сторінці
  // цін, де картки стоять поруч, а в контактній формі це шум перед потрібним
  // словом. Порядок масиву лишається джерелом префілу за ?format=.
  const FORMATS = [t('Аудит', 'Audit'), t('Консалтинг і супровід', 'Consulting & support'), t('Управління під ключ', 'Turnkey management')];
  const [format, setFormat] = useState('');
  useEffect(() => {
    const m = new URLSearchParams(loc.search).get('format');
    if (m && /^[123]$/.test(m)) setFormat(FORMATS[Number(m) - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.search]);
  const [diag, setDiag] = useState('');
  const [keepDiag, setKeepDiag] = useState(false);   // ЗА ЗАМОВЧУВАННЯМ не додаємо — клієнт вирішує чекбоксом

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
      phone: String(f.get('phone') || ''),
      site: String(f.get('site') || ''), comment: String(f.get('comment') || ''),
      task: format || undefined,   // обраний формат співпраці → колонка «Задача» заявки
      diag: attach || undefined, company_website: String(f.get('company_website') || ''),
      turnstile: tsToken || undefined,
    };
    setStatus('sending'); setFailMsg('');
    const res = await sendLead(payload);
    track('lead_submit', { source: payload.source, result: res, has_diag: Boolean(attach) });
    // Заявка створюється у системі (Supabase → адмінка). Ніяких mailto/буфера:
    // або підтвердження, або чесна помилка з поясненням, ЩО саме сталось.
    if (res === 'too_many') {
      setFailMsg(t('Забагато заявок з цієї адреси за годину. Напишіть нам на пошту — відповімо так само.', 'Too many requests from this address this hour. Email us — we answer just the same.'));
      setStatus('error'); return;
    }
    if (res === 'robot' && !tsBroken) {
      setFailMsg(t('Перевірка «я не робот» не пройдена. Оновіть сторінку і спробуйте ще раз.', 'The "I am not a robot" check did not pass. Reload the page and try again.'));
      setStatus('error'); return;
    }
    setStatus(res === 'ok' ? 'ok' : 'error');
  };

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className={'sysx-calc-bg' + (lite ? ' is-lite' : '')} aria-hidden="true">{!lite && <Suspense fallback={null}><CommerceSystem3D fixedProgress={0.68} /></Suspense>}</div>

      <div className="sysx-calc-panel">
        <header className="sysx-calc-head">
          <div className="sysx-kick">{t('Наступний крок · Діагноз у грошах', 'Next step · A diagnosis in money')}</div>
          <h1 className="sysx-display sysx-calc-h1">{t('Зростання — це ', 'Growth is a ')}<span className="sysx-em">{t('система', 'system')}</span>.<br />{t('Почнімо з діагнозу.', 'Let’s start with a diagnosis.')}</h1>
          <p className="sysx-lead">{t('Залиште контакт — повернемося з першим зрізом розриву у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M. Це ще не робота, це діагноз.', 'Leave your contact — we’ll come back with a first read on the gap in money. For e-commerce manufacturers and D2C brands $0.5–10M. This isn’t the work yet — it’s a diagnosis.')}</p>
        </header>

        {status === 'ok' ? (
          <div className="sysx-card cf-thanks">
            <div className="sysx-kick">{t('Заявку отримано', 'Request received')}</div>
            <h2 className="sysx-display">{t('Дякуємо! Ваш запит отримано.', 'Thank you! Your request has been received.')}</h2>
            <p className="sysx-lead">{t('Менеджер зв’яжеться з вами протягом робочого дня.', 'A manager will contact you within one business day.')}{attach ? t(' Підсумок вашого аудиту додано до заявки.', ' Your audit summary has been attached to the request.') : ''}</p>
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
            ) : null}
            <form className="ctf-form" onSubmit={submit}>
              <label className="ctf-field ctf-full"><span className="mono">{t('Формат співпраці ', 'Cooperation format ')}<i className="ctf-opt">{t('(необовʼязково)', '(optional)')}</i></span>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="">{t('— не обрано —', '— not selected —')}</option>
                  {FORMATS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="ctf-field"><span className="mono">{t("Ім'я", 'Name')} *</span><input name="name" required autoComplete="name" /></label>
              <label className="ctf-field"><span className="mono">{t('Телефон', 'Phone')} *</span>
                <input name="phone" type="tel" required autoComplete="tel" aria-invalid={!!phoneErr}
                  onBlur={(e) => setPhoneErr(e.target.value && e.target.value.replace(/\D/g, '').length < 7 ? t('Схоже, номер неповний', 'The number looks incomplete') : '')}
                  onInput={() => phoneErr && setPhoneErr('')} />
                {phoneErr && <span className="s3-err mono ctf-inperr">{phoneErr}</span>}
              </label>
              <label className="ctf-field"><span className="mono">{t('Сайт ', 'Site ')}<i className="ctf-opt">{t('(необовʼязково)', '(optional)')}</i></span><input name="site" type="url" placeholder="https://" /></label>
              <label className="ctf-field"><span className="mono">Email <i className="ctf-opt">{t('(необовʼязково)', '(optional)')}</i></span>
                <input name="email" type="email" autoComplete="email" aria-invalid={!!emailErr}
                  onBlur={(e) => setEmailErr(e.target.value && !/.+@.+\..+/.test(e.target.value) ? t('Схоже, email некоректний', 'This email looks invalid') : '')}
                  onInput={() => emailErr && setEmailErr('')} />
                {emailErr && <span className="s3-err mono ctf-inperr">{emailErr}</span>}
              </label>
              <label className="ctf-field ctf-full"><span className="mono">{t('Коментар ', 'Comment ')}<i className="ctf-opt">{t('(необовʼязково)', '(optional)')}</i></span><textarea name="comment" rows={3} placeholder={t('Що зараз найбільше турбує у продажах?', 'What worries you most about sales right now?')} /></label>
              <input name="company_website" tabIndex={-1} autoComplete="off" className="ctf-hp" aria-hidden="true" />
              <div className="ctf-full"><Turnstile onToken={setTsToken} onFail={() => setTsBroken(true)} /></div>
              <div className="sysx-calc-actions ctf-full">
                <button className="sysx-cta is-primary" type="submit" disabled={status === 'sending' || (turnstileEnabled && !tsToken && !tsBroken)}>
                  {status === 'sending' ? t('Надсилаємо…', 'Sending…')
                    : turnstileEnabled && !tsToken && !tsBroken ? t('Перевірка…', 'Checking…')
                    : t('Отримати діагноз →', 'Get the diagnosis →')}
                </button>
                <span className="sysx-note mono">UA · EU · US · {MAIL}</span>
              </div>
              {status === 'error' && (
                <p className="s3-err mono ctf-full">{failMsg || t('Не вдалося надіслати заявку. Спробуйте ще раз або напишіть нам на ', 'Could not send the request. Please try again or write to us at ')}{!failMsg && <><a href={`mailto:${MAIL}`}>{MAIL}</a>.</>}</p>
              )}
            </form>
            {!diag && (
              <div className="ctf-attach ctf-attach-none ctf-attach-after">
                <span className="ctf-attach-lab">{t('Аудит ще не пройдено', 'No audit yet')}</span>
                <p>{t('Хочете, щоб ми відштовхувались від цифр? Пройдіть безкоштовний Express Audit — і його підсумок можна буде додати сюди.', 'Want us to start from numbers? Take the free Express Audit — its summary can then be attached here.')}</p>
                <Link to={lp('/diagnose')} className="sysx-cta">{t('Пройти Express Audit', 'Take the Express Audit')} →</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

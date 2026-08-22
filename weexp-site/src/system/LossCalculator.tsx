import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { computeLoss, eur, project, localizeSys, sysLabel, leakLabel, actionText, type LossInput, type LossResult, type SysKey } from './lossModel';
import { saveExpressAudit } from './cabinetData';
import { sendLead } from '@/lib/leads';
import { shortOf } from '@/data/xray';
import { useT, useLp, useLang } from '@/i18n';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * Калькулятор витрат — перший крок воронки діагностики (крок 1 з 2). Дає ЧИСЛО:
 * скільки грошей витікає з вітрини щороку (оцінка за даними + бенчмарками). Далі
 * природно веде до кроку 2 — повної діагностики, що перетворює число на КАРТУ:
 * де саме, чому і як повернути. Заповнюючи профіль, користувач бачить, як його
 * бізнес складається в Commerce System; на результаті вузол-bottleneck пульсує.
 */
const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');

export function LossCalculator() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const FIELDS: { k: keyof Omit<LossInput, 'symptoms'>; label: string; unit: string; hint?: string }[] = [
    { k: 'monthlyRevenue', label: t('Онлайн-виторг', 'Online revenue'), unit: t('€ / міс', '€ / mo') },
    { k: 'aov', label: t('Середній чек', 'Average order value (AOV)'), unit: '€' },
    { k: 'conversion', label: t('Конверсія', 'Conversion'), unit: '%' },
    { k: 'repeatRate', label: t('Частка повторних', 'Repeat purchase share'), unit: '%' },
    { k: 'returnsRate', label: t('Повернення + скасування', 'Returns + cancellations'), unit: '%' },
    { k: 'grossMargin', label: t('Валова маржа', 'Gross margin'), unit: '%' },
    { k: 'cac', label: t('Вартість залучення (CAC)', 'Acquisition cost (CAC)'), unit: '€', hint: t('необовʼязково', 'optional') },
  ];
  const PAIN: Record<SysKey, string> = {
    strategy: t('Не розуміємо, куди рости', "We don't know where to grow"),
    commercial: t('Виторг є, а прибутку — ні', 'Revenue is there, profit is not'),
    customer: t('Клієнт дорогий і не повертається', "Customers are expensive and don't return"),
    experience: t('Люди заходять, але не купують', "People come but don't buy"),
    operations: t('Забагато ручної роботи', 'Too much manual work'),
    data: t('У кожного свої цифри', 'Everyone has their own numbers'),
    org: t('Усе тримається на власнику', 'Everything rests on the owner'),
    expansion: t('Уперлися в стелю ринку', 'Hit the market ceiling'),
  };
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inp, setInp] = useState<LossInput>({ monthlyRevenue: 0, aov: 0, conversion: 0, repeatRate: 0, returnsRate: 0, grossMargin: 0, cac: 0, symptoms: [] });
  const [res, setRes] = useState<LossResult | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [oName, setOName] = useState('');
  const [oEmail, setOEmail] = useState('');
  const [oPhone, setOPhone] = useState('');
  const [oErr, setOErr] = useState('');
  const alerts = useRef<number[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  // Зміна кроку — підводимо панель до верху вьюпорта (щоб екран не «стрибав» посередині форми)
  useEffect(() => {
    const el = panelRef.current; if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, [step]);

  const setNum = (k: keyof Omit<LossInput, 'symptoms'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInp((s) => ({ ...s, [k]: parseFloat(e.target.value) || 0 }));
  const toggle = (k: SysKey) => setInp((s) => ({ ...s, symptoms: s.symptoms.includes(k) ? s.symptoms.filter((x) => x !== k) : [...s.symptoms, k] }));
  const compute = () => { const r = computeLoss(inp); setRes(r); alerts.current = r.bottleneckNodes; saveExpressAudit(inp, r); setStep(3); };
  const restart = () => { alerts.current = []; setRes(null); setLeadSent(false); setStep(1); };
  const primaryLabel = (k: SysKey) => sysLabel(k, lang);

  // «Замовити аудит» — збираємо контакт (щоб було куди відповісти) + дані аудиту,
  // надсилаємо лід команді й показуємо зрозуміле підтвердження з наступними кроками.
  const orderAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!res) return;
    const email = oEmail.trim();
    if (!email || !/.+@.+\..+/.test(email)) { setOErr(t('Вкажіть коректний email — щоб ми надіслали план аудиту.', 'Enter a valid email — so we can send you the audit plan.')); return; }
    setOErr(''); setLeadBusy(true);
    await sendLead({
      source: 'calc-order-audit', role: 'calc', name: oName.trim() || undefined, email, phone: oPhone.trim() || undefined,
      task: t('Заявка на повний аудит з калькулятора', 'Full-audit request from calculator'),
      comment: `${t('Витік', 'Leak')}: ${eur(res.total)}/${t('рік', 'yr')} · bottleneck: ${sysLabel(res.primary, lang)} · Health ${res.overallHealth}/100`,
      calc: `total=${res.total};range=${res.range[0]}-${res.range[1]};bottleneck=${res.primary};health=${res.overallHealth}`,
    });
    setLeadBusy(false); setLeadSent(true); setOrderOpen(false);
  };

  // Брендований PDF результату — самодостатня друкована сторінка (нова вкладка → друк/зберегти в PDF).
  const downloadBrandedPdf = () => {
    if (!res) return;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const proj = project(inp, res, lang);
    const leaks = res.leaks.slice(0, 5).map((l) => `<tr><td>${esc(leakLabel(l, lang))}</td><td class="n">${esc(eur(l.amount))}</td></tr>`).join('');
    const health = res.health.map((h) => `<div class="hb"><span>${esc(shortOf(h.key, lang))}</span><i><b style="width:${h.score}%"></b></i><em>${h.score}</em></div>`).join('');
    const actions = res.actions.map((a) => `<li>${esc(actionText(a.key, lang))}</li>`).join('');
    const projRows = proj.income.map((d) => `<tr><td>${esc(d.label)}</td><td>${esc(d.before)} → <b>${esc(d.after)}</b></td><td class="up">+${d.pct}%</td></tr>`).join('');
    const doc = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WEEXP — ${esc(t('Експрес-аудит витоку', 'Express leak audit'))}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Golos Text',-apple-system,Segoe UI,Roboto,sans-serif;color:#141210;background:#FAF5E9;max-width:760px;margin:0 auto;padding:30px 26px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bar{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #141210;padding-bottom:12px;margin-bottom:22px}
.logo{font-weight:900;text-transform:uppercase;font-size:20px;letter-spacing:-.01em}.logo span{color:#F5301C}
.kick{font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:#F5301C}
h1{font-size:30px;font-weight:900;text-transform:uppercase;line-height:.95;margin:14px 0 4px;letter-spacing:-.02em}
.big{font-size:46px;font-weight:900;color:#F5301C;letter-spacing:-.03em;line-height:1;margin-top:6px}
.sub{font-size:12px;color:#6B675E;margin-top:4px}
.card{border:2.5px solid #141210;box-shadow:6px 6px 0 #141210;background:#fff;padding:18px 18px;margin:18px 0}
.card.red{box-shadow:6px 6px 0 #F5301C}
h2{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px}
table{width:100%;border-collapse:collapse;font-size:13px}td{padding:6px 4px;border-bottom:1px solid #e3d9c0}
td.n{text-align:right;font-weight:800}td.up{color:#1F9D55;font-weight:800;text-align:right}
.hb{display:flex;align-items:center;gap:10px;font-size:12px;margin:6px 0}.hb span{width:120px;font-weight:700}
.hb i{flex:1;height:12px;border:2px solid #141210;background:#F1E9D4;position:relative}.hb b{position:absolute;inset:0 auto 0 0;background:#F5301C;display:block}
.hb em{width:32px;text-align:right;font-weight:800;font-style:normal}
ol{margin:0 0 0 18px}ol li{font-size:13px;margin:5px 0}
.foot{margin-top:22px;font-size:11px;color:#6B675E;border-top:1px solid #e3d9c0;padding-top:10px}
@page{margin:14mm}
</style></head><body>
<div class="bar"><span class="logo">WEE<span>X</span>P</span><span class="kick">${esc(t('Експрес-аудит', 'Express audit'))}</span></div>
<span class="kick">${esc(t('Ваш витік в e-commerce · оцінка', 'Your e-commerce leak · estimate'))}</span>
<div class="big">${esc(eur(res.total))} <span style="font-size:.4em;color:#6B675E">/ ${esc(t('рік', 'yr'))}</span></div>
<div class="sub">${esc(t('діапазон', 'range'))} ${esc(eur(res.range[0]))}–${esc(eur(res.range[1]))}</div>
<div class="card"><h2>${esc(t('Куди тече виторг', 'Where revenue leaks'))}</h2><table>${leaks}</table></div>
<div class="card red"><h2>${esc(t('Головний bottleneck', 'Main bottleneck'))}</h2><b style="font-size:18px;text-transform:uppercase">${esc(primaryLabel(res.primary))}</b><div class="sub">${esc(t('вторинний', 'secondary'))} — ${esc(primaryLabel(res.secondary))}</div></div>
<div class="card"><h2>Business Health · ${res.overallHealth}/100</h2>${health}</div>
<div class="card"><h2>${esc(t('Три перші дії', 'First three actions'))}</h2><ol>${actions}</ol></div>
${projRows ? `<div class="card"><h2>${esc(t('Зараз → куди можемо прийти', 'Now → where we can get to'))}</h2><table>${projRows}</table></div>` : ''}
<div class="foot">${esc(t('Оцінка за наданими даними. Не фінансовий аудит. Для точної карти «де саме й чому» — глибокий аудит WEEXP.', 'An estimate based on your data. Not a financial audit. For a precise map of “exactly where and why” — WEEXP deep audit.'))} · weexp.agency</div>
<scr${''}ipt>window.onload=function(){setTimeout(function(){window.print()},400)}</scr${''}ipt>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert(t('Дозвольте спливаючі вікна, щоб зберегти PDF.', 'Allow pop-ups to save the PDF.')); return; }
    w.document.open(); w.document.write(doc); w.document.close();
  };

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className="sysx-calc-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.72} alerts={alerts} /></Suspense></div>

      <div className="sysx-calc-panel" ref={panelRef}>
        {step !== 3 && (
          <header className="sysx-calc-head">
            <div className="sysx-kick">{t('Діагностика e-commerce · крок', 'E-commerce diagnostics · step')} {step} · {t('~5 хвилин', '~5 minutes')}</div>
            <h1 className="sysx-display sysx-calc-h1">{t('Діагностика:', 'Diagnostics:')}<br />{t('почнімо з ', "let's start with ")}<span className="sysx-em">{t('числа', 'a number')}</span></h1>
            <p className="sysx-lead">{t('Безкоштовний експрес-аудит за 3 кроки: скільки виторгу витікає щороку, де саме й що робити першим. На виході — число, брендований PDF і можливість замовити повний аудит.', 'A free 3-step express audit: how much revenue leaks each year, where exactly and what to do first. You get a number, a branded PDF and the option to order a full audit.')}</p>
            <div className="sysx-steps mono"><span className={step === 1 ? 'on' : ''}>{t('01 Профіль', '01 Profile')}</span><i>→</i><span className={step === 2 ? 'on' : ''}>{t('02 Симптоми', '02 Symptoms')}</span><i>→</i><span className={String(step) === '3' ? 'on' : ''}>{t('03 Витік', '03 Leak')}</span></div>
          </header>
        )}

        {step === 1 && (
          <div className="sysx-card">
            <div className="sysx-grid">
              {FIELDS.map((f) => (
                <label key={f.k} className="sysx-inp">
                  <span className="sysx-inp-l">{f.label}{f.hint && <i> · {f.hint}</i>}</span>
                  <span className="sysx-inp-row">
                    <input type="number" inputMode="decimal" min={0} value={inp[f.k] || ''} onChange={setNum(f.k)} placeholder="0" />
                    <span className="sysx-inp-u mono">{f.unit}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta is-primary" onClick={() => setStep(2)} disabled={!inp.monthlyRevenue}>{t('Далі → симптоми', 'Next → symptoms')}</button>
              <span className="sysx-note mono">{t('Оцінка за наданими даними. Не фінансовий аудит.', 'An estimate based on your data. Not a financial audit.')}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sysx-card">
            <p className="sysx-lead">{t('Де відчуваєте проблему? Позначте все, що відгукується — кожен симптом перебудовує вашу систему.', 'Where do you feel the problem? Check everything that resonates — each symptom reshapes your system.')}</p>
            <div className="sysx-sym">
              {localizeSys(lang).map((s) => (
                <button key={s.key} className={`sysx-sym-b${inp.symptoms.includes(s.key) ? ' on' : ''}`} onClick={() => toggle(s.key)}>
                  <b>{s.label}</b><span>«{PAIN[s.key]}»</span>
                </button>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta" onClick={() => setStep(1)}>{t('← Назад', '← Back')}</button>
              <button className="sysx-cta is-primary" onClick={compute}>{t('Показати витік →', 'Show the leak →')}</button>
            </div>
          </div>
        )}

        {step === 3 && res && (
          <div className="sysx-result">
            <div className="sysx-kick">{t('Ваш витік в e-commerce · оцінка', 'Your e-commerce leak · estimate')}</div>
            <div className="sysx-total">
              <span className="sysx-total-big sysx-display">{eur(res.total)}<span>{t('/ рік', '/ year')}</span></span>
              <span className="sysx-total-cap mono">{t('оцінена можливість · діапазон ', 'estimated opportunity · range ')}{eur(res.range[0])}–{eur(res.range[1])}</span>
            </div>

            <div className="sysx-leaks">
              {res.leaks.slice(0, 5).map((l, i) => {
                const max = res.leaks[0].amount || 1;
                return (
                  <div key={l.label + i} className="sysx-leak">
                    <span className="sysx-leak-l">{leakLabel(l, lang)}</span>
                    <span className="sysx-leak-bar"><i style={{ width: `${Math.round((l.amount / max) * 100)}%` }} /></span>
                    <span className="sysx-leak-v mono">{eur(l.amount)}</span>
                  </div>
                );
              })}
            </div>

            <div className="sysx-bottleneck">
              <span className="sysx-kick">{t('Головний bottleneck', 'Main bottleneck')}</span>
              <b className="sysx-display">{primaryLabel(res.primary)}</b>
              <span className="mono">{t('вторинний — ', 'secondary — ')}{primaryLabel(res.secondary)}</span>
            </div>

            <div className="sysx-health">
              <div className="sysx-health-head"><span className="sysx-kick">Business Health</span><b className="sysx-display">{res.overallHealth}<i>/100</i></b></div>
              <div className="sysx-health-grid">
                {res.health.map((h) => (
                  <div key={h.key} className="sysx-hbar">
                    <span className="sysx-hbar-l mono">{shortOf(h.key, lang)}</span>
                    <span className={`sysx-hbar-t ${HW(h.score)}`}><i style={{ width: `${h.score}%` }} /></span>
                    <span className="sysx-hbar-v mono">{h.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sysx-actions">
              <span className="sysx-kick">{t('Три перші дії', 'First three actions')}</span>
              <ol>{res.actions.map((a) => <li key={a.key}>{actionText(a.key, lang)}</li>)}</ol>
            </div>

            {/* «Зараз → Куди можемо прийти» — чорнова ціль (уточнимо на наступних кроках) */}
            {(() => {
              const proj = project(inp, res, lang);
              if (!proj.income.length) return null;
              return (
                <div className="s2-project sysx-proj1">
                  <div className="s2-proj-head">
                    <span className="sysx-kick">{t('Зараз → Куди можемо прийти · чорнова ціль', 'Now → Where we can get to · draft target')}</span>
                    <p className="s2-proj-sub">{t('Перша оцінка за ', 'First estimate over ')}<b>{proj.horizon}</b>{t('. У повному аудиті цей діапазон ', '. In the full audit this range ')}<b>{t('уточнюється', 'is refined')}</b>{t(' вашими даними (CRM/ERP/GA4) — не рахуємо наново.', ' by your data (CRM/ERP/GA4) — no recalculation from scratch.')}</p>
                  </div>
                  <div className="s2-proj-income">
                    {proj.income.map((d) => (
                      <div key={d.label} className={`s2-proj-inc${d.hero ? ' is-hero' : ''}`}>
                        <span className="s2-proj-inc-l mono">{d.label}</span>
                        <div className="s2-proj-inc-v"><span className="s2-proj-now">{d.before}</span><em aria-hidden="true">→</em><b className="sysx-display s2-proj-aft">{d.after}</b></div>
                        <span className="s2-proj-badge up">+{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Що далі: забрати PDF, замовити повний аудит або зберегти в кабінет.
                Кроки 4–5 прибрані — глибокий аудит тепер окрема гілка (тільки за кодом). */}
            <div className="sysx-next2">
              <span className="sysx-kick">{t('Що далі', "What's next")}</span>
              <p className="sysx-next2-lead">{t('Число у вас є. Заберіть брендований PDF або ', 'You have the number. Take the branded PDF or ')}<b>{t('замовте повний аудит', 'order the full audit')}</b>{t(' — ми підтвердимо цифру вашими даними (CRM/ERP/GA4), знайдемо ', ' — we confirm the figure with your data (CRM/ERP/GA4), find ')}<b>{t('де саме', 'exactly where')}</b>{t(' витікає виторг і складемо план повернення під Definition of Done.', ' revenue leaks and build a recovery plan under a Definition of Done.')}</p>
            </div>

            {leadSent ? (
              <div className="calc-ordered">
                <span className="sysx-kick">{t('✓ Заявку надіслано', '✓ Request sent')}</span>
                <b className="sysx-display calc-ordered-h">{oName ? `${t('Дякуємо, ', 'Thank you, ')}${oName}!` : t('Дякуємо!', 'Thank you!')}</b>
                <p className="calc-ordered-p">{t('Ми отримали вашу заявку на повний аудит разом із результатом експрес-витоку ', 'We received your full-audit request together with your express-leak result ')}<b>{eur(res.total)}/{t('рік', 'yr')}</b>{t(' і головним вузлом «', ' and the main bottleneck «')}{primaryLabel(res.primary)}».</p>
                <div className="calc-ordered-next">
                  <span className="mono">{t('Що далі', "What's next")}:</span>
                  <ol>
                    <li>{t('Менеджер WEEXP звʼяжеться з вами на ', 'A WEEXP manager will contact you at ')}<b>{oEmail}</b>{oPhone ? ` / ${oPhone}` : ''} {t('протягом робочого дня.', 'within one business day.')}</li>
                    <li>{t('Короткий дзвінок (15–20 хв): звіримо контекст і цілі.', 'A short call (15–20 min): we align on context and goals.')}</li>
                    <li>{t('Надішлемо план і формат аудиту під ваш випадок.', 'We send an audit plan and format tailored to your case.')}</li>
                  </ol>
                </div>
                <div className="sysx-calc-actions">
                  <button className="sysx-cta" onClick={downloadBrandedPdf}>{t('Завантажити PDF', 'Download PDF')} ↓</button>
                  <Link className="sysx-cta" to={lp('/cabinet')}>{t('Зберегти в кабінет', 'Save to cabinet')} →</Link>
                </div>
              </div>
            ) : orderOpen ? (
              <form className="calc-order-form" onSubmit={orderAudit}>
                <span className="sysx-kick">{t('Замовити повний аудит', 'Order the full audit')}</span>
                <p className="calc-order-lead">{t('Лишіть контакт — надішлемо план повного аудиту й звʼяжемося протягом робочого дня. Результат вашого експрес-витоку додається до заявки автоматично.', 'Leave your contact — we\'ll send the full-audit plan and get in touch within a business day. Your express-leak result is attached to the request automatically.')}</p>
                <div className="calc-order-row">
                  <label className="sysx-inp"><span className="sysx-inp-l">{t("Ім'я", 'Name')}</span><input value={oName} onChange={(e) => setOName(e.target.value)} placeholder={t('Ваше імʼя', 'Your name')} /></label>
                  <label className="sysx-inp"><span className="sysx-inp-l">Email *</span><input type="email" value={oEmail} onChange={(e) => setOEmail(e.target.value)} placeholder="you@company.com" required /></label>
                  <label className="sysx-inp"><span className="sysx-inp-l">{t('Телефон', 'Phone')}</span><input type="tel" value={oPhone} onChange={(e) => setOPhone(e.target.value)} placeholder="+380…" /></label>
                </div>
                {oErr && <span className="s3-err mono">{oErr}</span>}
                <div className="sysx-calc-actions">
                  <button className="sysx-cta is-primary" type="submit" disabled={leadBusy}>{leadBusy ? t('Надсилаємо…', 'Sending…') : t('Надіслати заявку', 'Send the request')} →</button>
                  <button className="sysx-cta" type="button" onClick={() => setOrderOpen(false)}>{t('Скасувати', 'Cancel')}</button>
                </div>
              </form>
            ) : (
              <div className="sysx-calc-actions">
                <button className="sysx-cta is-primary" onClick={() => setOrderOpen(true)}>{t('Замовити аудит', 'Order the audit')} →</button>
                <button className="sysx-cta" onClick={downloadBrandedPdf}>{t('Завантажити PDF', 'Download PDF')} ↓</button>
                <Link className="sysx-cta" to={lp('/pricing')}>{t('Формати і ціни', 'Formats & pricing')} →</Link>
                <Link className="sysx-cta" to={lp('/cabinet')}>{t('Зберегти в кабінет', 'Save to cabinet')} →</Link>
                <button className="sysx-cta" onClick={restart}>{t('Перерахувати', 'Recalculate')}</button>
              </div>
            )}
            <span className="sysx-note mono">{t('Оцінка за наданими даними. Не фінансовий аудит. Точну карту «де саме й чому» дає глибокий аудит — окрема послуга: запросіть доступ у кабінеті, менеджер підтвердить і відкриє розбір.', 'An estimate based on your data. Not a financial audit. A precise map of “exactly where and why” comes from the deep audit — a separate service: request access in your cabinet, the manager confirms and opens the analysis.')}</span>
          </div>
        )}
      </div>
    </section>
  );
}

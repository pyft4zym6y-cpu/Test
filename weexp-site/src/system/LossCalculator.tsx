import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { computeLoss, eur, project, localizeSys, sysLabel, leakLabel, actionText, NICHES, type LossInput, type LossResult, type SysKey, type NicheKey, type Season, type Signals } from './lossModel';
import { saveExpressAudit } from './cabinetData';
import { sendLead } from '@/lib/leads';
import { shortOf } from '@/data/xray';
import { useT, useLp, useLang } from '@/i18n';
import { useLiteVisuals } from '@/lib/liteVisuals';
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

/**
 * Людяне резюме результату (замість «сирих» метрик): ключова проблема, поточний
 * рівень словами, потенціал, головний витік і що робити далі. Використовується у
 * формі заявки, щоб клієнт бачив зрозумілий підсумок, а не вивід системи.
 */
function HumanSummary({ res, lang, t }: { res: LossResult; lang: 'uk' | 'en'; t: (uk: string, en: string) => string }) {
  const hw = res.overallHealth >= 65 ? t('добрий', 'good') : res.overallHealth >= 40 ? t('середній', 'moderate') : t('слабкий', 'weak');
  const action = res.actions?.[0] ? actionText(res.actions[0].key, lang) : '';
  const leak = res.leaks?.[0];
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="calc-human-row"><span className="calc-human-k">{k}</span><span className="calc-human-v">{v}</span></div>
  );
  return (
    <div className="calc-human">
      <span className="calc-human-h">{t('Ваш результат коротко', 'Your result in brief')}</span>
      <Row k={t('Ключова проблема', 'Key problem')} v={<b>{sysLabel(res.primary, lang)}</b>} />
      <Row k={t('Поточний рівень', 'Current level')} v={<><b>{hw}</b> <i>({res.overallHealth}/100)</i></>} />
      <Row k={t('Потенціал повернення', 'Recovery potential')} v={<>{t('до', 'up to')} <b>{eur(res.total)}</b>/{t('рік', 'yr')}</>} />
      {leak && <Row k={t('Головний витік', 'Biggest leak')} v={<>{leakLabel(leak, lang)} — {eur(leak.amount)}/{t('рік', 'yr')}</>} />}
      {action && <Row k={t('Що радимо далі', 'Recommended next step')} v={action} />}
    </div>
  );
}

export function LossCalculator() {
  const t = useT();
  const lite = useLiteVisuals();
  const lp = useLp();
  const lang = useLang();
  type NumKey = 'monthlyRevenue' | 'aov' | 'conversion' | 'repeatRate' | 'returnsRate' | 'grossMargin' | 'cac';
  const FIELDS: { k: NumKey; label: string; unit: string; hint?: string }[] = [
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
  const CALC_KEY = 'weexp:calc-inp-v1';
  const [inp, setInp] = useState<LossInput>(() => {
    // Відновлюємо введені цифри, щоб оновлення сторінки не скидало прогрес.
    try { const r = localStorage.getItem(CALC_KEY); if (r) return { monthlyRevenue: 0, aov: 0, conversion: 0, repeatRate: 0, returnsRate: 0, grossMargin: 0, cac: 0, symptoms: [], ...JSON.parse(r) }; } catch { /* ignore */ }
    return { monthlyRevenue: 0, aov: 0, conversion: 0, repeatRate: 0, returnsRate: 0, grossMargin: 0, cac: 0, symptoms: [] };
  });
  useEffect(() => { try { localStorage.setItem(CALC_KEY, JSON.stringify(inp)); } catch { /* ignore */ } }, [inp]);
  const [res, setRes] = useState<LossResult | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);
  const [orderStep, setOrderStep] = useState<null | 'form' | 'review' | 'sent'>(null);
  const [oName, setOName] = useState('');
  const [oEmail, setOEmail] = useState('');
  const [oPhone, setOPhone] = useState('');
  const [oMsg, setOMsg] = useState('');
  const [oHp, setOHp] = useState(''); // honeypot — у людей завжди порожнє
  const [oErr, setOErr] = useState('');
  // Заявка йде саме за результатом експрес-аудиту — тип фіксований, без «вибору послуги».
  const REQUEST_LABEL = t('Заявка за експрес-аудитом', 'Request from express audit');
  const alerts = useRef<number[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  // Зміна кроку — підводимо панель до верху вьюпорта (щоб екран не «стрибав» посередині форми)
  useEffect(() => {
    const el = panelRef.current; if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, [step]);

  const setNum = (k: NumKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInp((s) => ({ ...s, [k]: parseFloat(e.target.value) || 0 }));
  const toggle = (k: SysKey) => setInp((s) => ({ ...s, symptoms: s.symptoms.includes(k) ? s.symptoms.filter((x) => x !== k) : [...s.symptoms, k] }));
  // Швидкі так/ні: повторний клік по тій самій відповіді знімає її (undefined).
  const setSig = (k: keyof Signals, v: boolean) =>
    setInp((s) => ({ ...s, signals: { ...s.signals, [k]: s.signals?.[k] === v ? undefined : v } }));
  const SIGNALS: { k: keyof Signals; q: string }[] = [
    { k: 'mgmtCycle', q: t('Чи є регулярний управлінський цикл: цілі → план → факт → рішення?', 'Do you run a regular management cycle: goals → plan → actuals → decisions?') },
    { k: 'analytics', q: t('Чи є наскрізна аналітика — одна правда в цифрах для всіх рішень?', 'Do you have end-to-end analytics — one source of truth for decisions?') },
    { k: 'ownerFree', q: t('Чи пропрацює бізнес 2+ тижні без власника, не втрачаючи темп?', 'Would the business run 2+ weeks without the owner at full pace?') },
    { k: 'exportSales', q: t('Чи продаєте вже за межі України?', 'Do you already sell outside your home market?') },
  ];
  const compute = () => { const r = computeLoss(inp); setRes(r); alerts.current = r.bottleneckNodes; saveExpressAudit(inp, r); setStep(3); };
  const restart = () => { alerts.current = []; setRes(null); setOrderStep(null); setStep(1); };
  const primaryLabel = (k: SysKey) => sysLabel(k, lang);

  // Замовлення аудиту — повноцінний сценарій: форма → перевірка даних → надсилання.
  const openOrder = () => { setOErr(''); setOrderStep('form'); };
  const toReview = (e: React.FormEvent) => {
    e.preventDefault();
    const email = oEmail.trim();
    if (!email || !/.+@.+\..+/.test(email)) { setOErr(t('Вкажіть коректний email — щоб ми надіслали план аудиту.', 'Enter a valid email — so we can send you the audit plan.')); return; }
    setOErr(''); setOrderStep('review');
  };
  const submitOrder = async () => {
    if (!res) return;
    setLeadBusy(true);
    await sendLead({
      source: 'calc-order-audit', role: 'calc', name: oName.trim() || undefined, email: oEmail.trim(), phone: oPhone.trim() || undefined,
      company_website: oHp,
      task: REQUEST_LABEL,
      comment: `${oMsg.trim() ? oMsg.trim() + ' · ' : ''}${t('Витік', 'Leak')}: ${eur(res.total)}/${t('рік', 'yr')} · bottleneck: ${sysLabel(res.primary, lang)} · Health ${res.overallHealth}/100`,
      calc: `total=${res.total};range=${res.range[0]}-${res.range[1]};bottleneck=${res.primary};health=${res.overallHealth}`,
    });
    setLeadBusy(false); setOrderStep('sent');
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
      <div className={'sysx-calc-bg' + (lite ? ' is-lite' : '')} aria-hidden="true">{!lite && <Suspense fallback={null}><CommerceSystem3D fixedProgress={0.72} alerts={alerts} /></Suspense>}</div>

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
              <label className="sysx-inp">
                <span className="sysx-inp-l">{t('Ніша', 'Niche')}<i> · {t('обирає еталони порівняння', 'picks the benchmarks')}</i></span>
                <span className="sysx-inp-row">
                  <select value={inp.niche || ''} onChange={(e) => setInp((s) => ({ ...s, niche: (e.target.value || undefined) as NicheKey | undefined }))}>
                    <option value="">{t('— оберіть нішу —', '— select a niche —')}</option>
                    {NICHES.map((n) => <option key={n.key} value={n.key}>{t(n.uk, n.en)}</option>)}
                  </select>
                </span>
              </label>
              <label className="sysx-inp">
                <span className="sysx-inp-l">{t('Цей місяць за виторгом', 'This month vs typical')}<i> · {t('корекція сезонності', 'seasonality correction')}</i></span>
                <span className="sysx-inp-row">
                  <select value={inp.seasonal || 'typical'} onChange={(e) => setInp((s) => ({ ...s, seasonal: e.target.value as Season }))}>
                    <option value="typical">{t('Типовий', 'Typical')}</option>
                    <option value="high">{t('Вище типового (сезон/пік)', 'Above typical (peak season)')}</option>
                    <option value="low">{t('Нижче типового', 'Below typical')}</option>
                  </select>
                </span>
              </label>
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
            <div className="sysx-sig">
              <p className="sysx-sig-h mono">{t('І чотири швидкі «так / ні» — вони оживляють оцінку систем управління:', 'And four quick “yes / no” — they bring the management systems to life:')}</p>
              {SIGNALS.map((sg) => {
                const v = inp.signals?.[sg.k];
                return (
                  <div key={sg.k} className="sysx-sig-row">
                    <span className="sysx-sig-q">{sg.q}</span>
                    <span className="sysx-sig-btns">
                      <button className={'sysx-sig-b' + (v === true ? ' on-yes' : '')} onClick={() => setSig(sg.k, true)}>{t('Так', 'Yes')}</button>
                      <button className={'sysx-sig-b' + (v === false ? ' on-no' : '')} onClick={() => setSig(sg.k, false)}>{t('Ні', 'No')}</button>
                    </span>
                  </div>
                );
              })}
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
              {res.confidence !== 'high' && (
                <span className="sysx-total-conf mono">{res.confidence === 'medium'
                  ? t('⚠ середня впевненість: заповнено не всі показники — вилка розширена. Додайте цифри, щоб уточнити.', '⚠ medium confidence: not all metrics filled — the range is widened. Add numbers to refine.')
                  : t('⚠ низька впевненість: замало даних — це лише орієнтир. Заповніть більше показників.', '⚠ low confidence: too little data — treat as a rough guide. Fill in more metrics.')}</span>
              )}
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

            {orderStep === 'sent' ? (
              <div className="calc-order calc-ordered">
                <span className="sysx-kick">{t('✓ Заявку надіслано', '✓ Request sent')}</span>
                <b className="sysx-display calc-ordered-h">{oName ? `${t('Дякуємо, ', 'Thank you, ')}${oName}!` : t('Дякуємо!', 'Thank you!')}</b>
                <p className="calc-ordered-p">{t('Ми отримали вашу заявку разом із результатом експрес-аудиту ', 'We received your request together with your express-audit result ')}<b>{eur(res.total)}/{t('рік', 'yr')}</b>{t(' і ключовою проблемою «', ' and the key problem «')}{primaryLabel(res.primary)}».</p>
                <div className="calc-ordered-next">
                  <span className="mono">{t('Що далі', "What's next")}:</span>
                  <ol>
                    <li>{t('Менеджер WEEXP звʼяжеться з вами на ', 'A WEEXP manager will contact you at ')}<b>{oEmail}</b>{oPhone ? ` / ${oPhone}` : ''} {t('протягом робочого дня.', 'within one business day.')}</li>
                    <li>{t('Короткий дзвінок (15–20 хв): звіримо контекст і цілі.', 'A short call (15–20 min): we align on context and goals.')}</li>
                    <li>{t('Надішлемо план і формат аудиту під ваш випадок.', 'We send an audit plan and format tailored to your case.')}</li>
                  </ol>
                </div>
                <div className="calc-order-cabhint mono">{t('Порада: збережіть цей аудит у кабінет — після реєстрації він закріпиться за акаунтом, і ви одразу зможете запросити доступ до глибокого аудиту.', 'Tip: save this audit to your cabinet — after signup it links to your account and you can request deep-audit access right away.')}</div>
                <div className="sysx-calc-actions">
                  <Link className="sysx-cta is-primary" to={lp('/cabinet?from=express')}>{t('Зберегти в кабінет', 'Save to cabinet')} →</Link>
                  <button className="sysx-cta" onClick={downloadBrandedPdf}>{t('Завантажити PDF', 'Download PDF')} ↓</button>
                </div>
              </div>
            ) : orderStep === 'review' ? (
              <div className="calc-order">
                <div className="calc-order-steps mono"><span>1 · {t('Дані', 'Details')}</span><span className="on">2 · {t('Перевірка', 'Review')}</span><span>3 · {t('Готово', 'Done')}</span></div>
                <span className="sysx-kick">{t('Перевірте заявку', 'Check your request')}</span>
                <p className="calc-order-lead">{t('Переконайтесь, що все правильно. Після надсилання менеджер звʼяжеться з вами протягом робочого дня.', 'Make sure everything is correct. After you send it, a manager will contact you within one business day.')}</p>
                <dl className="calc-order-summary">
                  <div><dt>{t('Заявка', 'Request')}</dt><dd>{REQUEST_LABEL}</dd></div>
                  <div><dt>{t("Ім'я", 'Name')}</dt><dd>{oName || <i className="mono">{t('не вказано', 'not provided')}</i>}</dd></div>
                  <div><dt>Email</dt><dd>{oEmail}</dd></div>
                  <div><dt>{t('Телефон', 'Phone')}</dt><dd>{oPhone || <i className="mono">{t('не вказано', 'not provided')}</i>}</dd></div>
                  {oMsg.trim() && <div><dt>{t('Коментар', 'Note')}</dt><dd>{oMsg}</dd></div>}
                </dl>
                <HumanSummary res={res} lang={lang} t={t} />
                <div className="sysx-calc-actions">
                  <button className="sysx-cta is-primary" onClick={submitOrder} disabled={leadBusy}>{leadBusy ? t('Надсилаємо…', 'Sending…') : t('Підтвердити і надіслати', 'Confirm & send')} →</button>
                  <button className="sysx-cta" onClick={() => setOrderStep('form')}>← {t('Змінити дані', 'Edit details')}</button>
                </div>
              </div>
            ) : orderStep === 'form' ? (
              <form className="calc-order" onSubmit={toReview}>
                <div className="calc-order-steps mono"><span className="on">1 · {t('Дані', 'Details')}</span><span>2 · {t('Перевірка', 'Review')}</span><span>3 · {t('Готово', 'Done')}</span></div>
                <span className="sysx-kick">{t('Замовити аудит', 'Order the audit')}</span>
                <p className="calc-order-lead">{t('Лишіть контакт — далі ви перевірите дані, а після відправлення менеджер WEEXP звʼяжеться протягом робочого дня. Результат вашого експрес-аудиту додається до заявки автоматично.', 'Leave your contact — next you review the details, and after sending, a WEEXP manager will reach out within one business day. Your express-audit result is attached automatically.')}</p>
                <div className="calc-order-row">
                  <label className="sysx-inp"><span className="sysx-inp-l">{t("Ім'я", 'Name')}</span><input value={oName} onChange={(e) => setOName(e.target.value)} placeholder={t('Ваше імʼя', 'Your name')} /></label>
                  <label className="sysx-inp"><span className="sysx-inp-l">Email *</span><input type="email" value={oEmail} onChange={(e) => setOEmail(e.target.value)} placeholder="you@company.com" required /></label>
                  <label className="sysx-inp"><span className="sysx-inp-l">{t('Телефон', 'Phone')}</span><input type="tel" value={oPhone} onChange={(e) => setOPhone(e.target.value)} placeholder="+380…" /></label>
                </div>
                <label className="sysx-inp"><span className="sysx-inp-l">{t('Коментар (необовʼязково)', 'Note (optional)')}</span><input value={oMsg} onChange={(e) => setOMsg(e.target.value)} placeholder={t('Що для вас важливо?', 'What matters most to you?')} /></label>
                <input name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={oHp} onChange={(e) => setOHp(e.target.value)} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
                <HumanSummary res={res} lang={lang} t={t} />
                {oErr && <span className="s3-err mono">{oErr}</span>}
                <div className="sysx-calc-actions">
                  <button className="sysx-cta is-primary" type="submit">{t('Перевірити заявку', 'Review request')} →</button>
                  <button className="sysx-cta" type="button" onClick={() => setOrderStep(null)}>{t('Скасувати', 'Cancel')}</button>
                </div>
              </form>
            ) : (
              <div className="sysx-calc-actions">
                <button className="sysx-cta is-primary" onClick={openOrder}>{t('Замовити аудит', 'Order the audit')} →</button>
                <button className="sysx-cta" onClick={downloadBrandedPdf}>{t('Завантажити PDF', 'Download PDF')} ↓</button>
                <a className="sysx-cta" href={lp('/pricing')} target="_blank" rel="noopener noreferrer">{t('Формати і ціни', 'Formats & pricing')} ↗</a>
                <Link className="sysx-cta" to={lp('/cabinet?from=express')}>{t('Зберегти в кабінет', 'Save to cabinet')} →</Link>
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

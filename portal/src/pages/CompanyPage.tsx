import { Link, useNavigate } from 'react-router-dom';
import { CHANNEL_GROUPS, PASSPORT_QID, type Passport } from '../data/pains';
import { useAnswers } from '../lib/useAnswers';

const NICHES = [
  'Fashion · одежда и обувь', 'Beauty · косметика', 'Дом · мебель · декор',
  'Электроника · техника', 'FMCG · товары ежедневного спроса', 'Детские товары',
  'Хобби · коллекционное', 'Продукты питания', 'Зоотовары', 'Авто · инструменты',
  'B2B · промышленное', 'Другая',
];
const REVENUES = ['до 500 тыс ₴/мес', '0,5–1 млн ₴/мес', '1–5 млн ₴/мес', '5–20 млн ₴/мес', '20+ млн ₴/мес'];

export default function CompanyPage() {
  const { rows, loaded, save } = useAnswers();
  const nav = useNavigate();
  let p: Passport = {};
  try {
    p = JSON.parse(rows[PASSPORT_QID]?.answer ?? '{}');
  } catch {
    p = {};
  }
  const set = (patch: Partial<Passport>) =>
    save(PASSPORT_QID, { answer: JSON.stringify({ ...p, ...patch }) });

  const sites = p.sites ?? (p.site ? [p.site] : ['']);
  const setSite = (i: number, v: string) => {
    const next = [...sites];
    next[i] = v;
    set({ sites: next });
  };

  const toggleChannel = (c: string) => {
    const cur = p.channels ?? [];
    set({ channels: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] });
  };

  if (!loaded) return <div className="container" style={{ paddingTop: 50 }}><p className="sub">Загрузка…</p></div>;

  const ready = Boolean(p.name && p.offer && (p.niche && (p.niche !== 'Другая' || p.nicheOther)));

  return (
    <div className="container" style={{ padding: '30px 20px 80px', maxWidth: 760 }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← На главную</Link>
      <p className="eyebrow" style={{ marginTop: 14 }}>Шаг 1 · Вводные о компании</p>
      <h1>Кто вы и что продаёте</h1>
      <p className="sub">5–7 минут — эти вводные настраивают всю дальнейшую диагностику под вас.</p>

      <div className="card" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <p className="qtext">Название компании / бренда *</p>
          <input type="text" value={p.name ?? ''} onChange={(e) => set({ name: e.target.value })} placeholder="Например: FragStore" />
        </div>

        <div>
          <p className="qtext">Сайты</p>
          <p className="sub" style={{ fontSize: 12.5, marginBottom: 8 }}>
            Все ваши витрины: основной магазин, лендинги, отдельные бренды — сколько есть.
          </p>
          {sites.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="text" value={s} onChange={(e) => setSite(i, e.target.value)} placeholder="https://…" />
              {sites.length > 1 && (
                <button className="chip" onClick={() => set({ sites: sites.filter((_, x) => x !== i) })}>✕</button>
              )}
            </div>
          ))}
          <button className="chip" onClick={() => set({ sites: [...sites, ''] })}>+ Ещё сайт</button>
        </div>

        <div>
          <p className="qtext">Что продаёте и кому *</p>
          <textarea value={p.offer ?? ''} onChange={(e) => set({ offer: e.target.value })} placeholder="Коротко: товар/категории, своя марка или ритейл, кто покупатель…" />
        </div>

        <div>
          <p className="qtext">Ниша *</p>
          <div className="chips">
            {NICHES.map((n) => (
              <span key={n} className={`chip ${p.niche === n ? 'on' : ''}`} onClick={() => set({ niche: n })}>{n}</span>
            ))}
          </div>
          {p.niche === 'Другая' && (
            <input type="text" style={{ marginTop: 10 }} value={p.nicheOther ?? ''}
              onChange={(e) => set({ nicheOther: e.target.value })} placeholder="Впишите свою нишу *" />
          )}
        </div>

        <div>
          <p className="qtext">Каналы продаж сейчас</p>
          <p className="sub" style={{ fontSize: 12.5, marginBottom: 6 }}>
            Отметьте всё, где реально идут продажи — включая Европу и США.
          </p>
          {CHANNEL_GROUPS.map((g) => (
            <div key={g.title} style={{ marginTop: 10 }}>
              <p className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--muted)', margin: '0 0 6px' }}>
                {g.title}
              </p>
              <div className="chips">
                {g.items.map((c) => (
                  <span key={c} className={`chip ${p.channels?.includes(c) ? 'on' : ''}`} onClick={() => toggleChannel(c)}>{c}</span>
                ))}
              </div>
            </div>
          ))}
          <input type="text" style={{ marginTop: 12 }} value={p.channelsOther ?? ''}
            onChange={(e) => set({ channelsOther: e.target.value })}
            placeholder="Другие каналы — впишите: например, Wildberries, свой B2B-портал…" />
        </div>

        <div>
          <p className="qtext">География продаж</p>
          <input type="text" value={p.geo ?? ''} onChange={(e) => set({ geo: e.target.value })} placeholder="Украина / Украина + Польша, Германия / США…" />
        </div>

        <div>
          <p className="qtext">Оборот e-commerce</p>
          <div className="chips">
            {REVENUES.map((r) => (
              <span key={r} className={`chip ${p.revenue === r ? 'on' : ''}`} onClick={() => set({ revenue: r })}>{r}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="qtext">Команда e-commerce</p>
          <input type="text" value={p.team ?? ''} onChange={(e) => set({ team: e.target.value })} placeholder="Например: 2 человека + подрядчик по рекламе" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 22, alignItems: 'center' }}>
        <button className="btn" disabled={!ready} onClick={() => nav('/goals')}>
          Далее: цели →
        </button>
        {!ready && <span className="sub" style={{ fontSize: 12.5 }}>Заполните поля со звёздочкой</span>}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { LINKS_QID, type Links, type LinkItem } from '../data/pains';
import { useAnswers } from '../lib/useAnswers';

const EMPTY: Links = { direct: [], indirect: [], refs: [] };

const SECTIONS: { key: keyof Links; title: string; hint: string; ph: string }[] = [
  {
    key: 'direct',
    title: 'Прямые конкуренты',
    hint: 'Продают то же самое той же аудитории. 3–5 ссылок — у кого вы реально отбираете покупателя.',
    ph: 'https://competitor.com',
  },
  {
    key: 'indirect',
    title: 'Дополнительные / косвенные',
    hint: 'Маркетплейсы, соцсети-продавцы, зарубежные игроки — кто ещё борется за ваш чек.',
    ph: 'https://…',
  },
  {
    key: 'refs',
    title: 'Референсы',
    hint: 'Сайты и бренды, которые вам нравятся (даже из других ниш): «хотим выглядеть/работать как…».',
    ph: 'https://…',
  },
];

export default function LinksPage() {
  const { rows, loaded, save } = useAnswers();
  let links: Links = EMPTY;
  try {
    links = { ...EMPTY, ...JSON.parse(rows[LINKS_QID]?.answer ?? '{}') };
  } catch {
    links = EMPTY;
  }
  const set = (next: Links) => save(LINKS_QID, { answer: JSON.stringify(next) });

  const update = (key: keyof Links, i: number, patch: Partial<LinkItem>) => {
    const list = [...links[key]];
    list[i] = { ...list[i], ...patch };
    set({ ...links, [key]: list });
  };
  const add = (key: keyof Links) => set({ ...links, [key]: [...links[key], { url: '', note: '' }] });
  const remove = (key: keyof Links, i: number) =>
    set({ ...links, [key]: links[key].filter((_, x) => x !== i) });

  if (!loaded) return <div className="container" style={{ paddingTop: 50 }}><p className="sub">Загрузка…</p></div>;

  return (
    <div className="container" style={{ padding: '30px 20px 80px', maxWidth: 760 }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← На главную</Link>
      <p className="eyebrow" style={{ marginTop: 14 }}>Шаг 5 · Конкуренты и референсы</p>
      <h1>С кем сравнивать и на что равняться</h1>
      <p className="sub" style={{ maxWidth: 620 }}>
        По этим ссылкам мы прогоняем конкурентный бенчмарк: видимость, структура, цены, UX — и
        показываем, где у каждого есть зона, которую он не закрывает.
      </p>

      {SECTIONS.map((s) => (
        <div key={s.key} className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16 }}>{s.title} <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>· {links[s.key].length}</span></h2>
          <p className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>{s.hint}</p>
          {links[s.key].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <input type="text" style={{ flex: '2 1 220px' }} placeholder={s.ph} value={item.url}
                onChange={(e) => update(s.key, i, { url: e.target.value })} />
              <input type="text" style={{ flex: '3 1 220px' }} placeholder="Комментарий: чем силён / что нравится"
                value={item.note} onChange={(e) => update(s.key, i, { note: e.target.value })} />
              <button className="chip" onClick={() => remove(s.key, i)}>✕</button>
            </div>
          ))}
          <button className="chip" onClick={() => add(s.key)}>+ Добавить ссылку</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        <Link to="/access" className="btn">Далее: файлы и доступы →</Link>
      </div>
    </div>
  );
}

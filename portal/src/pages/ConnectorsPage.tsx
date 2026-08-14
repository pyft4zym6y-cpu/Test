import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { CONNECTOR_GROUPS, connectorById, TYPE_LABEL, type ConnType } from '../data/connectors';

type Status = 'selected' | 'requested' | 'connected';
const STATUS_ORDER: Status[] = ['selected', 'requested', 'connected'];
const STATUS_LABEL: Record<Status, string> = { selected: 'Выбран', requested: 'Запрошен доступ', connected: 'Подключён' };
const STATUS_COLOR: Record<Status, string> = { selected: '#5a6472', requested: '#b45309', connected: '#4d7c0f' };
const TYPE_TAG: Record<ConnType, string> = { api: 'API', file: 'Файл', external: 'Внешний' };

/**
 * Клиент выбирает нужные коннекторы из выпадающего списка перед подключением и
 * ведёт их статус (Выбран → Запрошен доступ → Подключён). Выбор сохраняется
 * локально; серверная привязка и сам OAuth — следующим слоем.
 */
export default function ConnectorsPage() {
  const { member } = useApp();
  const key = `weexp-connectors-${member.client_id ?? 'demo'}`;
  const [picked, setPicked] = useState<Record<string, Status>>({});
  const [toAdd, setToAdd] = useState('');

  useEffect(() => {
    try { setPicked(JSON.parse(localStorage.getItem(key) ?? '{}')); } catch { setPicked({}); }
  }, [key]);

  const save = (next: Record<string, Status>) => {
    setPicked(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* noop */ }
  };

  const add = () => {
    if (!toAdd || picked[toAdd]) { setToAdd(''); return; }
    save({ ...picked, [toAdd]: 'selected' });
    setToAdd('');
  };
  const cycle = (id: string) => {
    const cur = picked[id];
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length];
    save({ ...picked, [id]: next });
  };
  const remove = (id: string) => {
    const next = { ...picked }; delete next[id]; save(next);
  };

  const chosen = useMemo(() => Object.keys(picked).map((id) => ({ id, status: picked[id], c: connectorById.get(id) })).filter((x) => x.c), [picked]);
  const counts = useMemo(() => {
    const c = { selected: 0, requested: 0, connected: 0 } as Record<Status, number>;
    for (const s of Object.values(picked)) c[s] += 1;
    return c;
  }, [picked]);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80, maxWidth: 860 }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← На главную</Link>
      <p className="eyebrow" style={{ marginTop: 18 }}>weexp · Discovery · Коннекторы</p>
      <h1 style={{ fontSize: 26 }}>Подключение систем</h1>
      <p className="sub" style={{ marginBottom: 18 }}>
        Выберите из списка системы, которые у вас есть — мы подключимся к ним для аудита. Чем больше подключено,
        тем точнее расчёт (Health Score, деньги, юнит-экономика). Ничего не заполняете вручную — данные тянутся из систем.
      </p>

      <div className="card" style={{ marginBottom: 18 }}>
        <label className="qid" htmlFor="conn-select">Добавить коннектор</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <select id="conn-select" value={toAdd} onChange={(e) => setToAdd(e.target.value)} style={{ flex: 1, minWidth: 240 }}>
            <option value="">— выберите систему из списка —</option>
            {CONNECTOR_GROUPS.map((g) => (
              <optgroup key={g.key} label={g.title}>
                {g.connectors.map((c) => (
                  <option key={c.id} value={c.id} disabled={Boolean(picked[c.id])}>
                    {c.name} · {TYPE_TAG[c.type]}{picked[c.id] ? ' (добавлен)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button className="btn" onClick={add} disabled={!toAdd} style={{ padding: '10px 18px' }}>Добавить</button>
        </div>
      </div>

      {chosen.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {STATUS_ORDER.map((s) => (
            <span key={s} className="tag" style={{ color: STATUS_COLOR[s] }}>{STATUS_LABEL[s]}: {counts[s]}</span>
          ))}
        </div>
      )}

      {chosen.length === 0 ? (
        <p className="sub">Пока ничего не выбрано. Добавьте системы из списка выше — начните с аналитики (GA4), рекламных кабинетов и CRM.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chosen.map(({ id, status, c }) => (
            <div key={id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{c!.name}</div>
                <div className="qwhy" style={{ margin: 0 }}>{TYPE_LABEL[c!.type]}{c!.auth ? ` · ${c!.auth}` : ''}{c!.ac ? ` · ${c!.ac}` : ''}</div>
              </div>
              <button className="chip" onClick={() => cycle(id)} style={{ color: STATUS_COLOR[status], borderColor: STATUS_COLOR[status] }}>
                {STATUS_LABEL[status]} →
              </button>
              <button className="chip" onClick={() => remove(id)} aria-label="Убрать" style={{ padding: '6px 10px' }}>×</button>
            </div>
          ))}
        </div>
      )}

      <p className="sub" style={{ marginTop: 20, fontSize: 12.5 }}>
        Статус меняется по клику: <b>Выбран</b> → <b>Запрошен доступ</b> → <b>Подключён</b>.
        Внешние сервисы (Wappalyzer, Ad Library и т.п.) мы используем сами — доступ от вас не нужен.
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';

/**
 * Запуск аудита кнопкой (для админа) — без терминала. Обращается к аудит-серверу
 * (worker/src/server.ts), развёрнутому отдельно. Адрес сервера и токен вводятся
 * один раз и хранятся локально. Результат — ссылки на готовые .pptx/.docx.
 */
type FileLink = { name: string; url: string };

export default function AuditRunnerPage() {
  const { member } = useApp();
  const [server, setServer] = useState('');
  const [token, setToken] = useState('');
  const [site, setSite] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [tier, setTier] = useState(1);
  const [agentic, setAgentic] = useState(true);
  const [prelaunch, setPrelaunch] = useState(false);
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [files, setFiles] = useState<FileLink[]>([]);
  const [health, setHealth] = useState<string>('');

  useEffect(() => {
    setServer(localStorage.getItem('weexp-audit-server') ?? '');
    setToken(localStorage.getItem('weexp-audit-token') ?? '');
  }, []);
  const saveCfg = (s: string, t: string) => {
    setServer(s); setToken(t);
    localStorage.setItem('weexp-audit-server', s); localStorage.setItem('weexp-audit-token', t);
  };

  const base = server.replace(/\/$/, '');

  async function checkHealth() {
    setHealth('проверяю…');
    try {
      const r = await fetch(`${base}/health`);
      const j = await r.json();
      setHealth(j.ok ? `сервер на связи · ключ Claude: ${j.hasKey ? 'есть ✓' : 'НЕ задан ✗'}` : 'сервер ответил ошибкой');
    } catch (e) {
      setHealth(`не достучался: ${String(e).slice(0, 80)}`);
    }
  }

  async function run() {
    if (!base) { setStatus('Укажите адрес аудит-сервера'); return; }
    if (!site && !prelaunch) { setStatus('Укажите URL сайта клиента (или включите «сайт в разработке»)'); return; }
    setBusy(true); setFiles([]); setStatus('Запускаю аудит… это несколько минут (обход + анализ). Не закрывайте страницу.');
    try {
      const r = await fetch(`${base}/audit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-audit-token': token },
        body: JSON.stringify({
          tier, site, competitors: competitors.split(/\n+/).map((s) => s.trim()).filter(Boolean),
          request: brief || '', agentic, prelaunch, brief,
        }),
      });
      const j = await r.json();
      if (!j.ok) { setStatus(`Ошибка: ${j.error ?? r.status}`); return; }
      setStatus(`Готово: ${j.summary}`);
      setFiles((j.files as FileLink[]).filter((f) => /\.(pptx|docx|md|json)$/.test(f.name)));
    } catch (e) {
      setStatus(`Не удалось: ${String(e).slice(0, 140)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!member.is_admin) return <div className="container" style={{ paddingTop: 50 }}><p className="sub">Раздел только для консультанта.</p></div>;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80, maxWidth: 780 }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← На главную</Link>
      <p className="eyebrow" style={{ marginTop: 18 }}>weexp · Аудитор · Запуск</p>
      <h1 style={{ fontSize: 26 }}>Запустить аудит</h1>
      <p className="sub" style={{ marginBottom: 18 }}>Введите сайт клиента и нажмите «Запустить». Обход, анализ по методологии и сборка AD-15/отчёта — на сервере. Через несколько минут получите готовые файлы.</p>

      <details className="card" style={{ marginBottom: 16 }}>
        <summary className="qid" style={{ cursor: 'pointer' }}>Настройка сервера (один раз)</summary>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="qwhy" style={{ margin: 0 }}>Адрес аудит-сервера (даёт разработчик после разворачивания)</label>
          <input value={server} onChange={(e) => saveCfg(e.target.value, token)} placeholder="https://audit.вашсервер.com" />
          <label className="qwhy" style={{ margin: 0 }}>Токен доступа (AUDIT_SERVER_TOKEN)</label>
          <input value={token} onChange={(e) => saveCfg(server, e.target.value)} placeholder="секретный токен" />
          <div>
            <button className="chip" onClick={checkHealth} style={{ fontSize: 12 }}>Проверить связь</button>
            {health && <span className="sub" style={{ marginLeft: 10, fontSize: 12.5 }}>{health}</span>}
          </div>
        </div>
      </details>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <div className="qid">Сайт клиента</div>
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://ray.ua/" disabled={prelaunch} style={{ marginTop: 6 }} />
        </label>
        <label>
          <div className="qid">Конкуренты (по одному в строке, необязательно)</div>
          <textarea value={competitors} onChange={(e) => setCompetitors(e.target.value)} rows={3} placeholder={'https://competitor1.ua\nhttps://competitor2.ua'} style={{ marginTop: 6 }} />
        </label>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="qid">Тир</span>
            <select value={tier} onChange={(e) => setTier(Number(e.target.value))} disabled={prelaunch}>
              <option value={1}>T1 · только сайт</option>
              <option value={2}>T2 · + конкуренты</option>
              <option value={3}>T3 · + данные</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }} className="qid">
            <input type="checkbox" checked={agentic} onChange={(e) => setAgentic(e.target.checked)} /> Агентный обход (умнее, дольше)
          </label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }} className="qid">
            <input type="checkbox" checked={prelaunch} onChange={(e) => setPrelaunch(e.target.checked)} /> Сайт в разработке / его нет
          </label>
        </div>
        {prelaunch && (
          <label>
            <div className="qid">Бриф проекта (для предзапуска)</div>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} placeholder="Что за магазин, ниша, рынок, средний чек…" style={{ marginTop: 6 }} />
          </label>
        )}
        <button className="btn" onClick={run} disabled={busy} style={{ alignSelf: 'flex-start', padding: '11px 22px' }}>
          {busy ? 'Идёт аудит…' : 'Запустить аудит'}
        </button>
      </div>

      {status && <p className="sub" style={{ marginTop: 16 }}>{status}</p>}

      {files.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="qid" style={{ marginBottom: 8 }}>Готовые файлы</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map((f) => (
              <a key={f.name} href={`${base}${f.url}${f.url.includes('?') ? '&' : '?'}t=${encodeURIComponent(token)}`} className="chip" style={{ textDecoration: 'none' }}>
                ⤓ {f.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

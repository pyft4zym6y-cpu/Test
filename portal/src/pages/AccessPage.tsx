import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ACCESSES, ACCESS_GUIDES, STATUSES } from '../lib/model';
import { supabase, DEMO, type AccessRow } from '../lib/supabase';
import { useApp } from '../App';

const LS_ACC = 'weexp-demo-access';
const LS_FILES = 'weexp-demo-files';
const lsGet = (k: string, def: any) => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? '') ?? def;
  } catch {
    return def;
  }
};

type FileRow = {
  id: string;
  access_id: string | null;
  name: string;
  path: string;
  size: number | null;
};

const fmtSize = (n: number | null) =>
  !n ? '' : n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} МБ` : `${Math.round(n / 1000)} КБ`;

export default function AccessPage() {
  const { session, member } = useApp();
  const clientId = member.client_id!;
  const [rows, setRows] = useState<Record<string, AccessRow>>({});
  const [loaded, setLoaded] = useState(false);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadFiles = () => {
    if (DEMO) {
      setFiles(lsGet(LS_FILES, []));
      return Promise.resolve();
    }
    return supabase
      .from('files')
      .select('id,access_id,name,path,size')
      .eq('client_id', clientId)
      .order('created_at')
      .then(({ data }) => setFiles((data ?? []) as FileRow[]));
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const upload = async (accessId: string, list: FileList | null) => {
    if (!list?.length) return;
    setUploading(accessId);
    if (DEMO) {
      const cur: FileRow[] = lsGet(LS_FILES, []);
      for (const f of Array.from(list)) {
        cur.push({ id: String(Date.now() + Math.random()), access_id: accessId, name: f.name, path: 'demo', size: f.size });
      }
      localStorage.setItem(LS_FILES, JSON.stringify(cur));
      setFiles(cur);
      setUploading(null);
      if ((rows[accessId]?.status ?? 'Не выдан') === 'Не выдан') save(accessId, { status: 'Выдан' });
      return;
    }
    for (const f of Array.from(list)) {
      const safe = f.name.replace(/[^\w.\-а-яА-ЯіїєґІЇЄҐ ]+/g, '_');
      const path = `${clientId}/${accessId}/${Date.now()}_${safe}`;
      const { error } = await supabase.storage.from('uploads').upload(path, f);
      if (!error) {
        await supabase.from('files').insert({
          client_id: clientId,
          access_id: accessId,
          name: f.name,
          path,
          size: f.size,
          uploaded_by: session?.user.email ?? null,
        });
      }
    }
    await loadFiles();
    setUploading(null);
    if ((rows[accessId]?.status ?? 'Не выдан') === 'Не выдан') save(accessId, { status: 'Выдан' });
  };

  const removeFile = async (f: FileRow) => {
    if (DEMO) {
      const cur: FileRow[] = lsGet(LS_FILES, []).filter((x: FileRow) => x.id !== f.id);
      localStorage.setItem(LS_FILES, JSON.stringify(cur));
      setFiles(cur);
      return;
    }
    await supabase.storage.from('uploads').remove([f.path]);
    await supabase.from('files').delete().eq('id', f.id);
    await loadFiles();
  };

  useEffect(() => {
    if (DEMO) {
      setRows(lsGet(LS_ACC, {}));
      setLoaded(true);
      return;
    }
    supabase
      .from('access_status')
      .select('*')
      .eq('client_id', clientId)
      .then(({ data }) => {
        const map: Record<string, AccessRow> = {};
        (data ?? []).forEach((r) => (map[r.access_id] = r as AccessRow));
        setRows(map);
        setLoaded(true);
      });
  }, [clientId]);

  const save = (accessId: string, patch: Partial<AccessRow>) => {
    setRows((prev) => {
      const cur = prev[accessId] ?? {
        client_id: clientId,
        access_id: accessId,
        status: 'Не выдан',
        comment: null,
        updated_by: session?.user.email ?? null,
      };
      const next = { ...cur, ...patch, updated_by: session?.user.email ?? 'demo' };
      const all = { ...prev, [accessId]: next };
      clearTimeout(timers.current[accessId]);
      timers.current[accessId] = setTimeout(() => {
        if (DEMO) localStorage.setItem(LS_ACC, JSON.stringify(all));
        else supabase.from('access_status').upsert(next, { onConflict: 'client_id,access_id' });
      }, 500);
      return all;
    });
  };

  const done = Object.values(rows).filter((r) => r.status === 'Выдан').length;

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        ← На главную
      </Link>
      <h1 style={{ marginTop: 10 }}>Передача доступов</h1>
      <p className="sub" style={{ maxWidth: 640 }}>
        Два доступа разблокируют расчёт денег: <b>AC-01 Google Analytics 4</b> и{' '}
        <b>AC-13 выгрузка заказов</b> — начните с них. Отметьте статус по каждой позиции; у каждой
        есть короткая инструкция «как выдать».
      </p>
      <div className="note" style={{ margin: '14px 0 22px' }}>
        🔒 Мы никогда не просим пароли через формы. Всё выдаётся приглашением на e-mail с правами
        «просмотр» или файлом в защищённую папку. Если без пароля никак — используйте одноразовую
        ссылку (Bitwarden Send / 1Password), а сюда напишите только «отправлено ссылкой».
      </div>
      <p className="mono" style={{ fontWeight: 700, marginBottom: 14 }}>
        Выдано: {done}/{ACCESSES.length}
      </p>

      {!loaded ? (
        <p className="sub">Загрузка…</p>
      ) : (
        ACCESSES.map((a) => {
          const r = rows[a.id];
          const status = r?.status ?? 'Не выдан';
          return (
            <div key={a.id} className="qcard">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <span className="qid">
                    {a.id} · {a.category}
                  </span>
                  <p className="qtext" style={{ marginBottom: 2 }}>
                    {a.system}
                    <span className="tag" style={{ marginLeft: 10 }}>
                      {a.level}
                    </span>
                  </p>
                  <p className="qwhy" style={{ marginBottom: 6 }}>
                    {a.why}
                  </p>
                  {ACCESS_GUIDES[a.id] && (
                    <p style={{ fontSize: 12.5, color: 'var(--lime-dark)', margin: 0 }}>
                      → {ACCESS_GUIDES[a.id]}
                    </p>
                  )}
                  {a.id === 'AC-13' && (
                    <p style={{ fontSize: 12.5, margin: '4px 0 0' }}>
                      <a href={`${import.meta.env.BASE_URL}templates/orders-template.csv`} download>
                        Скачать шаблон выгрузки заказов (CSV) ↓
                      </a>{' '}
                      <span className="sub" style={{ fontSize: 11.5 }}>
                        — колонки, которые нужны для расчёта; e-mail можно захешировать
                      </span>
                    </p>
                  )}
                </div>
                <select
                  className="status-select"
                  value={status}
                  onChange={(e) => save(a.id, { status: e.target.value })}
                  style={{
                    borderColor:
                      status === 'Выдан' ? 'var(--lime)' : status === 'Нужна помощь' ? 'var(--red)' : undefined,
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {/Файл/i.test(a.level) && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  {files
                    .filter((f) => f.access_id === a.id)
                    .map((f) => (
                      <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13, marginBottom: 4 }}>
                        <span className="mono" style={{ color: 'var(--lime-dark)' }}>📎</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <span className="sub" style={{ fontSize: 11.5 }}>{fmtSize(f.size)}</span>
                        <button className="chip" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => removeFile(f)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  <label className="chip" style={{ display: 'inline-block', marginTop: 6 }}>
                    {uploading === a.id ? 'Загрузка…' : '+ Загрузить файлы'}
                    <input
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => upload(a.id, e.target.files)}
                    />
                  </label>
                </div>
              )}
              {(status === 'В процессе' || status === 'Нужна помощь' || r?.comment) && (
                <input
                  type="text"
                  style={{ marginTop: 10 }}
                  placeholder="Комментарий: кто выдаёт, когда, что мешает…"
                  value={r?.comment ?? ''}
                  onChange={(e) => save(a.id, { comment: e.target.value })}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

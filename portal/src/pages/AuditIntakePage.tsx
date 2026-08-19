import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TIERS,
  BLOCKS,
  REQ_LABEL,
  assetOf,
  blocksForTier,
  reqsForBlockTier,
  type Tier,
  type AuditBlock,
  type Requirement,
  type Asset,
} from '../data/auditTiers';

/**
 * Заявка на аудит. ОДНА переменная — глубина T1–T4 (никаких отдельных галочек
 * «глубже / полнее»: это уровни T3/T4). При выборе блоков раскрываются поля с
 * нужными доступами/документами/скриптами и приложенными ассетами (шаблон /
 * инструкция «для чайников» / скрипт).
 */

const LS_STATE = 'weexp-intake-v1';
type Provided = Record<string, boolean>; // reqId -> предоставлено
type Persist = { tier: Tier; blocks: string[]; provided: Provided };

const load = (): Persist => {
  try {
    return JSON.parse(localStorage.getItem(LS_STATE) ?? '') as Persist;
  } catch {
    return { tier: 1, blocks: [], provided: {} };
  }
};

const TPL_BASE = `${import.meta.env.BASE_URL}templates/`;

function AssetView({ asset }: { asset: Asset }) {
  const [open, setOpen] = useState(false);
  if (asset.kind === 'template') {
    return (
      <div className="asset-panel">
        <div className="asset-head asset-kind-tpl">
          <span>📎 Шаблон</span>
          <a href={`${TPL_BASE}${asset.filename}`} download style={{ fontWeight: 600, color: 'var(--lime-dark)' }}>
            {asset.title} ↓
          </a>
        </div>
        {asset.note && <div className="asset-body" style={{ borderTop: 0, paddingTop: 0 }}>{asset.note}</div>}
      </div>
    );
  }
  const isScript = asset.kind === 'script';
  return (
    <div className="asset-panel">
      <div className={`asset-head ${isScript ? 'asset-kind-scr' : 'asset-kind-ins'}`} onClick={() => setOpen((o) => !o)}>
        <span>{isScript ? '⌨ Скрипт' : '📖 Инструкция «для чайников»'}</span>
        <span style={{ fontWeight: 600 }}>{asset.title}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="asset-body">
          {asset.note && <p style={{ margin: '0 0 8px', color: 'var(--muted)' }}>{asset.note}</p>}
          {isScript ? (
            <>
              <pre>{asset.body}</pre>
              <button
                className="chip"
                style={{ marginTop: 8, fontSize: 11 }}
                onClick={() => navigator.clipboard?.writeText(asset.body ?? '')}
              >
                Копировать
              </button>
            </>
          ) : (
            <pre style={{ background: 'transparent', color: 'var(--ink)', padding: 0 }}>{asset.body}</pre>
          )}
        </div>
      )}
    </div>
  );
}

function ReqRow({
  req,
  provided,
  onToggle,
}: {
  req: Requirement;
  provided: boolean;
  onToggle: () => void;
}) {
  const asset = assetOf(req.assetId);
  const optional = req.kind === 'question';
  return (
    <div className="reqrow">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <span className={`kind-badge kind-${req.kind}`}>{REQ_LABEL[req.kind]}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{req.title}</div>
          <div className="sub" style={{ fontSize: 12 }}>{req.why}</div>
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={provided} onChange={onToggle} />
          {optional ? 'Ответили' : 'Предоставлено'}
        </label>
      </div>
      {asset && <AssetView asset={asset} />}
    </div>
  );
}

function BlockCard({
  block,
  tier,
  provided,
  toggleReq,
}: {
  block: AuditBlock;
  tier: Tier;
  provided: Provided;
  toggleReq: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const reqs = reqsForBlockTier(block, tier);
  const need = reqs.filter((r) => r.kind !== 'question');
  const doneCount = reqs.filter((r) => provided[r.id]).length;
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{block.name}</div>
          <div className="sub" style={{ fontSize: 12.5 }}>{block.tagline}</div>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <span className="tag">{block.domain}</span>
          <div className="sub" style={{ fontSize: 11.5, marginTop: 4 }}>
            {doneCount}/{reqs.length} · доступов/док.: {need.length}
          </div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          {reqs.map((r) => (
            <ReqRow key={r.id} req={r} provided={!!provided[r.id]} onToggle={() => toggleReq(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditIntakePage() {
  const init = load();
  const [tier, setTier] = useState<Tier>(init.tier ?? 1);
  const [selected, setSelected] = useState<string[]>(
    init.blocks?.length ? init.blocks : blocksForTier(init.tier ?? 1).map((b) => b.id),
  );
  const [provided, setProvided] = useState<Provided>(init.provided ?? {});

  const persist = (patch: Partial<Persist>) => {
    const next = { tier, blocks: selected, provided, ...patch };
    localStorage.setItem(LS_STATE, JSON.stringify(next));
  };

  const level = TIERS.find((t) => t.tier === tier)!;
  const available = blocksForTier(tier);

  const chooseTier = (t: Tier) => {
    setTier(t);
    // блоки, ставшие недоступными на более низком тире, убираем; новые доступные — добавляем по умолчанию
    const avail = blocksForTier(t).map((b) => b.id);
    const next = avail.filter((id) => selected.includes(id) || !BLOCKS.find((b) => b.id === id && b.minTier < t));
    setSelected(next);
    persist({ tier: t, blocks: next });
  };

  const toggleBlock = (id: string, disabled: boolean) => {
    if (disabled) return;
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    persist({ blocks: next });
  };

  const toggleReq = (id: string) => {
    const next = { ...provided, [id]: !provided[id] };
    setProvided(next);
    persist({ provided: next });
  };

  const chosenBlocks = available.filter((b) => selected.includes(b.id));

  const summary = useMemo(() => {
    const reqs = chosenBlocks.flatMap((b) => reqsForBlockTier(b, tier));
    const access = reqs.filter((r) => r.kind === 'access').length;
    const docs = reqs.filter((r) => r.kind === 'document').length;
    const qs = reqs.filter((r) => r.kind === 'question').length;
    const done = reqs.filter((r) => provided[r.id]).length;
    return { total: reqs.length, access, docs, qs, done };
  }, [chosenBlocks, tier, provided]);

  return (
    <div className="container" style={{ padding: '30px 20px 80px', maxWidth: 860 }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← На главную</Link>
      <p className="eyebrow" style={{ marginTop: 16 }}>weexp · Заявка на аудит</p>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Что нужно для аудита</h1>
      <p className="sub" style={{ maxWidth: 640 }}>
        Одна переменная — <b>глубина аудита</b>. Чем выше уровень, тем больше входных данных и выше достоверность
        выводов. Выберите глубину и блоки — ниже раскроется точный перечень доступов, документов и скриптов; к каждому
        приложен шаблон, инструкция «как выдать» или скрипт.
      </p>

      {/* 1 · Глубина */}
      <h2 style={{ fontSize: 16, margin: '26px 0 10px' }}>1 · Глубина аудита</h2>
      <div className="seg">
        {TIERS.map((t) => (
          <div key={t.code} className={`seg-btn ${t.tier === tier ? 'on' : ''}`} onClick={() => chooseTier(t.tier)}>
            <div className="seg-code">{t.code}</div>
            <div className="seg-name">{t.name}</div>
            <div className="seg-tag">{t.tagline}</div>
          </div>
        ))}
      </div>
      <div className="tier-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <b style={{ fontSize: 14 }}>{level.code} · {level.name}</b>
          <span className="tag" style={{ background: 'rgba(163,230,53,0.16)' }}>достоверность до {level.confidence}%</span>
        </div>
        <p className="sub" style={{ margin: '6px 0 8px', fontSize: 12.5 }}><b>Входные данные:</b> {level.inputs}</p>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>Что открывается на этом уровне:</div>
        {level.unlocks.map((u) => <div key={u} className="unlock-li">• {u}</div>)}
        <p className="sub" style={{ marginTop: 10, fontSize: 12 }}>
          «Глубже» и «полный аудит» — это уровни <b>T3</b> и <b>T4</b>. Отдельные галочки не нужны: всё включается выбором глубины.
        </p>
      </div>

      {/* 2 · Блоки */}
      <h2 style={{ fontSize: 16, margin: '26px 0 10px' }}>2 · Блоки аудита</h2>
      <p className="sub" style={{ fontSize: 12.5, marginTop: 0 }}>По умолчанию включены все блоки, доступные на выбранной глубине. Серые — открываются на более высоком уровне.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {BLOCKS.map((b) => {
          const disabled = b.minTier > tier;
          const on = selected.includes(b.id) && !disabled;
          return (
            <span
              key={b.id}
              className={`blkchip ${disabled ? 'off' : on ? 'on' : ''}`}
              title={disabled ? `Доступно с T${b.minTier}` : b.tagline}
              onClick={() => toggleBlock(b.id, disabled)}
            >
              {on ? '✓ ' : ''}{b.name}{disabled ? ` · с T${b.minTier}` : ''}
            </span>
          );
        })}
      </div>

      {/* 3 · Итог */}
      <div className="note" style={{ margin: '20px 0 6px', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span><b>{chosenBlocks.length}</b> блоков</span>
        <span>🔑 доступов: <b>{summary.access}</b></span>
        <span>📄 документов: <b>{summary.docs}</b></span>
        <span>❓ вопросов: <b>{summary.qs}</b></span>
        <span style={{ marginLeft: 'auto' }}>Готово: <b>{summary.done}/{summary.total}</b></span>
      </div>

      {/* 4 · Что предоставить по каждому блоку */}
      <h2 style={{ fontSize: 16, margin: '22px 0 10px' }}>3 · Что предоставить</h2>
      {chosenBlocks.length === 0 && <p className="sub">Выберите хотя бы один блок выше.</p>}
      {chosenBlocks.map((b) => (
        <BlockCard key={b.id} block={b} tier={tier} provided={provided} toggleReq={toggleReq} />
      ))}

      <p className="sub" style={{ marginTop: 18, fontSize: 12 }}>
        Файлы и живые доступы удобнее всего передать на странице{' '}
        <Link to="/access" style={{ color: 'var(--lime-dark)' }}>Передача доступов</Link>{' '}
        или подключить на{' '}
        <Link to="/connectors" style={{ color: 'var(--lime-dark)' }}>Коннекторах</Link>. Пароли мы никогда не просим через формы.
      </p>
    </div>
  );
}

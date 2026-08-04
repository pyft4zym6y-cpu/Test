import { Link, useParams } from 'react-router-dom';
import { QUESTIONS, DOMAINS, isVisible, optionsFor, type Question } from '../lib/model';
import { useAnswers, answerMap } from '../lib/useAnswers';

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = optionsFor(q);
  const isOther = (o: string) => /^друг(ое|ая|ой|ие)/i.test(o);
  if (q.type === 'Мультивыбор' && opts) {
    const selected = value ? value.split(' | ') : [];
    const isOn = (o: string) => (isOther(o) ? selected.some(isOther) : selected.includes(o));
    const toggle = (o: string) => {
      const next = isOn(o)
        ? selected.filter((x) => (isOther(o) ? !isOther(x) : x !== o))
        : [...selected, o];
      onChange(next.join(' | '));
    };
    const otherOpt = opts.find(isOther);
    const otherEntry = selected.find(isOther);
    const otherText = otherEntry?.includes(': ') ? otherEntry.slice(otherEntry.indexOf(': ') + 2) : '';
    const setOtherText = (t: string) => {
      const entry = t.trim() ? `${otherOpt}: ${t}` : otherOpt!;
      onChange(selected.map((x) => (isOther(x) ? entry : x)).join(' | '));
    };
    return (
      <div>
        <div className="chips">
          {opts.map((o) => (
            <span key={o} className={`chip ${isOn(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
              {o}
            </span>
          ))}
        </div>
        {otherOpt && otherEntry && (
          <input
            type="text"
            placeholder="Впишите свой вариант…"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            style={{ marginTop: 8 }}
          />
        )}
      </div>
    );
  }
  if (opts && (q.type === 'Текст' || q.type === 'Число')) {
    // Разбивка по позициям («Сайт %», «Опт %»…): каждой строке — своё поле.
    const isPct = opts.every((o) => o.trim().endsWith('%'));
    const label = (o: string) => o.replace(/\s*%$/, '').trim();
    const map: Record<string, string> = {};
    value.split(' | ').forEach((part) => {
      const i = part.indexOf(': ');
      if (i > 0) map[part.slice(0, i)] = part.slice(i + 2);
    });
    const setPart = (l: string, v: string) => {
      const next = { ...map, [l]: v };
      onChange(
        opts
          .map(label)
          .filter((l2) => (next[l2] ?? '').trim())
          .map((l2) => `${l2}: ${next[l2].trim()}`)
          .join(' | '),
      );
    };
    const sum = isPct
      ? opts.map(label).reduce((s, l) => s + (parseFloat((map[l] ?? '').replace(',', '.')) || 0), 0)
      : null;
    return (
      <div>
        {opts.map((o) => {
          const l = label(o);
          return (
            <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 13, minWidth: 130 }}>{l}</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder={isPct ? '0' : 'Значение'}
                value={map[l] ?? ''}
                onChange={(e) => setPart(l, e.target.value)}
                style={{ maxWidth: 110 }}
              />
              {isPct && <span className="sub" style={{ fontSize: 13 }}>%</span>}
            </div>
          );
        })}
        {sum !== null && sum > 0 && (
          <p
            className="mono"
            style={{
              fontSize: 12,
              margin: '4px 0 0',
              color: Math.abs(sum - 100) <= 2 ? 'var(--lime-dark)' : 'var(--amber)',
            }}
          >
            Сумма: {Math.round(sum * 10) / 10}%{Math.abs(sum - 100) > 2 ? ' · обычно в сумме ≈100%' : ' ✓'}
          </p>
        )}
        <p className="sub" style={{ fontSize: 11.5, margin: '4px 0 0' }}>
          Не знаете точно — впишите оценку; пустые строки не сохраняются.
        </p>
      </div>
    );
  }
  if (opts) {
    const otherOpt = opts.find(isOther);
    const otherActive = Boolean(otherOpt) && /^друг(ое|ая|ой|ие)/i.test(value);
    const otherText = otherActive && value.includes(': ') ? value.slice(value.indexOf(': ') + 2) : '';
    return (
      <div>
        <div className="chips">
          {opts.map((o) => (
            <span
              key={o}
              className={`chip ${value === o || (isOther(o) && otherActive) ? 'on' : ''}`}
              onClick={() => onChange(o)}
            >
              {o}
            </span>
          ))}
        </div>
        {otherActive && (
          <input
            type="text"
            placeholder="Впишите свой вариант…"
            value={otherText}
            onChange={(e) => onChange(e.target.value.trim() ? `${otherOpt}: ${e.target.value}` : otherOpt!)}
            style={{ marginTop: 8 }}
          />
        )}
      </div>
    );
  }
  if (q.type === 'Число') {
    return (
      <input
        type="text"
        inputMode="decimal"
        placeholder="Число или диапазон"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <textarea placeholder="Ваш ответ…" value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

export default function DomainPage() {
  const { sheet } = useParams();
  const domain = DOMAINS.find((d) => d.sheet === sheet);
  const { rows, loaded, save, savedAt } = useAnswers();
  const answers = answerMap(rows);

  if (!domain) return null;
  const qs = QUESTIONS.filter((q) => q.domain === domain.key);
  const visible = qs.filter((q) => isVisible(q, answers));
  const l1 = qs.filter((q) => q.level === 'L1');
  const done = l1.filter((q) => answers[q.id]).length;

  const idx = DOMAINS.findIndex((d) => d.sheet === sheet);
  const next = DOMAINS[idx + 1];

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        ← Все опросники
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 10 }}>
        <h1 style={{ margin: 0 }}>{domain.key}</h1>
        <span className="mono" style={{ fontWeight: 700 }}>
          {done}/{l1.length}
        </span>
      </div>
      <div className="progress" style={{ margin: '12px 0 6px' }}>
        <div style={{ width: `${l1.length ? (done / l1.length) * 100 : 0}%` }} />
      </div>
      <p className="sub" style={{ marginBottom: 20 }}>
        Не знаете точно — пишите оценку и помечайте её как оценку. «Не знаю / не считаем» — тоже
        ценный ответ. {savedAt && <span className="saved">Сохранено ✓</span>}
      </p>

      {!loaded ? (
        <p className="sub">Загрузка…</p>
      ) : (
        visible.map((q) => (
          <div key={q.id} className={`qcard ${q.level !== 'L1' ? 'branch' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span className="qid">
                {q.id}
                {q.branch ? ` · ветка «${q.branch}»` : ''}
              </span>
              {q.role && <span className="tag">{q.role}</span>}
            </div>
            <p className="qtext">{q.text}</p>
            {q.why && <p className="qwhy">{q.why}</p>}
            <QuestionInput
              q={q}
              value={rows[q.id]?.answer ?? ''}
              onChange={(v) => save(q.id, { answer: v })}
            />
            <details className="facts" open={Boolean(rows[q.id]?.facts)}>
              <summary>Факты, цифры, ссылки — по желанию</summary>
              <textarea
                style={{ marginTop: 8, minHeight: 56 }}
                placeholder="Например: конверсия 1,2% по GA4 за последние 3 мес…"
                value={rows[q.id]?.facts ?? ''}
                onChange={(e) => save(q.id, { facts: e.target.value })}
              />
            </details>
          </div>
        ))
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
        <Link to="/" className="btn btn-ghost">
          ← К списку
        </Link>
        {next && (
          <Link to={`/d/${next.sheet}`} className="btn">
            Далее: {next.key} →
          </Link>
        )}
      </div>
    </div>
  );
}

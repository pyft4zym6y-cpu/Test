import { useEffect, useRef, useState } from 'react';
import { useAuditSnapshot, snapshotToContext, localAnswer, type AuditSnapshot } from '../lib/assistant';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Какой Health Score и что он значит?',
  'С чего начать — приоритетное решение?',
  'Сколько недополучаем оборота?',
  'Что запросить у клиента дальше?',
];

const GREETING =
  'Я со-пилот аудита Commerce OS. Вижу текущий срез аудита и отвечаю по нему: Health Score, недополученный оборот, приоритеты, разрывы, противоречия, что запросить у клиента. Спросите или выберите подсказку ниже.';

/** Потоковый запрос к /api/assistant; при отсутствии ключа — офлайн-ответ. */
async function streamReply(
  messages: Msg[],
  snapshot: AuditSnapshot | null,
  onDelta: (t: string) => void,
): Promise<'ok' | 'offline'> {
  let resp: Response;
  try {
    resp = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages, context: snapshot ? snapshotToContext(snapshot) : '' }),
    });
  } catch {
    return 'offline';
  }
  if (resp.status === 501) return 'offline';
  if (!resp.ok || !resp.body) {
    onDelta(`\n[ошибка сервиса: ${resp.status}]`);
    return 'ok';
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value, { stream: true }));
  }
  return 'ok';
}

export default function Assistant() {
  const { snapshot } = useAuditSnapshot();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: GREETING }]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const history: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs([...history, { role: 'assistant', content: '' }]);
    setBusy(true);

    const patchLast = (fn: (prev: string) => string) =>
      setMsgs((cur) => {
        const next = cur.slice();
        next[next.length - 1] = { role: 'assistant', content: fn(next[next.length - 1].content) };
        return next;
      });

    try {
      const mode = await streamReply(history, snapshot, (d) => patchLast((p) => p + d));
      if (mode === 'offline') {
        const ans = snapshot
          ? localAnswer(q, snapshot)
          : 'Аудит ещё загружается — откройте страницу отчёта или заполните опросник, и спросите снова.';
        patchLast(() => ans + '\n\n_(офлайн-режим: ANTHROPIC_API_KEY не подключён — ответ собран движком)_');
      }
    } catch (e) {
      patchLast((p) => p + `\n[сбой: ${String(e).slice(0, 120)}]`);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть AI-со-пилота аудита"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 999,
          padding: '12px 18px', cursor: 'pointer', boxShadow: '0 8px 26px rgba(10,14,18,0.28)',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, letterSpacing: '0.02em',
        }}
      >
        <span style={{ color: 'var(--lime-bright)' }}>◆</span> Со-пилот аудита
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="AI-со-пилот аудита Commerce OS"
      style={{
        position: 'fixed', bottom: 18, right: 18, zIndex: 50,
        width: 'min(420px, calc(100vw - 24px))', height: 'min(620px, calc(100vh - 36px))',
        display: 'flex', flexDirection: 'column',
        background: '#fff', border: '1px solid var(--line)', borderRadius: 6,
        boxShadow: '0 18px 50px rgba(10,14,18,0.24)', overflow: 'hidden',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--line)', background: 'var(--ink)', color: '#fff' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>
          <span style={{ color: 'var(--lime-bright)' }}>◆</span> Commerce OS · со-пилот
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Свернуть" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </header>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              background: m.role === 'user' ? 'var(--lime-bright)' : 'rgba(10,14,18,0.045)',
              color: 'var(--ink)', borderRadius: 8, padding: '9px 12px',
              fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {m.content || (busy && i === msgs.length - 1 ? '…' : '')}
          </div>
        ))}
        {msgs.length <= 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => send(s)} style={{ fontSize: 11.5, padding: '6px 10px' }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--line)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Спросите про аудит…"
          disabled={busy}
          style={{ flex: 1, fontSize: 13.5, padding: '9px 11px' }}
        />
        <button type="submit" className="btn" disabled={busy || !input.trim()} style={{ padding: '9px 16px', fontSize: 12.5 }}>
          {busy ? '…' : '→'}
        </button>
      </form>
    </div>
  );
}

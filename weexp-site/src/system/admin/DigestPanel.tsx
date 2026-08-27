import { useMemo, useState } from 'react';
import type { AdminRow } from '@/lib/supa';
import { toast } from '@/lib/toast';
import { buildDigest, digestText, type DigestItem } from './digest';

/**
 * Тижневий зріз на дашборді.
 *
 * Дашборд поруч показує СТАН — скільки клієнтів на якому етапі. Стан і рух це
 * різні речі: база, де за тиждень не зрушив ніхто, і база, де зрушили всі,
 * на дашборді виглядають однаково. Тут — рух.
 *
 * Головне в цьому блоці — розділення «хід за нами» і «чекаємо клієнта».
 * У списку прострочених вони стоять поруч і виглядають однаково, хоча
 * вимагають протилежних дій: одне — сісти й зробити, друге — написати клієнту.
 */
export function DigestPanel({ rows, onOpen }: { rows: AdminRow[] | null; onOpen?: (userId: string) => void }) {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const d = useMemo(() => buildDigest(rows || [], days), [rows, days]);
  if (!rows) return null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(digestText(d)); toast('✓ Зріз скопійовано — можна вставити в чат команди'); }
    catch { toast('Не вдалось скопіювати — виділіть текст вручну', 'err'); }
  };

  const List = ({ title, items, hint }: { title: string; items: DigestItem[]; hint: string }) => {
    if (!items.length) return null;
    return (
      <div className="adm-dig-col">
        <span className="adm-col-h mono">{title} · {items.length}</span>
        <p className="mono adm-empty">{hint}</p>
        {items.slice(0, 8).map((i) => (
          <button key={i.userId} type="button" className="adm-dig-row" onClick={() => onOpen?.(i.userId)}>
            <b>{i.who}</b>
            <span className="mono">{i.days} дн.</span>
            <i className="mono">норматив {i.limit}</i>
          </button>
        ))}
        {items.length > 8 && <span className="mono adm-empty">…і ще {items.length - 8}</span>}
      </div>
    );
  };

  return (
    <section className="adm-sec adm-dig">
      <div className="adm-sec-head">
        <h2 className="adm-col-h mono">Що зрушило за період</h2>
        <div className="adm-period">
          {([7, 14, 30] as const).map((p) => (
            <button key={p} className={`adm-period-b${days === p ? ' on' : ''}`} onClick={() => setDays(p)}>{p}д</button>
          ))}
          <button className="mc-btn ghost" onClick={copy}>⧉ Копіювати зріз</button>
        </div>
      </div>

      <p className="adm-dig-sum mono">
        Клієнтів у роботі <b>{d.total}</b> · зрушили <b>{d.moved}</b> · без руху <b>{d.still}</b>
      </p>

      <div className="adm-dig-grid">
        <List title="Прострочено" items={d.breached} hint="вийшло за норматив — розбирати першим" />
        <List title="Хід за нами" items={d.ourMove} hint="клієнт зробив крок і чекає нашої відповіді" />
        <List title="Чекаємо клієнта" items={d.clientMove} hint="ми свій крок зробили — тут потрібне нагадування, а не робота" />
      </div>

      {!d.breached.length && !d.ourMove.length && !d.clientMove.length && (
        <p className="mono adm-empty">Нічого не висить — рідкісний тиждень.</p>
      )}
    </section>
  );
}

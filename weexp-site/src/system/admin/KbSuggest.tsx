import { useEffect, useState } from 'react';
import type { DiagRecord } from '@/lib/supa';
import { loadKbTeam, mergeKb, kbForSystems } from '@/lib/kb';
import { kindLabel, type KbItem } from '@/data/kbLibrary';
import { SYSTEMS } from '@/data/xray';
import type { SysKey } from '@/system/systems';

/**
 * Бібліотека, підставлена під конкретного клієнта.
 *
 * Полиця з методиками, до якої треба окремо дійти, не використовується: у
 * момент роботи над аудитом ніхто не згадує, що вона є. Тому тут ті самі
 * матеріали, але відібрані під системи, де в цього клієнта провал.
 *
 * Слабкі системи беремо з експрес-аудиту — це єдине місце, де вони вже
 * пораховані. Немає експресу — показуємо це прямо, а не порожній список.
 */
const WEAK = 55;   // health нижче цього вважаємо провалом

export function KbSuggest({ rec }: { rec: DiagRecord }) {
  const [all, setAll] = useState<KbItem[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { void loadKbTeam().then((r) => { setAll(mergeKb(r.team)); if (r.error) setErr(r.error); }); }, []);

  const ex = rec.express;
  const weak: SysKey[] = ex
    ? [
        ...(ex.health || []).filter((h) => h.score < WEAK).map((h) => h.key as SysKey),
        ...(ex.primary ? [ex.primary as SysKey] : []),
        ...(ex.secondary ? [ex.secondary as SysKey] : []),
      ].filter((v, i, a) => a.indexOf(v) === i)
    : [];

  if (!ex) return <p className="mono adm-empty">Клієнт ще не проходив експрес-аудит, тож слабких систем ми поки не знаємо. Уся бібліотека — у розділі «Аудит і проєкти → Бібліотека».</p>;
  if (all === null) return <p className="mc-msg mono">Завантаження…</p>;

  const items = kbForSystems(all, weak);
  return (
    <div className="adm-kb-sug">
      <p className="mono adm-hint">
        Системи з провалом за експрес-аудитом: {weak.length ? weak.map((k) => SYSTEMS.find((s) => s.key === k)?.title || k).join(' · ') : 'немає — health рівний'}.
        {err ? ` ${err}` : ''}
      </p>
      {items.length === 0
        ? <p className="mono adm-empty">Під ці системи матеріалів у бібліотеці ще немає. Додайте їх у «Аудит і проєкти → Бібліотека» — вони зʼявляться тут у всіх схожих клієнтів.</p>
        : (
          <ul className="adm-kv">
            {items.map((i) => (
              <li key={i.id}>
                <i>{kindLabel(i.kind)}</i>
                <span><b>{i.title}</b> — {i.summary}{i.forClient ? ' · можна віддати клієнту' : ''}</span>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

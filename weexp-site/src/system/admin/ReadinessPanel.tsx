import { useMemo, useState } from 'react';
import type { AuditAnswer, DiagRecord } from '@/lib/supa';
import { assessReadiness } from './readiness';

/**
 * Що вийде з прогону — ДО того, як його запустили.
 *
 * Стоїть поруч із кнопкою «Запустити аудит» навмисно: рішення про запуск і
 * знання про наслідки мають бути в одному місці. Згорнута за замовчуванням —
 * коли все зібрано, розгортати нічого; коли ні, у заголовку видно число.
 */
export function ReadinessPanel({ rec, answers }: { rec: DiagRecord; answers: Record<string, AuditAnswer>; }) {
  const [open, setOpen] = useState(false);

  // Частка заповненої анкети: беремо відповіді з непорожнім значенням. Точного
  // знаменника тут немає — шаблон редагується адміном, — тож рахуємо від
  // 120 як робочого мінімуму, вище якого анкету можна вважати заповненою.
  const share = useMemo(() => {
    const done = Object.values(answers).filter((a) => a && a.value != null && a.value !== '').length;
    return Math.max(0, Math.min(1, done / 120));
  }, [answers]);

  const r = useMemo(() => assessReadiness(rec, share), [rec, share]);
  const level = r.overall >= 75 ? 'ok' : r.overall >= 45 ? 'wait' : 'bad';

  return (
    <div className="adm-ready">
      <button type="button" className="adm-ready-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={`cab-badge mono tst-${level}`}>{r.overall}%</span>
        <b>Готовність до прогону</b>
        {/* Це прогноз, а не опис зібраних даних: без цього слова відсотки
            читаються як «у нас уже все є». */}
        <i className="mono adm-ready-code">прогноз</i>
        <i className="adm-ready-verdict">{r.verdict}</i>
        <span className="mono adm-ready-chev">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="adm-ready-body">
          {r.asks.length > 0 && (
            <div className="adm-ready-asks">
              <span className="adm-col-h mono">Що просити першим</span>
              {r.asks.map((a) => (
                <div key={a.what} className="adm-ready-ask">
                  <b>{a.what}</b>
                  <span className="mono">{a.kind === 'access' ? 'доступ' : a.kind === 'file' ? 'файл' : 'анкета'}</span>
                  <i>розблокує {a.unlocks.length} {a.unlocks.length === 1 ? 'документ' : 'документів'}: {a.unlocks.join(', ')}</i>
                </div>
              ))}
            </div>
          )}

          <div className="adm-ready-grid">
            {r.docs.map((d) => (
              <div key={d.code} className="adm-ready-doc">
                <div className="adm-ready-doc-h">
                  {/* Назва першою, код — службова мітка. Раніше в очі кидались
                      «A12 / A7 / A1», і картка виглядала як набір аудитів,
                      яких клієнт не замовляв. */}
                  <span>{d.title}</span>
                  <b className="mono adm-ready-code">{d.code}</b>
                  <b className={`mono adm-ready-pct is-${d.pct >= 75 ? 'ok' : d.pct >= 40 ? 'mid' : 'low'}`}>{d.pct}%</b>
                </div>
                <div className="adm-ready-bar" role="presentation"><i style={{ width: `${d.pct}%` }} /></div>
                {d.missing.length > 0 && <p className="mono adm-ready-miss">бракує: {d.missing.join(' · ')}</p>}
              </div>
            ))}
          </div>

          <p className="mono adm-hint">
            Прогін без доступів має сенс — він дає зовнішній шар: обхід, SEO, UX, швидкість.
            Сенсу немає в іншому: запустити його, не знаючи, що вийде, і пояснювати клієнту
            порожній фінансовий розділ уже після.
          </p>
        </div>
      )}
    </div>
  );
}

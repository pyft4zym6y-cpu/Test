import { useMemo, useState } from 'react';
import type { Project, ProjTask, ProjMonth } from '@/lib/supa';

/**
 * «Мій проект» — read-only вітрина для клієнта. Веде менеджер (адмінка),
 * клієнт лише переглядає: діаграма Ганта, команда, фінансовий календар (€, без ПДВ),
 * помісячна тарифікація з деталізацією годин. Кнопка «Завантажити PDF» = друк.
 */

const MONTHS_UK = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
const eur = (n: number) => '€' + (n || 0).toLocaleString('uk-UA');

function monthLabel(startMonth: string | undefined, i: number): string {
  const m = /^(\d{4})-(\d{1,2})$/.exec(startMonth || '');
  if (!m) return `М${i + 1}`;
  const base = (Number(m[1]) * 12 + (Number(m[2]) - 1)) + i;
  const y = Math.floor(base / 12), mo = base % 12;
  return `${MONTHS_UK[mo]} ${String(y).slice(2)}`;
}
const monthName = (ym: string) => {
  const m = /^(\d{4})-(\d{1,2})$/.exec(ym || '');
  return m ? `${MONTHS_UK[Number(m[2]) - 1]} ${m[1]}` : (ym || '—');
};
const rowTotal = (mo: ProjMonth) => (mo.items || []).reduce((s, it) => s + (it.hours || 0) * (it.rate || 0), 0);
const rowHours = (mo: ProjMonth) => (mo.items || []).reduce((s, it) => s + (it.hours || 0), 0);

export function ProjectView({ projects, en }: { projects: Project[]; en: boolean }) {
  const t = (uk: string, e: string) => (en ? e : uk);
  const pub = (projects || []).filter((x) => x.published);
  const [sel, setSel] = useState(0);
  const p = pub[Math.min(sel, pub.length - 1)];
  const span = Math.max(1, Math.min(24, p?.span || 6));
  const cols = useMemo(() => Array.from({ length: span }, (_, i) => i), [span]);

  const fin = useMemo(() => {
    const pays = p?.payments || [];
    const total = pays.reduce((s, x) => s + (x.amount || 0), 0);
    const paid = pays.filter((x) => x.status === 'paid').reduce((s, x) => s + (x.amount || 0), 0);
    return { total, paid, left: total - paid };
  }, [p]);

  const tariffTotal = useMemo(() => (p?.tariff || []).reduce((s, mo) => s + rowTotal(mo), 0), [p]);

  if (!p) {
    return (
      <section className="cab-sec">
        <header className="cab-sec-head">
          <span className="sysx-kick">{t('Мій проект', 'My project')}</span>
          <h1 className="sysx-display cab-h1">{t('Проект готується', 'Project is being prepared')}</h1>
          <p className="cab-lead">{t('Тут зʼявиться повний план ведення: діаграма Ганта, команда, фінансовий календар і помісячна тарифікація. Розділ вмикається, коли менеджер опублікує проект.', 'Your full delivery plan will appear here: Gantt chart, team, financial calendar and monthly tariffication. It turns on once your manager publishes the project.')}</p>
        </header>
        <div className="pj-empty mono">{t('Очікує на публікацію менеджером', 'Awaiting publication by your manager')}</div>
      </section>
    );
  }

  return (
    <section className="cab-sec pj">
      <header className="cab-sec-head pj-head">
        <div>
          <span className="sysx-kick">{t('Мій проект', 'My project')}</span>
          <h1 className="sysx-display cab-h1">{p.title || t('План ведення', 'Delivery plan')}</h1>
        </div>
        <button className="pj-print mono" onClick={() => window.print()}>⬇ {t('Завантажити PDF', 'Download PDF')}</button>
      </header>

      {pub.length > 1 && (
        <div className="pj-switch">
          {pub.map((x, i) => (
            <button key={x.id || i} className={`pj-switch-b${i === Math.min(sel, pub.length - 1) ? ' on' : ''}`} onClick={() => setSel(i)}>{x.title || t('Проект', 'Project') + ' ' + (i + 1)}</button>
          ))}
        </div>
      )}

      {/* Гант */}
      <div className="pj-card">
        <h2 className="pj-h2">{t('Дорожня карта', 'Roadmap')}</h2>
        {(!p.tasks || p.tasks.length === 0) ? <p className="pj-none mono">—</p> : (
          <div className="pj-gantt-wrap">
            <div className="pj-gantt" style={{ ['--cols' as string]: span }}>
              <div className="pj-g-corner" />
              {cols.map((i) => <div key={i} className="pj-g-mh mono">{monthLabel(p.startMonth, i)}</div>)}
              {(p.tasks || []).map((tk: ProjTask) => (
                <GanttRow key={tk.id} tk={tk} span={span} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Команда */}
      <div className="pj-card">
        <h2 className="pj-h2">{t('Команда', 'Team')}</h2>
        {(!p.team || p.team.length === 0) ? <p className="pj-none mono">—</p> : (
          <div className="pj-team">
            {(p.team || []).map((m) => (
              <div key={m.id} className="pj-member">
                <span className="pj-m-role mono">{m.role}</span>
                <b className="pj-m-name">{m.name || '—'}</b>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Фінансовий календар */}
      <div className="pj-card">
        <h2 className="pj-h2">{t('Фінансовий календар', 'Financial calendar')}</h2>
        <p className="pj-sub mono">{t('Суми без ПДВ, у євро', 'Amounts excl. VAT, in euro')}</p>
        {(!p.payments || p.payments.length === 0) ? <p className="pj-none mono">—</p> : (
          <>
            <table className="pj-table">
              <thead><tr><th>{t('Платіж', 'Payment')}</th><th>{t('Місяць', 'Month')}</th><th className="r">{t('Сума', 'Amount')}</th><th className="r">{t('Статус', 'Status')}</th></tr></thead>
              <tbody>
                {(p.payments || []).map((x) => (
                  <tr key={x.id}>
                    <td>{x.label || '—'}</td>
                    <td className="mono">{monthName(x.month)}</td>
                    <td className="r mono">{eur(x.amount)}</td>
                    <td className="r"><span className={`pj-pay ${x.status}`}>{x.status === 'paid' ? t('Сплачено', 'Paid') : t('Очікує', 'Due')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pj-fin-sum">
              <span>{t('Всього', 'Total')}: <b className="mono">{eur(fin.total)}</b></span>
              <span>{t('Сплачено', 'Paid')}: <b className="mono ok">{eur(fin.paid)}</b></span>
              <span>{t('Залишок', 'Remaining')}: <b className="mono">{eur(fin.left)}</b></span>
            </div>
          </>
        )}
      </div>

      {/* Помісячна тарифікація */}
      <div className="pj-card">
        <h2 className="pj-h2">{t('Помісячна тарифікація', 'Monthly tariffication')}</h2>
        <p className="pj-sub mono">{t('Змішана модель — деталізація годин за ролями та задачами', 'Mixed model — hour detail by roles and tasks')}</p>
        {(!p.tariff || p.tariff.length === 0) ? <p className="pj-none mono">—</p> : (
          <>
            {(p.tariff || []).map((mo) => (
              <div key={mo.id} className="pj-tmonth">
                <div className="pj-tm-head">
                  <b>{monthName(mo.month)}</b>
                  <span className="mono">{rowHours(mo)} {t('год', 'h')} · {eur(rowTotal(mo))}</span>
                </div>
                {(mo.items || []).length > 0 && (
                  <table className="pj-table sm">
                    <thead><tr><th>{t('Робота', 'Work')}</th><th className="r">{t('Годин', 'Hours')}</th><th className="r">{t('Ставка', 'Rate')}</th><th className="r">{t('Сума', 'Amount')}</th></tr></thead>
                    <tbody>
                      {(mo.items || []).map((it) => (
                        <tr key={it.id}>
                          <td>{it.label || '—'}</td>
                          <td className="r mono">{it.hours || 0}</td>
                          <td className="r mono">{eur(it.rate)}</td>
                          <td className="r mono">{eur((it.hours || 0) * (it.rate || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
            <div className="pj-fin-sum"><span>{t('Разом за проект', 'Project total')}: <b className="mono">{eur(tariffTotal)}</b></span></div>
          </>
        )}
      </div>
    </section>
  );
}

function GanttRow({ tk, span }: { tk: ProjTask; span: number }) {
  const start = Math.max(0, Math.min(span - 1, tk.startM || 0));
  const len = Math.max(1, Math.min(span - start, tk.lenM || 1));
  const prog = Math.max(0, Math.min(100, tk.progress ?? 0));
  return (
    <>
      <div className="pj-g-task">
        <b>{tk.name || '—'}</b>
        {tk.owner && <span className="pj-g-owner mono">{tk.owner}</span>}
      </div>
      <div className="pj-g-bar" style={{ gridColumn: `${2 + start} / span ${len}` }}>
        <span className="pj-g-fill" style={{ width: `${prog}%` }} />
        {prog > 0 && <i className="pj-g-pct mono">{prog}%</i>}
      </div>
    </>
  );
}

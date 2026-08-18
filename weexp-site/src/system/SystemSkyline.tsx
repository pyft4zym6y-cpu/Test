import './system.css';

/**
 * SYSTEM SKYLINE — легка, зрозуміла візуалізація восьми систем замість
 * абстрактного 3D-міста. Кожен стовпчик = система; висота = зрілість (0–100),
 * колір = здоров'я. Плавно росте й перефарбовується з кожною відповіддю (CSS-
 * трансформації, без WebGL — тому не «скаче» на мобільному й миттєво читається:
 * високий стовпчик = сильна система, низький червоний = вузьке місце).
 */
export type SkylineSystem = { key: string; label: string; score: number };

const health = (s: number) => (s <= 0 ? 'none' : s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');
const short = (label: string) => label.split(/\s|\//)[0];

export function SystemSkyline({
  systems,
  completeness,
  activeKey,
  compact = false,
}: {
  systems: SkylineSystem[];
  completeness?: number;
  activeKey?: string;
  compact?: boolean;
}) {
  return (
    <div className={'skl' + (compact ? ' is-compact' : '')} role="img" aria-label="Зрілість восьми систем">
      <div className="skl-grid" aria-hidden="true">
        <span style={{ bottom: '65%' }} />
        <span style={{ bottom: '40%' }} />
      </div>
      <div className="skl-bars">
        {systems.map((s, i) => {
          const h = Math.max(4, Math.min(100, s.score));
          return (
            <div key={s.key} className={'skl-col' + (activeKey === s.key ? ' is-active' : '')}>
              <span className="skl-score mono">{s.score}</span>
              <div className="skl-track">
                <div className={`skl-bar h-${health(s.score)}`} style={{ height: `${h}%`, transitionDelay: `${i * 40}ms` }} />
              </div>
              <span className="skl-lbl">{short(s.label)}</span>
            </div>
          );
        })}
      </div>
      {completeness != null && (
        <div className="skl-foot mono"><span>Заповнено даних</span><div className="skl-fill"><i style={{ width: `${completeness}%` }} /></div><b>{completeness}%</b></div>
      )}
    </div>
  );
}

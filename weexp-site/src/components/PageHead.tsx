import type { ReactNode } from 'react';

/** Шапка раздела: разрыв масштаба (эйбрау → крупный заголовок → лид). */
export function PageHead({ kicker, title, lead }: { kicker: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="wrap">
        <span className="page-kick">{kicker}</span>
        <h1 className="page-h1">{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
      </div>
    </header>
  );
}

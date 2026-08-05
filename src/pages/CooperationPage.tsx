import Process from '../components/Process';
import Economics from '../components/Economics';
import Offers from '../components/Offers';
import { Competitors } from '../components/Market';
import { Fork, PageCta } from '../components/NewSections';
import SubNav from '../components/SubNav';

export const COOP_SECTIONS = [
  { id: 'formats', label: 'Формати та ціни' },
  { id: 'process', label: 'Процес і гарантії' },
  { id: 'alternatives', label: 'Порівняння' },
  { id: 'fork', label: 'Розвилка' },
];

const anchor = { scrollMarginTop: 118 } as React.CSSProperties;

/*
 * «Співпраця»: три формати роботи з цінами → як влаштований процес і чим
 * захищений бюджет → порівняння з альтернативами → дві траєкторії.
 * Колишні /services та /process.
 */
export default function CooperationPage() {
  return (
    <div className="pt-16">
      <SubNav items={COOP_SECTIONS} />

      <div id="formats" style={anchor}>
        <Offers />
      </div>

      <div id="process" style={anchor}>
        <Process />
        <Economics />
      </div>

      <div id="alternatives" style={anchor}>
        <Competitors />
      </div>

      <div id="fork" style={anchor}>
        <Fork />
      </div>

      <PageCta label="Почнімо з аудиту" />
    </div>
  );
}

import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle } from './ui';

const INDUSTRIES = [
  { name: 'FMCG / Beauty', text: 'нац. дистриб’ютор · 17K SKU · +40% · Henkel, J&J, NYX', color: '#B45309' },
  { name: 'Home & Decor · Textile', text: 'преміум-текстиль ×18 · споживчі товари hobby/home', color: '#65A30D' },
  { name: 'Consumer Electronics', text: 'мультиканальна роздрібна модель · Amazon', color: '#0F9488' },
  { name: 'Fashion', text: 'маркетплейси ЄС · листинги · retention', color: '#DB2777' },
  { name: 'Fintech', text: 'цифрові продукти · воронки · аналітика', color: '#6D28D9' },
  { name: 'AI', text: 'AI-домен Commerce OS · персоналізація, автоматизація', color: '#EA580C' },
];

type Mark = 'yes' | 'no' | 'part';

const COMPETITORS: {
  name: string;
  sub: string;
  marks: Mark[];
  price: string;
  me?: boolean;
}[] = [
  { name: 'McKinsey · Deloitte', sub: 'big consulting', marks: ['yes', 'no', 'part', 'no', 'yes'], price: '$$$$' },
  { name: 'Netpeak · Promodo', sub: 'performance-агенції', marks: ['part', 'yes', 'no', 'no', 'no'], price: '$$' },
  { name: 'Elogic · dev-студії', sub: 'e-com розробка', marks: ['no', 'yes', 'part', 'no', 'no'], price: '$$' },
  { name: 'Fractional CMO', sub: 'маркетинг-лідер', marks: ['yes', 'part', 'part', 'part', 'no'], price: '$$$' },
  { name: 'In-house Head', sub: 'повний штат', marks: ['yes', 'yes', 'yes', 'yes', 'no'], price: '$$$$' },
  { name: 'weexp · Commerce OS', sub: 'fractional + продуктивізована система', marks: ['yes', 'yes', 'yes', 'yes', 'yes'], price: '$$', me: true },
];

const COLUMNS = ['Стратегія', 'Виконання', 'Власні активи', 'P&L', 'Система-продукт'];

const DIFFS = [
  { vs: 'На відміну від агенцій', text: 'будуємо активи, а не лише трафік — і відповідаємо за P&L, не за «охоплення».', color: '#EA580C' },
  { vs: 'На відміну від фрилансерів', text: 'приносимо системну методологію та керовану команду, а не одну вузьку послугу.', color: '#5A6472' },
  { vs: 'На відміну від in-house', text: 'працюємо з дня 1 і будуємо систему швидше, ніж наймається й розганяється відділ.', color: '#B45309' },
  { vs: 'На відміну від big consulting', text: 'не лишаємо деку — ведемо виконання руками до вимірюваного результату.', color: '#6D28D9' },
];

function MarkIcon({ mark }: { mark: Mark }) {
  if (mark === 'yes') return <span className="text-[#4D7C0F]">✓</span>;
  if (mark === 'part') return <span className="text-[#B45309]">~</span>;
  return <span className="text-[#5A6472]">×</span>;
}

export function Industries() {
  return (
    <>
      {/* ---- Галузі ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Галузі · Де ми вже давали результат</Eyebrow>
          <SectionTitle>Сім галузей — один метод</SectionTitle>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {INDUSTRIES.map((ind, i) => (
            <FadeIn key={ind.name} delay={i * 0.06}>
              <div className="card card-hover accent-top p-6 h-full" style={{ '--accent': ind.color } as React.CSSProperties}>
                <p className="font-extrabold text-lg">{ind.name}</p>
                <p className="text-[#5A6472] text-xs mt-2 leading-relaxed">{ind.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <p className="text-[#5A6472] text-xs mt-6 max-w-3xl leading-relaxed">
            Commerce OS галузе-незалежний: категорійні поправки калібрують еталони під нішу при
            фіксації baseline у тиждень 1.
          </p>
        </FadeIn>
      </Section>
    </>
  );
}

export function Competitors() {
  return (
    <>
      {/* ---- Конкуренти ---- */}
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Конкуренти · Одна таблиця</Eyebrow>
          <SectionTitle>Чому Commerce OS, а не решта</SectionTitle>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="card mt-10 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#5A6472] text-left">
                  <th className="px-6 py-4 font-medium">Гравець</th>
                  {COLUMNS.map((c) => (
                    <th key={c} className="px-3 py-4 font-medium text-center">
                      {c}
                    </th>
                  ))}
                  <th className="px-6 py-4 font-medium text-right">Модель</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((row) => (
                  <tr
                    key={row.name}
                    className={`border-t border-[#ECEEF0] ${
                      row.me ? 'bg-[rgba(101,163,13,0.07)]' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className={`font-bold ${row.me ? 'text-[#4D7C0F]' : ''}`}>{row.name}</p>
                      <p className="font-mono text-[0.62rem] text-[#5A6472] mt-0.5">{row.sub}</p>
                    </td>
                    {row.marks.map((m, i) => (
                      <td key={i} className="px-3 py-4 text-center font-mono">
                        <MarkIcon mark={m} />
                      </td>
                    ))}
                    <td className={`px-6 py-4 text-right font-mono font-bold ${row.me ? 'text-[#4D7C0F]' : 'text-[#5A6472]'}`}>
                      {row.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-between gap-3 mt-4">
            <p className="text-[#5A6472] text-xs">
              ✓ повністю · ~ частково · × ні. Назви фірм — приклади архетипів; кожна модель має
              свою нішу.
            </p>
            <p className="font-mono text-xs text-[#4D7C0F]">
              Єдиний рядок із усіма ✓ — стратегія + руки + активи + P&amp;L + система.
            </p>
          </div>
        </FadeIn>

        {/* Відмінності */}
        <div className="grid md:grid-cols-2 gap-4 mt-12">
          {DIFFS.map((d, i) => (
            <FadeIn key={d.vs} delay={i * 0.08}>
              <div className="card card-hover accent-left p-6 h-full" style={{ '--accent': d.color } as React.CSSProperties}>
                <p className="font-bold">{d.vs}</p>
                <p className="text-[#5A6472] text-sm mt-1.5 leading-relaxed">{d.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <p className="font-extrabold text-xl mt-10">
            Не швидше й не дешевше — <span className="lime-text underline decoration-2 underline-offset-4">інакше</span>.
          </p>
        </FadeIn>
      </Section>
    </>
  );
}

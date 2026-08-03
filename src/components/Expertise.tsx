import FadeIn from './FadeIn';
import { say, sayIdle } from './speech';
import { Eyebrow, Section, SectionTitle } from './ui';

interface Zone {
  name: string;
  text: string;
  pb: string;
}

interface Cluster {
  label: string;
  color: string;
  zones: Zone[];
}

const CLUSTERS: Cluster[] = [
  {
    label: 'Бренд і клієнтський досвід',
    color: '#DB2777',
    zones: [
      { name: 'Бренд', text: 'Позиціонування, Brand Book, тригери довіри.', pb: 'PB-37 · 46 · 50' },
      { name: 'UX / UI', text: 'Інтерфейси, що продають: картка товару, чекаут, пошук.', pb: 'PB-15 · 40' },
      { name: 'Customer Journey', text: 'CJM: від першого дотику до повторної покупки.', pb: 'PB-02' },
      { name: 'A+ · Rich Content', text: 'Контент карток, що піднімає конверсію на маркетплейсах.', pb: 'PB-23' },
    ],
  },
  {
    label: 'Платформа і розробка',
    color: '#0F9488',
    zones: [
      { name: 'Web-розробка', text: 'SEO-first, mobile-first вітрини: Shopify · Magento · WooCommerce.', pb: 'PB-14 · 16' },
      { name: 'Тестування · юзабіліті', text: 'User-friendly аудит, A/B-тести, швидкість (Core Web Vitals).', pb: 'PB-15 · 17' },
      { name: 'ERP · автоматизація', text: 'Odoo: склад, замовлення, фінанси — єдина система обліку.', pb: 'PB-18 · 19' },
      { name: 'Цілісна екосистема', text: 'Сайт + МП + CRM + ERP + BI без ручної синхронізації.', pb: 'PB-20 · 34' },
    ],
  },
  {
    label: 'Трафік і канали',
    color: '#65A30D',
    zones: [
      { name: 'SEO · AEO · GEO', text: 'Органіка, видимість у AI-пошуку, локальна видача.', pb: 'PB-04 · 05 · 06 · 07' },
      { name: 'PPC / Target', text: 'Performance із порогом ROAS і дисципліною капіталу.', pb: 'PB-36' },
      { name: 'Amazon / Allegro', text: 'Листинги, Brand Registry, Buy Box, експансія в ЄС.', pb: 'PB-21 · 22 · 24' },
      { name: 'Інфлюенсери · UGC', text: 'Лідери думок і користувацький контент у воронці.', pb: 'PB-46 · 51' },
    ],
  },
  {
    label: 'Утримання, дані та AI',
    color: '#6D28D9',
    zones: [
      { name: 'Retention', text: 'Повторні продажі, RFM-сегментація, керування LTV.', pb: 'PB-08 · 09 · 45' },
      { name: 'Email-маркетинг', text: 'Klaviyo-автоматизації: ціль — 30%+ частки виручки.', pb: 'PB-08 · 45' },
      { name: 'Чат-боти · автоматизація', text: 'Сервісні й продажні сценарії, що працюють без людини.', pb: 'PB-33' },
      { name: 'Впровадження AI', text: 'Персоналізація, генерація контенту, автоматизація процесів.', pb: 'PB-32 · 54 · 55 · 56' },
      { name: 'Аналітика · дашборди', text: 'GA4 + BI: P&L у реальному часі, наскрізна атрибуція.', pb: 'PB-10 · 53' },
    ],
  },
];

export default function Expertise() {
  return (
    <>
      <Section className="grid-bg">
        <div className="glow-lime w-[420px] h-[420px] -top-24 -right-32" />
        <FadeIn>
          <Eyebrow>Експертиза · З чим саме працюємо</Eyebrow>
          <SectionTitle>
            17 напрямів —{' '}
            <span className="font-pixel text-[0.8em] text-[#65A30D] inline-block align-baseline leading-none">
              одна система
            </span>
          </SectionTitle>
          <p className="text-[#5A6472] mt-4 max-w-3xl leading-relaxed">
            Кожен напрям — це домен Commerce OS із власними плейбуками, метриками та DoD. Порядок
            підключення диктують залежності, а не бажання: без аналітики не працює retention, без
            ERP не масштабуються канали.
          </p>
        </FadeIn>

        <div className="flex flex-col gap-12 mt-14">
          {CLUSTERS.map((cluster, ci) => (
            <FadeIn key={cluster.label} delay={ci * 0.06}>
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="w-2.5 h-2.5 rotate-45"
                  style={{ background: cluster.color, boxShadow: `0 0 12px ${cluster.color}80` }}
                />
                <h3 className="font-pixel text-[0.6rem] uppercase tracking-wider" style={{ color: cluster.color }}>
                  {cluster.label}
                </h3>
                <span className="flex-1 h-px bg-white/10" />
                <span className="font-mono text-[0.62rem] text-[#66707E]">
                  {String(cluster.zones.length).padStart(2, '0')}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cluster.zones.map((z) => (
                  <div
                    key={z.name}
                    onMouseEnter={() => say(`${z.name}: ${z.text} Працюємо за плейбуками ${z.pb}.`)}
                    onMouseLeave={sayIdle}
                    className="card card-hover accent-top p-5 h-full flex flex-col"
                    style={{ '--accent': cluster.color } as React.CSSProperties}
                  >
                    <p className="font-extrabold text-base leading-snug">{z.name}</p>
                    <p className="text-[#5A6472] text-xs mt-2 leading-relaxed flex-1">{z.text}</p>
                    <p className="font-mono text-[0.58rem] mt-4" style={{ color: cluster.color }}>
                      {z.pb}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="card p-5 mt-12 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            <span className="font-pixel text-[0.5rem] uppercase text-[#65A30D]">Не меню послуг</span>
            <span className="text-[#3F4854] text-sm">
              Напрями не продаються поодинці — вони підключаються за дорожньою картою, коли
              діагностика показує розрив у грошах саме там.
            </span>
          </div>
        </FadeIn>
      </Section>
    </>
  );
}

/**
 * Четыре тира полноты входных данных. Аудитор работает на любом тире по одной
 * методологии Commerce OS: с ростом тира не переделывает выводы заново, а
 * уточняет ячейки и повышает уверенность (закон метода «факт вместо оценки»).
 */
export type Tier = 0 | 1 | 2 | 3 | 4;

export type TierSpec = {
  tier: Tier;
  title: string;
  inputs: string;
  methodLayer: string;
  baseConfidence: number; // 0..100 — потолок уверенности выводов на этом тире
  covert: boolean; // подходит для негласного аудита
};

export const TIERS: Record<Tier, TierSpec> = {
  0: {
    tier: 0,
    title: 'Pre-launch — сайта ещё нет / в разработке',
    inputs: 'бриф проекта, конкуренты, макеты (Figma), ниша',
    methodLayer: 'Предзапуск — концепция против рынка, go-to-market',
    baseConfidence: 35,
    covert: false,
  },
  1: {
    tier: 1,
    title: 'Только сайт клиента + вольный запрос',
    inputs: 'ссылка(и) на сайт клиента, необязательный текст запроса',
    methodLayer: 'L0 — полный внешний обход без доступов',
    baseConfidence: 30,
    covert: true,
  },
  2: {
    tier: 2,
    title: 'Сайты клиента и конкурентов + частичные ответы',
    inputs: 'сайты клиента и конкурентов, частичные ответы на вопросы',
    methodLayer: 'L0 + начало L1',
    baseConfidence: 50,
    covert: false,
  },
  3: {
    tier: 3,
    title: '80%+ запрошенной информации (ответы, выгрузки, скрины)',
    inputs: 'ответы на опросник, файлы-выгрузки, скриншоты отчётов из аналитики и сервисов',
    methodLayer: 'L1–L2 по выгрузкам',
    baseConfidence: 75,
    covert: false,
  },
  4: {
    tier: 4,
    title: 'Открытые живые доступы',
    inputs: 'доступы к GA4/CRM/рекламным кабинетам/админке',
    methodLayer: 'L1–L3 полный, baseline из систем',
    baseConfidence: 90,
    covert: false,
  },
};

/** Что реально сделать автономно на данном тире (для оркестратора). */
export type Capabilities = {
  crawlClient: boolean;
  crawlCompetitors: boolean;
  useAnswers: boolean;
  useUploads: boolean;
  liveConnectors: boolean;
};

export function capabilitiesFor(tier: Tier): Capabilities {
  return {
    crawlClient: tier >= 1, // на T0 сайта ещё нет — обходить нечего
    crawlCompetitors: tier === 0 || tier >= 2, // на предзапуске конкуренты обязательны
    useAnswers: tier >= 2,
    useUploads: tier >= 3,
    liveConnectors: tier >= 4,
  };
}

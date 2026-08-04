/**
 * Методология Commerce OS: матрица зрелости (18 доменов, веса = 100)
 * и критические разрывы CG с штрафами. Health Score = 0.6×A + 0.4×B.
 */

export type MaturityDomain = { domain: string; weight: number; sheets: string[] };

export const MATURITY_DOMAINS: MaturityDomain[] = [
  { domain: 'Strategy', weight: 6, sheets: ['10', '11', '12'] },
  { domain: 'Product', weight: 5, sheets: ['13', '30'] },
  { domain: 'Customer', weight: 5, sheets: ['14', '35'] },
  { domain: 'Brand', weight: 6, sheets: ['16', '17', '18', '19'] },
  { domain: 'Sales', weight: 8, sheets: ['20'] },
  { domain: 'Marketing', weight: 7, sheets: ['21'] },
  { domain: 'SEO', weight: 6, sheets: ['22'] },
  { domain: 'CRM', weight: 8, sheets: ['23'] },
  { domain: 'Analytics', weight: 7, sheets: ['24'] },
  { domain: 'Pricing', weight: 3, sheets: ['25'] },
  { domain: 'Platform', weight: 6, sheets: ['28'] },
  { domain: 'Operations', weight: 8, sheets: ['29'] },
  { domain: 'Marketplace', weight: 4, sheets: ['26'] },
  { domain: 'International', weight: 3, sheets: ['27'] },
  { domain: 'Finance', weight: 7, sheets: ['31'] },
  { domain: 'People', weight: 5, sheets: ['32'] },
  { domain: 'AI', weight: 2, sheets: ['33'] },
  { domain: 'Governance', weight: 4, sheets: ['34'] },
];

export type CriticalGap = { id: string; label: string; penalty: number; qids: string[] };

/** Разрыв фиксируется, если хотя бы один из вопросов отвечен «Нет». */
export const CRITICAL_GAPS: CriticalGap[] = [
  { id: 'CG-01', label: 'Нет единого источника правды по данным', penalty: 10, qids: ['AN-003'] },
  { id: 'CG-02', label: 'Не считается юнит-экономика', penalty: 10, qids: ['FI-002'] },
  { id: 'CG-03', label: 'Нет сегментации базы / retention-контура', penalty: 8, qids: ['CR-004'] },
  { id: 'CG-04', label: 'Нет системной работы с SEO', penalty: 6, qids: ['SE-002'] },
  { id: 'CG-06', label: 'Нет единого источника товарных данных (PIM)', penalty: 5, qids: ['PD-012'] },
  { id: 'CG-07', label: 'Нет управленческого P&L', penalty: 7, qids: ['FI-001'] },
  { id: 'CG-09', label: 'Value Proposition не сформулировано', penalty: 5, qids: ['PX-013'] },
  { id: 'CG-12', label: 'Позиционирование не зафиксировано', penalty: 4, qids: ['MK-017'] },
  { id: 'CG-13', label: 'Нет бренд-бука и гайдлайнов', penalty: 3, qids: ['BR-025'] },
  { id: 'CG-14', label: 'Не измеряются NPS / CSAT', penalty: 3, qids: ['CU-011', 'CR-015', 'CU-012'] },
  { id: 'CG-16', label: 'Нет резервного копирования', penalty: 4, qids: ['PL-009'] },
  { id: 'CG-17', label: 'Нет прогнозирования спроса', penalty: 4, qids: ['AI-123'] },
  { id: 'CG-18', label: 'Нет промо-календаря и правил скидок', penalty: 4, qids: ['PR-006'] },
  { id: 'CG-19', label: 'Не представлены на маркетплейсах', penalty: 3, qids: ['MP-001'] },
  { id: 'CG-21', label: 'Нет юрлица в ЕС при продажах в ЕС', penalty: 6, qids: ['IN-020'] },
  { id: 'CG-22', label: 'Нет соответствия GDPR', penalty: 5, qids: ['CR-018', 'IN-080'] },
  { id: 'CG-23', label: 'Нет политики использования AI', penalty: 3, qids: ['AI-007', 'AI-112'] },
  { id: 'CG-28', label: 'Нет сценарного финансового моделирования', penalty: 3, qids: ['FI-124'] },
];

export const SCORE_BANDS = [
  { min: 80, label: 'Зрелая система', action: 'Масштабирование и новые рынки' },
  { min: 60, label: 'Управляемый бизнес, точки роста локальны', action: 'Точечные плейбуки, а не программа' },
  { min: 40, label: 'Работающий бизнес без управляемости', action: 'Классическая трансформация: фундамент и рычаги параллельно' },
  { min: 0, label: 'Системные пробелы в фундаменте', action: 'Начинаем с данных и финансов, рычаги роста не трогаем' },
];

export const bandFor = (score: number) => SCORE_BANDS.find((b) => score >= b.min)!;

/* Бриф собственника (discovery_brief) — спец-ID ответов */
export const BRIEF_TRIED_QID = 'BRIEF-TRIED';
export const BRIEF_TEAM_QID = 'BRIEF-TEAM';
export const BRIEF_AMBITION_QID = 'BRIEF-AMBITION';

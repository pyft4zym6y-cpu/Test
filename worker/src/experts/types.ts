/**
 * ПРЕМИУМ-ЭКСПЕРТИЗА — инфраструктура подключения внешних профильных AI-агентов.
 *
 * Это НЕ базовый аудит: отдельная опция (тумблер в веб-интерфейсе), которая поверх
 * готовых отчётов подключает внешних специализированных агентов, чтобы ПЕРЕПРОВЕРИТЬ,
 * ДОПОЛНИТЬ и УГЛУБИТЬ находки — больше глубины, экспертизы и детализации.
 *
 * Каждый агент реализует общий интерфейс Expert и:
 *  - отдаёт НОВЫЕ находки (FindingInput[]) — вливаются в единый реестр с общим ID;
 *  - отдаёт ПЕРЕПРОВЕРКИ (Verification[]) существующих находок (подтвердил/опроверг/
 *    уточнил) — корректирует уверенность и приоритет в реестре;
 *  - честно СКИПАЕТСЯ, если нет ключа/доступа (ran:false + причина), не роняя прогон.
 */
import type { FindingInput, Finding } from '../registry.js';
import type { AuditDataset } from '../report.js';

export type ExpertDomain = 'seo' | 'geo' | 'ads' | 'competitors' | 'reputation' | 'tech' | 'content' | 'cro' | 'qa';
export type ExpertProvider = 'mcp' | 'http' | 'skill' | 'builtin';
export type ExpertStatus = 'available' | 'needs-auth' | 'planned';

/** Карточка агента для каталога (перечень в веб-интерфейсе). */
export type ExpertCard = {
  id: string;
  name: string;
  domain: ExpertDomain;
  what: string;                 // что делает — одной фразой для клиента/оператора
  provider: ExpertProvider;
  credEnv?: string;             // имя env-переменной с ключом/доступом (если нужна)
  status: ExpertStatus;         // available (готов) / needs-auth (нужен доступ) / planned
  strengthens: string[];        // какие отчёты усиливает
};

/** Контекст, который получает агент: датасет + уже собранный базовый реестр. */
export type ExpertContext = {
  dataset: AuditDataset;
  baseFindings: Finding[];      // базовый реестр — агент может его перепроверять
  log: (m: string) => void;
};

/** Перепроверка существующей находки внешним агентом. */
export type Verification = {
  by: string;                   // id агента
  targetKey?: string;           // семантический key находки (предпочтительно)
  targetId?: string;            // либо прямой ID
  verdict: 'подтверждено' | 'опровергнуто' | 'уточнено';
  confidenceDelta?: number;     // корректировка уверенности, -1..+1
  note: string;
};

/** Результат работы агента. */
export type ExpertResult = {
  expertId: string;
  name: string;
  domain: ExpertDomain;
  ran: boolean;
  skippedReason?: string;       // почему не запущен (нет ключа/недоступен/planned)
  findings: FindingInput[];     // новые/углублённые находки
  verifications: Verification[];// перепроверки базовых находок
  summary: string;              // что агент сделал — одной фразой
};

/** Единый интерфейс внешнего агента. */
export type Expert = {
  card: ExpertCard;
  /** Доступен ли к запуску в текущем окружении (ключ/доступ на месте). */
  isAvailable: (env: NodeJS.ProcessEnv) => boolean;
  run: (ctx: ExpertContext) => Promise<ExpertResult>;
};

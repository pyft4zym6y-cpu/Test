/**
 * Батарея гейтов качества — то, что решает, выпускать ли пакет клиенту.
 *
 * Главная проверка здесь не «гейт срабатывает правильно», а более грубая:
 * КАЖДЫЙ гейт вообще способен упасть. За этот аудит нашлось пять проверок,
 * которые не могли сработать никогда:
 *   · coverage.failed  — modulesFailed приходил пустым литералом;
 *   · data.reachable   — reachabilityPassed передавался как !prelaunch, то есть
 *                        условие сводилось к `prelaunch || !prelaunch`;
 *   · coverage.modules — expectedModules не передавался, `[].length === 0`;
 *   · ai.ars           — без порога условие было `null == null`;
 *   · money.invariantOk — вклады телескопируются по построению.
 * Все они выглядели в отчёте как пройденные гейты. Проверка, которая не может
 * провалиться, хуже отсутствующей: она выдаёт зелёную строку под непроверенным
 * утверждением.
 */
import { describe, it, expect } from 'vitest';
import { runMetaAudit, type MetaAuditContext } from '../metaaudit.js';
import type { Finding } from '../registry.js';

const finding = (o: Partial<Finding> = {}): Finding => ({
  id: 'F1', domain: 'website', key: 'k1', title: 'Находка', priority: 'P1',
  confidence: 0.9, revenueExposure: 1000, priorityScore: 10,
  evidence: { url: 'https://x.ua/' },
  ...o,
} as Finding);

const quality = (evidenceCoverage = 0.9) => ({
  ars: { provisional: 80, measuredWeight: 0.5, components: { evidenceCoverage } },
  evidenceDebt: { full: 1, partial: 0, hypothesis: 0, debtRatio: 0, total: 1 },
} as unknown as MetaAuditContext['quality']);

/** Здоровый прогон: все гейты обязаны проходить. */
const healthy = (o: Partial<MetaAuditContext> = {}): MetaAuditContext => ({
  tier: 2, prelaunch: false, findings: [finding()], quality: quality(),
  reachabilityPassed: true, pagesCrawled: 12,
  modulesExecuted: ['uxui', 'seoflow'], modulesFailed: [],
  reportFiles: ['Презентація.pdf', 'Сводный-бэклог.pdf', 'Протокол-синергии-QA-A0.pdf'],
  requiredReports: ['Презентація', 'Сводный-бэклог', 'Протокол-синергии'],
  methodologyVersion: 'v3', evidenceCoverageTarget: 0.6,
  ...o,
});

const ids = (ctx: MetaAuditContext) => runMetaAudit(ctx).gates.flatMap((g) => g.checks);
const check = (ctx: MetaAuditContext, id: string) => ids(ctx).find((c) => c.id === id);

describe('здоровый прогон', () => {
  it('выпускается без блокеров', () => {
    const r = runMetaAudit(healthy());
    expect(r.blockers).toEqual([]);
    expect(r.decision).not.toBe('BLOCK');
  });
});

describe('каждый гейт способен упасть', () => {
  it('data.reachable — недостижимый сайт вне prelaunch блокирует выдачу', () => {
    // Именно этого гейт не мог сделать: ему передавали !prelaunch.
    const c = check(healthy({ reachabilityPassed: false }), 'data.reachable');
    expect(c?.pass).toBe(false);
    expect(c?.severity).toBe('critical');
    expect(runMetaAudit(healthy({ reachabilityPassed: false })).decision).toBe('BLOCK');
  });

  it('data.pages — нулевой обход вне prelaunch блокирует', () => {
    expect(check(healthy({ pagesCrawled: 0 }), 'data.pages')?.pass).toBe(false);
  });

  it('coverage.failed — упавшие модули видны', () => {
    const c = check(healthy({ modulesFailed: ['seoflow', 'croflow'] }), 'coverage.failed');
    expect(c?.pass).toBe(false);
    expect(c?.detail).toMatch(/seoflow/);
  });

  it('coverage.failed — больше трёх падений это уже critical', () => {
    const c = check(healthy({ modulesFailed: ['a', 'b', 'c', 'd'] }), 'coverage.failed');
    expect(c?.severity).toBe('critical');
  });

  it('coverage.modules — появляется только когда есть с чем сверять', () => {
    // Без expectedModules проверка сводилась к `[].length === 0` и всегда
    // висела зелёной. Теперь её просто нет, а не «пройдена».
    expect(check(healthy(), 'coverage.modules')).toBeUndefined();
    const c = check(healthy({ expectedModules: ['uxui', 'seoflow', 'geoflow'] }), 'coverage.modules');
    expect(c?.pass).toBe(false);
    expect(c?.detail).toMatch(/geoflow/);
  });

  it('evidence.p0-backed — P0 без доказательства блокирует', () => {
    const bare = finding({ id: 'F2', priority: 'P0', evidence: undefined });
    const c = check(healthy({ findings: [finding(), bare] }), 'evidence.p0-backed');
    expect(c?.pass).toBe(false);
    expect(c?.severity).toBe('critical');
  });

  it('evidence.coverage — падает ниже порога', () => {
    expect(check(healthy({ quality: quality(0.2) }), 'evidence.coverage')?.pass).toBe(false);
  });

  it('evidence.coverage — совсем без доказательств это critical, а не warn', () => {
    expect(check(healthy({ quality: quality(0.1) }), 'evidence.coverage')?.severity).toBe('critical');
    expect(check(healthy({ quality: quality(0.5) }), 'evidence.coverage')?.severity).toBe('warn');
  });

  it('consistency.unique-ids — дубликат ID блокирует', () => {
    const c = check(healthy({ findings: [finding(), finding()] }), 'consistency.unique-ids');
    expect(c?.pass).toBe(false);
  });

  it('economic.no-nan — NaN в деньгах блокирует', () => {
    const bad = finding({ id: 'F3', revenueExposure: NaN });
    const c = check(healthy({ findings: [bad] }), 'economic.no-nan');
    expect(c?.pass).toBe(false);
    expect(c?.severity).toBe('critical');
  });

  it('economic.exposure-sane — сумма выше потенциала предупреждает', () => {
    const big = finding({ id: 'F4', revenueExposure: 10_000_000 });
    const c = check(healthy({ findings: [big], money: { potentialYear: 100_000 } }), 'economic.exposure-sane');
    expect(c?.pass).toBe(false);
  });

  it('presentation.has — отсутствующий обязательный отчёт виден', () => {
    const c = check(healthy({ reportFiles: ['Сводный-бэклог.pdf'] }), 'presentation.has:Презентація');
    expect(c?.pass).toBe(false);
  });

  it('methodology.version — непроставленная версия предупреждает', () => {
    expect(check(healthy({ methodologyVersion: null }), 'methodology.version')?.pass).toBe(false);
  });

  it('ai.no-fabricated-money — измеренные деньги на низком тире предупреждают', () => {
    // На T1–T2 доступов к системам клиента ещё нет: точная сумма в находке
    // взяться неоткуда, значит модель её выдумала.
    const fabricated = finding({
      id: 'F5', title: 'Потери составляют 450000 грн из-за брошенных корзин',
      as_is: 'Измерено: 450000 грн потерь в год',
    } as never);
    const c = check(healthy({ tier: 1, findings: [fabricated] }), 'ai.no-fabricated-money');
    expect(c?.pass).toBe(false);
  });

  it('ai.no-fabricated-money — на высоком тире те же цифры допустимы: данные есть', () => {
    const measured = finding({
      id: 'F6', title: 'Потери составляют 450000 грн из-за брошенных корзин',
      as_is: 'Измерено: 450000 грн потерь в год',
    } as never);
    expect(check(healthy({ tier: 3, findings: [measured] }), 'ai.no-fabricated-money')?.pass).toBe(true);
  });

  it('ai.ars — с порогом это гейт, без порога только строка отчёта', () => {
    expect(check(healthy(), 'ai.ars')?.severity).toBe('info');
    const c = check(healthy({ arsTarget: 90 }), 'ai.ars');
    expect(c?.severity).toBe('warn');
    expect(c?.pass).toBe(false);   // provisional ARS 80 < 90
  });
});

describe('ни один гейт не «зелёный по построению»', () => {
  it('в здоровом прогоне нет проверок, чей detail признаётся невыполнимым', () => {
    // Грубая, но действенная сеть: каждая НЕ-info проверка здорового прогона
    // должна иметь выше по тесту сценарий, где она падает. Держим список явно,
    // чтобы новый гейт нельзя было добавить молча.
    const gated = ids(healthy()).filter((c) => c.severity !== 'info').map((c) => c.id).sort();
    expect(gated).toEqual([
      'consistency.no-cycles',
      'consistency.severity-evidence',
      'consistency.unique-ids',
      'coverage.failed',
      'coverage.findings',
      'data.pages',
      'data.reachable',
      'economic.exposure-sane',
      'economic.no-nan',
      'evidence.coverage',
      'evidence.p0-backed',
      'ai.no-fabricated-money',
      'methodology.version',
      'presentation.has:Презентація',
      'presentation.has:Сводный-бэклог',
      'presentation.has:Протокол-синергии',
    ].sort());
  });
});

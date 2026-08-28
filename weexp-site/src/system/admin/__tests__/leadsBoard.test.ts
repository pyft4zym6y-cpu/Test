/**
 * Воронка заявок: пʼять стадій і ОКРЕМИЙ вимір «тип роботи».
 *
 * Було шість стадій, серед них «Завершена» — слово, яке читалось і як
 * «виграли», і як «закрили»; а тип співпраці («Аудит», «Консалтинг»…) лежав
 * поруч зі стадіями, ніби це теж крок воронки. Два різні питання — «де заявка
 * в процесі» і «про що вона» — доводилось вибирати одне замість іншого.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEAD_STAGES, LEAD_COLUMNS, COOP_TYPES, coopOf, coopLabel, stageOf, stageView } from '../shared';
import type { LeadRow } from '@/lib/supa';

const lead = (p: Partial<LeadRow> = {}): LeadRow => ({ id: 'l', email: 'a@b.c', status: 'new', ...p });
const panel = readFileSync(join(__dirname, '..', '..', 'AdminPanel.tsx'), 'utf8');

describe('стадії заявки', () => {
  it('рівно пʼять, у погодженому порядку', () => {
    expect(LEAD_STAGES.map((s) => s.l)).toEqual([
      'Нова заявка', 'Кваліфікована', 'Некваліфікована', 'В роботі', 'Архів',
    ]);
  });

  it('«Завершена» стадією більше не є', () => {
    expect(LEAD_STAGES.map((s) => s.k)).not.toContain('done');
  });

  it('легасі-статуси зводяться до чинних, а не зникають із дошки', () => {
    expect(stageOf(lead({ status: 'done' }))).toBe('archive');
    expect(stageOf(lead({ status: 'won' }))).toBe('archive');
    expect(stageOf(lead({ status: 'lost' }))).toBe('unqualified');
    expect(stageOf(lead({ status: 'proposal' }))).toBe('progress');
  });

  it('колонка «конвертована» є на дошці, але не серед стадій, які ставлять вручну', () => {
    expect(LEAD_COLUMNS.map((s) => s.k)).toContain('converted');
    expect(LEAD_STAGES.map((s) => s.k)).not.toContain('converted');
    expect(stageView(lead({ status: 'progress', deal: { projectId: 'pr_1' } }))).toBe('converted');
  });
});

describe('тип роботи — інший вимір', () => {
  it('чотири типи в погодженому складі', () => {
    expect(COOP_TYPES.map((c) => c.l)).toEqual([
      'Безкоштовний аудит', 'Глибокий аудит', 'Консалтинг', 'Повний супровід',
    ]);
  });

  it('жоден тип не є стадією і навпаки', () => {
    const stages = new Set<string>(LEAD_COLUMNS.map((s) => String(s.k)));
    for (const c of COOP_TYPES) expect(stages.has(c.k), c.k).toBe(false);
  });

  it('старі ключі читаються, а не показуються сирими', () => {
    expect(coopOf('audit')).toBe('deep');
    expect(coopLabel('audit')).toBe('Глибокий аудит');
    // 'other' означав «типу немає» — і має читатись як порожнеча, а не як тип.
    expect(coopOf('other')).toBe('');
    expect(coopLabel('other')).toBe('');
    expect(coopLabel(undefined)).toBe('');
  });
});

describe('дошка', () => {
  it('заявки й типи стоять в одній панелі, а не двома блоками', () => {
    expect(panel).toMatch(/adm-panel adm-crm/);
    expect(panel).toMatch(/adm-crm-cats/);
    expect(panel).toMatch(/Тип роботи/);
  });

  it('картку можна перетягнути між стадіями', () => {
    expect(panel).toMatch(/draggable=\{droppable\}/);
    expect(panel).toMatch(/onDrop=/);
    expect(panel).toMatch(/moveLead\(dragId/);
  });

  it('у «конвертовану» перетягнути не можна — вона виводиться з проєкту', () => {
    expect(panel).toMatch(/const droppable = s\.k !== 'converted'/);
  });

  it('перетягування не лишається єдиним способом: кнопки стадій у картці на місці', () => {
    // drag недоступний з клавіатури; єдиний drag закрив би розділ для тих,
    // хто мишею не працює.
    const card = readFileSync(join(__dirname, '..', 'LeadDetail.tsx'), 'utf8');
    expect(card).toMatch(/LEAD_STAGES\.map/);
    expect(card).toMatch(/onStatus\(lead\.id \|\| '', s\.k\)/);
  });

  it('картка на дошці показує і стадію, і тип роботи', () => {
    expect(panel).toMatch(/adm-lead-tags/);
    expect(panel).toMatch(/coopLabel\(l\.deal\?\.coopType\)/);
  });
});

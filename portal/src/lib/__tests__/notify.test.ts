import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// checkMilestones молчит в DEMO, а DEMO включается отсутствием ключей Supabase.
vi.mock('../supabase', () => ({ DEMO: false }));

import { checkMilestones, NOTIFY_QID, type MilestoneCtx } from '../notify';
import type { AnswerRow } from '../supabase';

const ctx = (over: Partial<MilestoneCtx> = {}): MilestoneCtx => ({
  clientName: 'Тест', companyDone: true, goalsDone: true, painsDone: true,
  surveyPct: 0, keyAccessGranted: false, decisionDone: false, ...over,
});
const rows = (sent: string[] = []): Record<string, AnswerRow> => ({
  [NOTIFY_QID]: { client_id: 'c', question_id: NOTIFY_QID, answer: JSON.stringify(sent), facts: null, updated_by: null },
});

beforeEach(() => vi.stubGlobal('window', { location: { origin: 'https://portal' } }));
afterEach(() => vi.unstubAllGlobals());

describe('вехи → письмо консультанту', () => {
  it('веха уходит один раз и помечается отправленной', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    expect(await checkMilestones(ctx(), rows())).toEqual(['intro']);
    expect(await checkMilestones(ctx(), rows(['intro']))).toBeNull();
  });

  /*
   * Дедупликация помечала отправленным всё, что попало в fresh, независимо от
   * исхода: catch глотал сетевую ошибку, ответ 500 не проверялся вовсе. Ключ
   * уходил в NOTIFY-SENT, и обещание комментария «веха уйдёт при следующем
   * заходе» не выполнялось никогда — при следующем заходе она уже числилась
   * отправленной.
   */
  it('упавшая сеть не помечает веху отправленной', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await checkMilestones(ctx(), rows())).toBeNull();
  });

  it('ответ 500 от /api/notify — тоже не отправка', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    expect(await checkMilestones(ctx(), rows())).toBeNull();
  });

  it('из нескольких вех помечаются только доставленные', async () => {
    let call = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => ({ ok: ++call === 1 })));
    // intro + survey25 + survey60 срабатывают разом; доставлена только первая
    const out = await checkMilestones(ctx({ surveyPct: 70 }), rows());
    expect(out).toEqual(['intro']);
  });

  it('битый NOTIFY-SENT не роняет проверку', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const broken = { [NOTIFY_QID]: { client_id: 'c', question_id: NOTIFY_QID, answer: '{не json', facts: null, updated_by: null } };
    expect(await checkMilestones(ctx(), broken as any)).toEqual(['intro']);
  });
});

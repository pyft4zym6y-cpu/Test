/**
 * Сколько документов мы обещаем в пакете.
 *
 * PACK_DOC_COUNT складывал отчёты, тома И 13 аудитов, получая 24. Но аудиты —
 * не отдельные документы, а главы d01–d13 диагностического отчёта: каждый
 * считался дважды. Константа никуда не выводилась, так что клиент видел
 * правильные 11, — но число с неверным комментарием в экспорте ждёт того, кто
 * возьмёт его для лендинга или коммерческого предложения. В продаже это
 * завышенная обещание, на сдаче — недостача тринадцати файлов.
 */
import { describe, it, expect } from 'vitest';
import { PACK_REPORTS, PACK_VOLUMES, PACK_AUDITS, PACK_CHAPTERS, PACK_DOC_COUNT } from '../auditPack';

describe('PACK_DOC_COUNT', () => {
  it('считает только то, что клиент получает файлами', () => {
    expect(PACK_DOC_COUNT).toBe(PACK_REPORTS.length + PACK_VOLUMES.length);
  });

  it('аудиты в счёт документов не входят — они главы отчёта', () => {
    expect(PACK_DOC_COUNT).toBeLessThan(
      PACK_REPORTS.length + PACK_VOLUMES.length + PACK_AUDITS.length,
    );
  });

  it('каждый из 13 аудитов действительно присутствует главой', () => {
    // Если аудит не стал главой — он и правда отдельный документ, и тогда
    // счёт выше неверен. Проверяем связь, а не верим комментарию.
    const chapterIds = new Set(PACK_CHAPTERS.filter((c) => /^d\d\d$/.test(c.id)).map((c) => c.id));
    expect(chapterIds.size).toBe(PACK_AUDITS.length);
  });

  it('главы аудитов лежат в диагностическом отчёте, а не разбросаны', () => {
    const audits = PACK_CHAPTERS.filter((c) => /^d\d\d$/.test(c.id));
    expect(new Set(audits.map((c) => c.report))).toEqual(new Set(['r2']));
  });

  it('коды аудитов уникальны', () => {
    const codes = PACK_AUDITS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

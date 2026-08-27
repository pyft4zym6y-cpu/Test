/**
 * Вивантаження всіх даних клієнта одним файлом.
 *
 * Досі віддати клієнту його дані було нічим: є експорт PDF документа аудиту —
 * і все. Це потрібно у двох різних ситуаціях, і вони не збігаються.
 *
 * Перша — запит клієнта на його дані (GDPR, ст. 20: право на переносимість).
 * Там потрібен машинозчитуваний формат і ВСЕ, що ми про людину зберігаємо.
 *
 * Друга — знімок ПЕРЕД ризикованою правкою. Менеджер збирається чистити
 * доступи або переносити проєкт; якщо щось піде не так, `admin_events` покаже,
 * ЩО сталось, але не поверне вміст. Знімок повертає.
 *
 * Тому два режими. `full` — усе як є, для клієнта. `snapshot` — те саме, але
 * без внутрішнього шару (нотатки команди, оцінки, файли аудитора): це наші
 * робочі матеріали, і в руки клієнта вони не йдуть.
 */
import type { AdminRow, DiagRecord } from '@/lib/supa';

export type ExportMode = 'full' | 'client';

/** Внутрішній шар: усе, що команда пише про клієнта, а не для клієнта. */
const INTERNAL_KEYS: (keyof DiagRecord)[] = [
  'notes', 'assessment', 'adminFiles', 'findingReviews', 'pmDir', 'deepModeration', 'packChecklist',
];

export type ClientExport = {
  meta: {
    exportedAt: string;
    mode: ExportMode;
    userId: string;
    email: string;
    company?: string;
    /** Що саме НЕ увійшло — щоб отримувач не гадав, чи це все. */
    excluded: string[];
    note: string;
  };
  record: DiagRecord;
};

export function buildClientExport(row: AdminRow, mode: ExportMode): ClientExport {
  const rec: DiagRecord = { ...(row.record || {}) };
  const excluded: string[] = [];
  if (mode === 'client') {
    for (const k of INTERNAL_KEYS) {
      if (rec[k] !== undefined) { delete rec[k]; excluded.push(String(k)); }
    }
  }
  return {
    meta: {
      exportedAt: new Date().toISOString(),
      mode,
      userId: row.userId,
      email: row.email,
      company: row.record?.company?.name,
      excluded,
      note: mode === 'client'
        ? 'Дані клієнта у машинозчитуваному вигляді. Внутрішні матеріали команди (нотатки, оцінки, файли аудитора) виключені — вони не є даними клієнта.'
        : 'Повний знімок запису, включно з внутрішнім шаром. Не передавати клієнту: тут є наші робочі оцінки й нотатки.',
    },
    record: rec,
  };
}

/** Безпечне імʼя файлу: пошта містить крапку й @, а Windows не любить обидва. */
export function exportFileName(row: AdminRow, mode: ExportMode): string {
  const who = (row.record?.company?.name || row.email || row.userId)
    .toLowerCase().replace(/[^a-zа-яїієґ0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40) || 'client';
  return `weexp-${who}-${mode}-${new Date().toISOString().slice(0, 10)}.json`;
}

/**
 * Віддати файл у браузері. Через Blob, а не data:-URL: запис клієнта з історією
 * прогонів легко переростає ліміт довжини URL, і data: тихо обрізався б.
 */
export function downloadClientExport(row: AdminRow, mode: ExportMode): void {
  const payload = buildClientExport(row, mode);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName(row, mode);
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Відкликаємо не одразу: Safari встигає почати завантаження вже після кліку.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

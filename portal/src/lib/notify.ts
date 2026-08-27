import { DEMO } from './supabase';
import type { AnswerRow } from './supabase';

/**
 * Уведомления консультанту о вехах клиента. Отправка — через /api/notify
 * (Resend); дедупликация — спец-ответ NOTIFY-SENT в answers самого клиента,
 * так что каждая веха уходит письмом ровно один раз.
 */

export const NOTIFY_QID = 'NOTIFY-SENT';

export type MilestoneCtx = {
  clientName: string;
  companyDone: boolean;
  goalsDone: boolean;
  painsDone: boolean;
  surveyPct: number;
  keyAccessGranted: boolean; // AC-01 или AC-13 выданы
  decisionDone: boolean;
};

const MILESTONES: { key: string; when: (c: MilestoneCtx) => boolean; text: (c: MilestoneCtx) => string }[] = [
  {
    key: 'intro',
    when: (c) => c.companyDone && c.goalsDone && c.painsDone,
    text: (c) => `«${c.clientName}» прошёл вводные: компания, цели и боли заполнены. По SLA — просмотр и комментарий в течение 1 рабочего дня.`,
  },
  {
    key: 'survey25',
    when: (c) => c.surveyPct >= 25,
    text: (c) => `«${c.clientName}» заполнил опросник на ${c.surveyPct}% — предварительный отчёт уже собирается.`,
  },
  {
    key: 'survey60',
    when: (c) => c.surveyPct >= 60,
    text: (c) => `«${c.clientName}» заполнил опросник на ${c.surveyPct}%. По SLA — разбор, baseline и черновик резюме в течение 3 рабочих дней.`,
  },
  {
    key: 'access',
    when: (c) => c.keyAccessGranted,
    text: (c) => `«${c.clientName}» выдал ключевой доступ (GA4 или выгрузка заказов) — можно фиксировать baseline и считать деньги.`,
  },
  {
    key: 'decision',
    when: (c) => c.decisionDone,
    text: (c) => `«${c.clientName}» заполнил «Решение и команда»: бриф ЛПР, рамки бюджета и паспорт команды готовы.`,
  },
];

/**
 * Проверяет вехи и шлёт письма о новых. Возвращает обновлённый список
 * отправленных ключей (сохранить в NOTIFY-SENT) или null, если ничего нового.
 */
export async function checkMilestones(
  ctx: MilestoneCtx,
  rows: Record<string, AnswerRow>,
): Promise<string[] | null> {
  if (DEMO) return null; // в демо не шлём
  let sent: string[] = [];
  try {
    sent = JSON.parse(rows[NOTIFY_QID]?.answer ?? '[]');
  } catch { /* noop */ }
  const fresh = MILESTONES.filter((m) => !sent.includes(m.key) && m.when(ctx));
  if (!fresh.length) return null;
  /*
   * Дедупликация помечала отправленным ВСЁ, что попало в fresh, независимо от
   * исхода запроса: catch глотал сетевую ошибку, ответ 500 от /api/notify не
   * проверялся вовсе, а ключ всё равно уходил в NOTIFY-SENT. Комментарий
   * обещал «веха уйдёт при следующем заходе» — на деле она не уходила никогда:
   * при следующем заходе ключ уже числился в отправленных. Помечаем только то,
   * что действительно ушло.
   */
  const delivered: string[] = [];
  for (const m of fresh) {
    try {
      const r = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Discovery · ${ctx.clientName}: ${m.key === 'intro' ? 'вводные готовы' : m.key === 'access' ? 'ключевой доступ выдан' : m.key === 'decision' ? 'бриф ЛПР готов' : `опросник ${ctx.surveyPct}%`}`,
          text: `${m.text(ctx)}\n\nОткрыть карточку: ${window.location.origin}/admin`,
        }),
      });
      if (r.ok) delivered.push(m.key);
    } catch { /* сеть упала — веха действительно уйдёт при следующем заходе */ }
  }
  return delivered.length ? [...sent, ...delivered] : null;
}

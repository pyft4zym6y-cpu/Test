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
  for (const m of fresh) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Discovery · ${ctx.clientName}: ${m.key === 'intro' ? 'вводные готовы' : m.key === 'access' ? 'ключевой доступ выдан' : m.key === 'decision' ? 'бриф ЛПР готов' : `опросник ${ctx.surveyPct}%`}`,
          text: `${m.text(ctx)}\n\nОткрыть карточку: ${window.location.origin}/admin`,
        }),
      });
    } catch { /* сеть упала — веха уйдёт при следующем заходе */ }
  }
  return [...sent, ...fresh.map((m) => m.key)];
}

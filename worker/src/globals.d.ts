// Портальные модули типизированы под Vite (import.meta.env). Воркер импортирует
// из них только чистую математику (type-only ссылки на supabase не исполняются),
// но tsc всё равно проверяет типы этих модулей — объявляем env, чтобы не падать.
interface ImportMeta {
  env: Record<string, string | undefined>;
}

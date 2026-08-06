// Vercel serverless (сайт weexp.agency): отдаёт публичный конфиг Supabase
// для брифа на /brief/. Anon-ключ по дизайну Supabase публичный (защита — RLS),
// но держим его в env, чтобы не хардкодить в репозитории.
// Env: SUPABASE_URL + SUPABASE_ANON_KEY (или VITE_-варианты, как в проекте портала).
export default function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res
    .status(200)
    .send(
      url && anon
        ? `window.__PORTAL_CONFIG=${JSON.stringify({ url, anon })};`
        : '/* portal config not set: add SUPABASE_URL and SUPABASE_ANON_KEY env vars */',
    );
}

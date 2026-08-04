// Vercel serverless: качает HTML чужого сайта для L0-скрининга (обход CORS браузера).
// GET /api/fetch?url=https://example.com — только http(s), максимум 400 КБ HTML.
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'Нужен параметр url (http/https)' });
    return;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 weexp-audit',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.6',
      },
    });
    clearTimeout(timer);
    const html = (await r.text()).slice(0, 400_000);
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json({ status: r.status, finalUrl: r.url, html });
  } catch (e) {
    res.status(200).json({ status: 0, error: String(e).slice(0, 120) });
  }
}

import { requireStaff } from './auth.js';
// Vercel serverless: качает HTML чужого сайта для L0-скрининга (обход CORS браузера).
// GET /api/fetch?url=https://example.com — только http(s), максимум 400 КБ HTML.
//
// Эндпоинт вызывается боевым брифом БЕЗ токена, поэтому закрыть его авторизацией
// нельзя не сломав бриф. Зато убрана опасная часть: раньше он тянул ЛЮБОЙ адрес и
// шёл по редиректам сам, то есть работал открытым прокси и позволял стучаться во
// внутренние адреса (SSRF). Теперь каждый хоп проверяется: приватные, loopback,
// link-local и метаданные облака отсекаются до запроса.
import { lookup } from 'node:dns/promises';

const MAX_BYTES = 400_000;
const MAX_HOPS = 3;

/** IPv4/IPv6 из непубличных диапазонов — цель SSRF, наружу их не выпускаем. */
function isPrivateIp(ip) {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127
      || (a === 169 && b === 254)            // link-local + метаданные 169.254.169.254
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127)  // CGNAT
      || a >= 224;                            // multicast / reserved
  }
  const s = ip.toLowerCase();
  return s === '::1' || s === '::' || s.startsWith('fc') || s.startsWith('fd')
    || s.startsWith('fe80') || s.startsWith('::ffff:');
}

/**
 * Проверяем адрес до запроса: схема, имя хоста и то, куда он резолвится.
 *
 * Экспортируется: этот же контур нужен ВЕЗДЕ, где мы идём по адресу от
 * вызывающего. Гвард уже был написан здесь, но второй такой маршрут (разбор
 * страницы по критериям AQC) им не пользовался и ходил куда угодно.
 */
export async function assertPublic(u) {
  if (!/^https?:$/.test(u.protocol)) throw new Error('только http/https');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error('внутренний хост');
  if (/^[\d.]+$/.test(host) || host.includes(':')) {
    if (isPrivateIp(host)) throw new Error('непубличный адрес');
    return;
  }
  const addrs = await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Error('хост не резолвится');
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error('хост указывает на непубличный адрес');
}

export async function fetchPage(req, res) {
  // SSRF закрито нижче, але це все одно завантажувач довільних URL нашим IP:
  // відкритий — стає безкоштовним проксі для чужого сканування.
  if (!(await requireStaff(req, res))) return;
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'Нужен параметр url (http/https)' });
    return;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    // Редиректы проходим вручную: каждый следующий адрес проверяется так же,
    // как первый, — иначе открытый редирект снова превращает нас в прокси.
    let current = new URL(url);
    let r;
    for (let hop = 0; ; hop++) {
      await assertPublic(current);
      r = await fetch(current, {
        signal: ctrl.signal,
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 weexp-audit',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.6',
        },
      });
      const loc = r.status >= 300 && r.status < 400 ? r.headers.get('location') : null;
      if (!loc) break;
      if (hop >= MAX_HOPS) throw new Error('слишком много редиректов');
      current = new URL(loc, current);
    }
    const html = (await r.text()).slice(0, MAX_BYTES);
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json({ status: r.status, finalUrl: current.toString(), html });
  } catch (e) {
    res.status(200).json({ status: 0, error: String(e?.message || e).slice(0, 120) });
  } finally {
    clearTimeout(timer);
  }
}

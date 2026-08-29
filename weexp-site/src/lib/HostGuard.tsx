import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_ORIGIN, SITE_ORIGIN, isAppHost, isAppPath, normalizeAppPath } from '@/lib/origins';

/**
 * Тримає два розділи на своїх походженнях.
 *
 * Розведення адрес зроблено в root vercel.json, але серверні редиректи бачать
 * лише повне завантаження сторінки. Всередині SPA переходи йдуть роутером — і
 * без цього сторожа посилання, яке хтось забуде перевести на потрібний хост,
 * тихо відкриє адмінку на маркетинговому домені або сторінку цін на app.*.
 * Тобто розділення трималося б на дисципліні кожного нового посилання.
 *
 * Тут воно тримається на властивості: що б не сталося з посиланням, адреса
 * приводиться до правильного походження. Серверні правила лишаються — вони
 * дають 301 для пошуковиків і працюють до завантаження JS; цей сторож
 * страхує клієнтську навігацію.
 *
 * У розробці не робить нічого: піддомену на localhost немає, а перекидання на
 * прод із локальної збірки — найгірше, що може зробити такий сторож.
 */
export function HostGuard() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) return;
    const app = isAppHost();
    const wantsApp = isAppPath(pathname);
    if (app === wantsApp) return;

    // Кабінет двомовний і префікс зберігає; адмінка одномовна — там префікс
    // веде у 404, тож його прибираємо.
    const path = wantsApp ? normalizeAppPath(pathname) : pathname;
    const target = (wantsApp ? APP_ORIGIN : SITE_ORIGIN) + path + search + hash;
    // replace, а не assign: інакше кнопка «назад» повертала б на адресу, з
    // якої нас щойно перекинуло, і людина застрягала б у циклі.
    window.location.replace(target);
  }, [pathname, search, hash]);

  return null;
}

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import AvatarBot from './AvatarBot';
import { BOT_VARIANT } from './botConfig';
import { say } from './speech';

/** Ідл-підказка за маршрутом. */
const ROUTE_IDLE: [string, string][] = [
  ['/approach', 'Наведи на цифри доказу — розповім, як ми цього досягли →'],
  ['/system', 'Наведи на модуль M01–M12 — поясню, що він робить →'],
  ['/product', 'Тапни плитку PB-01…56 — розкажу, що всередині →'],
  ['/expertise', 'Наведи на напрям — поясню, як ми з ним працюємо →'],
  ['/cases/', 'Цифри в кейсі справжні — з CRM, ERP та GA4. Скроль, коментуватиму →'],
  ['/cases', 'Обери кейс — цифри на обкладинках вимірювані, не рекламні →'],
  ['/process', 'Скроль — поясню, як етапи й DoD захищають твій бюджет →'],
  ['/services', 'Три формати входу. Наведи або скроль — підкажу →'],
  ['/about', 'Знайомся з командою — а я побуду поруч 🙂'],
  ['/contact', 'Заповни форму — я підкажу по полях і подякую наприкінці.'],
  ['/calculator', 'Чотири питання — і твій розрив у грошах на екрані. Почнемо з ніші 👇'],
  ['/privacy', 'Юридична частина. Питання — пиши нам на пошту →'],
  ['/offer', 'Юридична частина. Питання — пиши нам на пошту →'],
  ['/bot-variants', 'Обирай мій образ! Скажи номер — переодягнусь 😉'],
  ['/', 'Я поруч! Скроль — підкажу, що де на сторінці 👇'],
];

/** Автокоментарі секцій: збіг за текстом Eyebrow → репліка. */
const SECTION_SAYS: [string, string][] = [
  ['Доказ', 'Це реальні цифри з CRM, ERP і GA4. Наведи на будь-яку — розповім деталі.'],
  ['Як компанії ростуть', 'Знайома логіка? Купуй увагу — і щокварталу починай з нуля. Є краще.'],
  ['Зсув', 'Правильне питання змінює все: не «продати більше», а «стати дорожчою».'],
  ['Маніфест', 'Наш маніфест: увага орендується, система — накопичується.'],
  ['Це про ваш бізнес', 'Впізнав симптоми? Це не про людей — це про відсутність системи.'],
  ['Одна система', 'Три терміни: OS — продукт, Architecture — метод, Intelligence — результат.'],
  ['Переконання', 'Три переконання, на яких стоїть уся система.'],
  ['Ціна бездіяльності', 'Найдорожче — чекати: ≈1,6 млн ₴ на місяць у реальному аудиті.'],
  ['Перший продукт школи', 'Наведи на будь-який модуль — поясню, що він робить.'],
  ['Карта залежностей', 'Порядок тут не смаковий: без аналітики не працює retention.'],
  ['Growth Flywheel', 'Маховик росту: кожен оберт здешевлює наступний. ↓CAC, ↑LTV.'],
  ['Як працює Commerce OS', 'Чотири кроки: біль → гроші → план → виконання. Без магії.'],
  ['Що всередині блоку', 'Виконання — не обіцянка: команда, спринти, deliverables, контроль якості.'],
  ['Gold Standards', 'Еталон із 52 метрик — лінійка, до якої прикладемо ваш бізнес.'],
  ['Playbook Library', 'Тапни плитку PB — розкажу, що всередині плейбука.'],
  ['Покажи, не розкажи', 'Реальні екрани продукту: плейбук, аудит у грошах, еталони.'],
  ['У цифрах', 'Система, яку можна перерахувати — і перевірити.'],
  ['бібліотека плейбуків', 'Плейбуки зв’язані: потягни за один — рухаються сусідні.'],
  ['Не один результат', 'Кожна обкладинка — вимірюваний факт. Клікай: усередині повний розбір.'],
  ['Кейс 01', 'Флагман: з аналогової моделі — у топ-1% конверсії сегмента.'],
  ['Fashion-виробник', 'Діюча програма росту: кожен розрив уже переведено у гроші.'],
  ['Consumer DTC', '+65% за 9 місяців і 6 нових ринків. Ось як це було.'],
  ['FMCG-дистрибуція', '17 000 SKU під контролем однієї системи.'],
  ['Галузі', 'Сім галузей — один метод: еталони калібруються під нішу.'],
  ['Конкуренти', 'Чесна таблиця: у кожної моделі своя ніша. Наша — все разом.'],
  ['Процес · Discovery', 'Кожен етап має DoD і підрядника. Без передумови не стартуємо.'],
  ['Команда', 'Не одна людина — керована мережа pod-ів довкола ядра.'],
  ['Економіка проєкту', 'CAPEX — в актив, а не у витрату. Подивись на структуру.'],
  ['Ризики', 'Немає команди чи ERP? Не стоп: на кожне «якщо» є «тоді».'],
  ['Принципи', 'Чесність як зброя: факти окремо, допущення окремо.'],
  ['Як працюємо', 'Три формати співпраці: аудит → консалтинг → управління. Почни з аудиту.'],
  ['Комерційна пропозиція', 'Прозоро: що входить, строки, бюджет. Без дрібного шрифту.'],
  ['FAQ', 'Найчастіші питання — і чесні відповіді без ухилянь.'],
  ['Розвилка', 'Дві траєкторії. Ліва дешевшає з кожним місяцем раннього старту.'],
  ['Хто будує', 'Ми — архітектори: будуємо системи, а не презентації.'],
  ['Засновник', 'Це Павло — спроєктував систему й особисто веде кожен мандат.'],
  ['Довіра', 'Бренди й ринки з нашої практики: 14 країн, Forbes TOP-250.'],
  ['Медіа', 'Говоримо про системний ріст зі сцени — запрошуй спікером.'],
  ['Експертиза', '17 напрямів. Наведи на будь-який — поясню.'],
  ['Наступний крок', 'Один крок до цифр: форма поруч, я допоможу з полями.'],
  ['Правова інформація', 'Нудна, але важлива частина. Питання — на пошту.'],
  ['Дизайн-варіанти', 'П’ять моїх образів — усі живі. Який тобі ближче?'],
];

function idleFor(pathname: string): string {
  for (const [prefix, text] of ROUTE_IDLE) {
    if (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)) return text;
  }
  return ROUTE_IDLE[ROUTE_IDLE.length - 1][1];
}

const MUTE_KEY = 'weexp-bot-muted';

/**
 * Глобальний AI-асистент на всіх сторінках і всіх пристроях:
 * десктоп — «біжить» за скролом із 3D-нахилами; мобільний — компактна
 * кнопка-аватар, що розгортає бульбашку тапом. Можна згорнути (✕) —
 * вибір запам'ятовується.
 */
export default function AssistantBot() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [docked, setDocked] = useState(!isHome);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [phrase, setPhrase] = useState(idleFor(pathname));
  const [typed, setTyped] = useState('');
  const rigRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  const setMutedPersist = (v: boolean) => {
    setMuted(v);
    try {
      localStorage.setItem(MUTE_KEY, v ? '1' : '0');
    } catch {
      /* noop */
    }
  };

  /* ---- Шина реплік ---- */
  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent).detail?.text;
      if (typeof text === 'string') setPhrase(text);
    };
    const onIdle = () => setPhrase(idleFor(pathname));
    window.addEventListener('weexp-say', onSay);
    window.addEventListener('weexp-idle', onIdle);
    return () => {
      window.removeEventListener('weexp-say', onSay);
      window.removeEventListener('weexp-idle', onIdle);
    };
  }, [pathname]);

  /* ---- Зміна маршруту ---- */
  useEffect(() => {
    setPhrase(idleFor(pathname));
    setDocked(pathname !== '/');
  }, [pathname]);

  /* ---- Друкарська машинка ---- */
  useEffect(() => {
    if (muted) return;
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [phrase, muted]);

  /* ---- Автокоментарі секцій ---- */
  useEffect(() => {
    if (muted) return;
    let io: IntersectionObserver | null = null;
    const timer = setTimeout(() => {
      const targets: [Element, string][] = [];
      document.querySelectorAll('[data-bot-say]').forEach((el) => {
        const t = (el as HTMLElement).dataset.botSay;
        if (t) targets.push([el, t]);
      });
      document.querySelectorAll('section').forEach((sec) => {
        if ((sec as HTMLElement).dataset.botSay) return;
        const eyebrow = sec.querySelector('.eyebrow-dot')?.parentElement?.textContent ?? '';
        if (!eyebrow) return;
        const hit = SECTION_SAYS.find(([m]) => eyebrow.includes(m));
        if (hit) targets.push([sec, hit[1]]);
      });
      if (!targets.length) return;
      const map = new Map(targets);
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            if (window.scrollY < 320) continue;
            const t = map.get(e.target);
            if (t) say(t);
          }
        },
        { threshold: 0.4 },
      );
      targets.forEach(([el]) => io!.observe(el));
    }, 450);
    return () => {
      clearTimeout(timer);
      io?.disconnect();
    };
  }, [pathname, muted]);

  /* ---- «Біг» із 3D-фізикою (десктоп) ---- */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let lastY = window.scrollY;
    let vel = 0;
    let kick = 0;
    let phase = 0;
    let mouseTilt = 0;
    let mouseGoal = 0;

    const onScroll = () => {
      const y = window.scrollY;
      kick += y - lastY;
      lastY = y;
      if (isHome) setDocked(y > 420);
    };
    const onMove = (e: MouseEvent) => {
      mouseGoal = ((e.clientX / window.innerWidth) * 2 - 1) * 16;
    };

    const tick = () => {
      vel += (kick - vel) * 0.12;
      kick *= 0.82;
      mouseTilt += (mouseGoal - mouseTilt) * 0.08;
      const speed = Math.min(Math.abs(vel), 40);
      phase += 0.09 + speed * 0.012;
      const bob = Math.sin(phase) * (3 + speed * 0.22);
      const pitch = Math.max(-22, Math.min(22, vel * 0.55));
      const lean = Math.max(-10, Math.min(10, vel * 0.25));
      if (rigRef.current && !reduced) {
        rigRef.current.style.transform = `translateY(${bob.toFixed(1)}px) rotateX(${pitch.toFixed(1)}deg) rotateY(${mouseTilt.toFixed(1)}deg) rotateZ(${lean.toFixed(1)}deg)`;
      }
      if (linesRef.current) {
        linesRef.current.style.opacity = String(Math.min(1, speed / 10));
      }
      raf = requestAnimationFrame(tick);
    };

    /* Пауза фізики у фоновій вкладці — економія батареї на мобільних. */
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    if (!reduced && !document.hidden) raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(raf);
    };
  }, [isHome]);

  /* ---- Згорнутий стан: лише кнопка-аватар ---- */
  if (muted) {
    return (
      <button
        type="button"
        onClick={() => setMutedPersist(false)}
        aria-label="Увімкнути AI-асистента"
        className="fixed bottom-5 right-5 z-40 opacity-70 hover:opacity-100 transition-opacity"
      >
        <AvatarBot variant={BOT_VARIANT} size={48} />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-5 right-5 md:bottom-6 md:right-6 z-40 flex items-end gap-2.5 md:gap-3 transition-all duration-500 ${
        docked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
      aria-live="polite"
    >
      <div
        className="relative card p-3.5 pr-7 max-w-[240px] md:max-w-[280px] bg-white/95 backdrop-blur-sm"
        style={{ borderColor: 'rgba(101,163,13,0.45)', boxShadow: '0 10px 30px rgba(10,14,18,0.12)' }}
      >
        <button
          type="button"
          onClick={() => setMutedPersist(true)}
          aria-label="Згорнути асистента"
          className="absolute top-1.5 right-1.5 p-1 text-black/60 hover:text-black/80 transition-colors"
        >
          <X size={13} />
        </button>
        <p className="font-pixel text-[0.45rem] text-[var(--acid)] mb-1.5">WEEXP·OS</p>
        <p className="font-mono text-[0.64rem] md:text-[0.66rem] leading-relaxed text-[#12161C] min-h-[2.4em]">
          {typed}
          <span className="cursor-blink text-[var(--acid)]">▊</span>
        </p>
      </div>

      <div className="relative shrink-0 pointer-events-none" style={{ perspective: '520px' }}>
        <div ref={linesRef} className="absolute right-full top-1/2 -translate-y-1/2 mr-1.5 hidden md:flex flex-col gap-1.5 opacity-0">
          <span className="block h-[2px] w-6 bg-[#65A30D]/70 rounded-full" />
          <span className="block h-[2px] w-4 bg-[#65A30D]/50 rounded-full ml-2" />
          <span className="block h-[2px] w-5 bg-[#65A30D]/60 rounded-full" />
        </div>
        <div ref={rigRef} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
          <AvatarBot variant={BOT_VARIANT} size={56} className="md:hidden" />
          <div className="hidden md:block">
            <AvatarBot variant={BOT_VARIANT} size={72} />
          </div>
        </div>
        <div className="mx-auto mt-0.5 h-1.5 w-10 rounded-full bg-black/15 blur-[2px]" />
      </div>
    </div>
  );
}

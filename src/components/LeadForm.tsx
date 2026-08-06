import { useState, type FormEvent } from 'react';
import { say } from './speech';
import { track } from './analytics';
import { sendLead } from './leads';

const TURNOVER_OPTIONS = [
  'до 1 млн ₴ / міс',
  '1–5 млн ₴ / міс',
  '5–20 млн ₴ / міс',
  '20+ млн ₴ / міс',
  'Поки не продаємо онлайн',
];

const inputCls =
  'w-full bg-[#FFFFFF] border border-black/10 px-4 py-3 text-sm text-[#12161C] placeholder:text-[#5A6472] focus:outline-none focus:border-[#65A30D] transition-colors';

/*
 * Форма шле заявку через /api/lead (Resend) — без відкриття поштовика.
 * Якщо бекенд недоступний — fallback: формуємо mailto-лист, як раніше.
 */
export default function LeadForm() {
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [phone, setPhone] = useState('');
  const [turnover, setTurnover] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<false | 'api' | 'mailto'>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await sendLead({ source: 'contact', name, store, phone, turnover, comment });
    setBusy(false);
    if (ok) {
      setSent('api');
      track('lead_submit', { turnover, method: 'api' });
      say(`Дякую${name ? `, ${name.trim()}` : ''}! Заявку отримано — відповімо протягом робочого дня.`);
      return;
    }
    // fallback: поштовик із заповненим листом
    const subject = `Аудит — ${name || 'запит із сайту'}`;
    const body = [
      `Ім'я: ${name}`,
      `Магазин / сайт: ${store}`,
      `Телефон: ${phone}`,
      `Оборот: ${turnover}`,
      comment ? `Коментар: ${comment}` : '',
      '',
      '— відправлено з сайту Commerce OS',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      navigator.clipboard?.writeText(`${subject}\n\n${body}`);
    } catch { /* clipboard недоступний */ }
    setSent('mailto');
    track('lead_submit', { turnover, method: 'mailto' });
    window.location.href = `mailto:pashasidorenko18@gmail.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="card p-7 bg-white/85 backdrop-blur-sm">
      <p className="font-pixel text-[0.5rem] uppercase text-[#4D7C0F] mb-2">Заявка на діагностику</p>
      <p className="font-extrabold text-xl mb-1.5">Порахуємо ваш розрив у грошах</p>
      <p className="text-[#5A6472] text-xs mb-6 leading-relaxed">
        30-хв сесія безкоштовна. Відповідаємо протягом робочого дня.
      </p>
      <div className="flex flex-col gap-3.5">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше ім'я *"
          className={inputCls}
        />
        <input
          type="text"
          required
          value={store}
          onChange={(e) => setStore(e.target.value)}
          placeholder="Посилання на магазин / сайт *"
          className={inputCls}
        />
        <input
          type="tel"
          required
          pattern="[+()0-9\\-\\s]{10,18}"
          inputMode="tel"
          title="Телефон у форматі +38 0XX XXX XX XX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onFocus={() => say('Телефон потрібен, щоб узгодити час 30-хв сесії. Нікакого спаму — обіцяю.')}
          placeholder="Телефон *"
          className={inputCls}
        />
        <select
          required
          value={turnover}
          onChange={(e) => setTurnover(e.target.value)}
          className={`${inputCls} ${turnover ? 'text-[#12161C]' : 'text-[#5A6472]'}`}
        >
          <option value="" disabled>
            Місячний оборот e-commerce *
          </option>
          {TURNOVER_OPTIONS.map((o) => (
            <option key={o} value={o} className="bg-[#FFFFFF] text-[#12161C]">
              {o}
            </option>
          ))}
        </select>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Що болить найбільше? (необов'язково)"
          rows={3}
          className={`${inputCls} resize-none`}
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-[#A3E635] px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.12em] text-black transition-transform duration-200 hover:scale-[1.02] disabled:opacity-60"
          style={{ boxShadow: '0 0 28px rgba(101,163,13,0.3)' }}
        >
          {busy ? 'Надсилаємо…' : 'Забронювати сесію →'}
        </button>
        {sent === 'api' ? (
          <p className="text-[#4d7c0f] text-[0.7rem] leading-relaxed font-medium">
            ✓ Заявку отримано. Відповімо протягом робочого дня — або телефонуйте одразу:
            +38 099 918 82 60.
          </p>
        ) : sent === 'mailto' ? (
          <p className="text-[#4d7c0f] text-[0.7rem] leading-relaxed font-medium">
            Заявку сформовано й скопійовано в буфер обміну. Якщо вікно пошти не відкрилося —
            вставте текст у лист на{' '}
            <a href="mailto:pashasidorenko18@gmail.com" className="underline">pashasidorenko18@gmail.com</a>{' '}
            або зателефонуйте: +38 099 918 82 60.
          </p>
        ) : (
          <p className="text-[#5A6472] text-[0.64rem] leading-relaxed">
            Дані підуть напряму нам на пошту — нічого не публікується. Відповідь — протягом
            робочого дня.
          </p>
        )}
      </div>
    </form>
  );
}

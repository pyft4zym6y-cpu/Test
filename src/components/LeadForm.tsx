import { useState, type FormEvent } from 'react';
import { say } from './speech';

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
 * Форма збирає поля й відкриває поштовий клієнт із заповненим листом (mailto) —
 * працює без бекенда в будь-якому середовищі. На реальному хостингу submit
 * легко переключити на POST до бекенда чи form-сервіса.
 */
export default function LeadForm() {
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [phone, setPhone] = useState('');
  const [turnover, setTurnover] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Diagnostic Sprint — ${name || 'запит із сайту'}`;
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
    say(
      `Дякую${name ? `, ${name.trim()}` : ''}! Лист сформовано — надішли його зі своєї пошти, і ми повернемось протягом робочого дня. До зв'язку!`,
    );
    window.location.href = `mailto:pashasidorenko18@gmail.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="card p-7 bg-white/85 backdrop-blur-sm">
      <p className="font-pixel text-[0.5rem] uppercase text-[#65A30D] mb-2">Заявка на діагностику</p>
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
          className="bg-[#A3E635] px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.12em] text-black transition-transform duration-200 hover:scale-[1.02]"
          style={{ boxShadow: '0 0 28px rgba(101,163,13,0.3)' }}
        >
          Отримати діагностику →
        </button>
        <p className="text-[#5A6472] text-[0.64rem] leading-relaxed">
          Кнопка відкриє лист із заповненими даними у вашій пошті — нічого не публікується
          автоматично.
        </p>
      </div>
    </form>
  );
}

import { useState, type FormEvent } from 'react';
import { Eyebrow, FadeIn } from '@/lib/primitives';
import { say } from '@/lib/bus';
import './contact.css';

/** Контакт — лид-форма → mailto (без бэкенда, как в старом сайте). */
const TURNOVER = ['до $0.5M', '$0.5–1M', '$1–3M', '$3–10M', '> $10M'];
const MAIL = 'pashasidorenko18@gmail.com';

export function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = [
      `Ім'я: ${f.get('name')}`, `Магазин: ${f.get('store')}`, `Телефон: ${f.get('phone')}`,
      `Оборот: ${f.get('turnover')}`, `Коментар: ${f.get('comment')}`,
    ].join('\n');
    const url = `mailto:${MAIL}?subject=${encodeURIComponent('Запит на діагноз — WEEXP')}&body=${encodeURIComponent(body)}`;
    try { navigator.clipboard?.writeText(body); } catch { /* ignore */ }
    window.location.href = url;
    setSent(true);
    say('Дякую! Лист сформовано — надішліть його, і ми поставимо діагноз у грошах.');
  };
  return (
    <section className="ct" id="contact" data-say="Наступний крок — діагноз у грошах. Залиште контакт, решту зробимо ми.">
      <div className="wrap ct-grid">
        <FadeIn className="ct-left">
          <Eyebrow>Наступний крок</Eyebrow>
          <h2 className="ct-h">Зростання — це <span className="mk">система</span>. Почнімо з діагнозу.</h2>
          <p className="ct-lead">Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.</p>
          <div className="ct-alt mono">
            <a href={`mailto:${MAIL}`}>{MAIL}</a>
            <span>UA · EU · US</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.1} className="ct-formwrap">
          <form className="ct-form" onSubmit={submit}>
            <label className="ct-field"><span className="mono">Ім'я</span><input name="name" required autoComplete="name" /></label>
            <label className="ct-field"><span className="mono">Магазин / сайт</span><input name="store" required /></label>
            <label className="ct-field"><span className="mono">Телефон</span><input name="phone" type="tel" required autoComplete="tel" /></label>
            <label className="ct-field"><span className="mono">Оборот / міс</span>
              <select name="turnover" defaultValue="">
                <option value="" disabled>оберіть…</option>
                {TURNOVER.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="ct-field ct-full"><span className="mono">Коментар</span><textarea name="comment" rows={3} /></label>
            <button className="ct-submit mono" type="submit">{sent ? 'Лист сформовано ✓' : 'Отримати діагноз →'}</button>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}

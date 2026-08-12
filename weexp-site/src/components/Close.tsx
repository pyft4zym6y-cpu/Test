import { motion } from 'framer-motion';
import './close.css';

export function Close() {
  return (
    <section className="close">
      <div className="wrap">
        <div className="eyebrow">03 · Наступний крок</div>
        <motion.h2 className="close-h"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          Спочатку <span className="mk">діагноз у грошах</span>. Потім — рішення.
        </motion.h2>
        <button className="cta" type="button">Поставити діагноз →</button>
        <p className="close-fine">Для e-commerce виробників і D2C-брендів з обігом $0.5–10M. Кожна теза — з цифрою під нею.</p>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import './alternatives.css';

const ROWS: [string, string, string, string, string][] = [
  ['Що продає', 'Канал', 'Ставку', 'Години', 'Функцію і результат'],
  ['Відповідає за', 'Метрику каналу', 'Свою ділянку', 'Задачу', 'P&L e-commerce'],
  ['Час до ефекту', '2–3 міс', '6–9 міс', 'Точково', 'Дні до діагнозу'],
  ['Конфлікт інтересів', 'Продає свій канал', 'Захищає місце', 'Продає час', 'Оплата за систему'],
  ['Що залишиться', 'Залежність', 'Людина', 'Нічого', 'Відділ, процеси, документи'],
  ['Ринки ЄС', 'Рідко', 'Рідко', 'Рідко', 'Профіль'],
];

export function Alternatives() {
  return (
    <section className="alt">
      <div className="wrap">
        <div className="eyebrow">02 · Позиціювання</div>
        <h2 className="alt-h">Відбудова від трьох альтернатив</h2>
        <p className="alt-lead">Відмова — частина позиціювання. Порівняйте, за що платите — і що залишиться, коли ми підемо.</p>
        <div className="alt-scroll">
          <table className="cmp">
            <colgroup><col /><col /><col /><col /><col className="us" /></colgroup>
            <thead>
              <tr><th></th><th>Агенція</th><th>Найм</th><th>Фрілансер</th><th className="us">WEEXP</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <motion.tr key={i}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}>
                  <td className="rowlab mono">{r[0]}</td>
                  <td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
                  <td className="us">{r[4]}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

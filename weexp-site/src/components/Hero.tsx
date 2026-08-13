import { motion } from 'framer-motion';
import { Scene3D } from '@/components/Scene3D';
import './hero.css';

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <header className="hero" data-say="Система замість героїзму. Ми — операційний партнер, а не консультант збоку.">
      <Scene3D />
      <div className="wrap hero-mid">
        <motion.div className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }}>
          WEEXP · операційний партнер e-commerce
        </motion.div>
        <h1 className="hero-h">
          {['Система', 'замість', 'героїзму'].map((w, i) => (
            <span className="line" key={i}>
              <motion.span
                className={i === 2 ? 'mk word' : 'word'}
                initial={{ y: '110%' }} animate={{ y: 0 }}
                transition={{ delay: 0.15 + i * 0.09, duration: 0.9, ease }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="hero-lead"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease }}>
          Ми не консультуємо збоку. Ставимо діагноз у грошах, будуємо e-commerce-відділ і систему —
          і залишаємо все це працювати без вас.
        </motion.p>
      </div>

      <div className="wrap hero-foot mono">
        <span>↓ гортайте — Independence Score росте</span>
        <span>Діагностика → Побудова → Передача</span>
      </div>
    </header>
  );
}

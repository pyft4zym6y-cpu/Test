/**
 * ОДНА ГОЛОВНА ДІЯ НА ВСЬОМУ САЙТІ — ЗАЯВКА.
 *
 * Було навпаки: 21 посилання вело в калькулятор і 7 — у заявку. Калькулятор
 * просить менше (жодної розмови, жодного зобовʼязання), і саме тому виглядав
 * безпечним вибором для головної кнопки. Але він і дає менше: людина отримує
 * число і йде, а число без нас нічого не міняє.
 *
 * Тепер ієрархія одна: «Залишити заявку» — основна кнопка, «Порахувати витік» —
 * тихий другий шлях для тих, кому ще рано говорити. Сторож тримає саме
 * ІЄРАРХІЮ, а не наявність посилань: розрахунок нікуди не подівся, він просто
 * не може знову стати головним.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SYS = join(__dirname, '..', 'system');
const read = (f: string) => readFileSync(join(SYS, f), 'utf8');

/** Публічні сторінки. Кабінет і адмінка — закриті поверхні з іншими цілями. */
const PUBLIC = readdirSync(SYS)
  .filter((f) => f.endsWith('.tsx'))
  .filter((f) => !/Cabinet|AdminPanel|ProjectView|Login|Auth/i.test(f));

/**
 * Усі посилання-КНОПКИ файлу: [адреса, класи].
 *
 * `sysx-cta-alt` сюди НЕ входить, і це не дрібниця. Тихий рядок «ще не готові
 * говорити? порахувати витік» — не друга кнопка: у ньому й сенс, що він не
 * конкурує з основною дією поглядом. Якби він рахувався кнопкою, правило «на
 * першому екрані одна кнопка» вважалось би порушеним саме тим рішенням, яке
 * його й дотримується.
 *
 * Тому `\b` тут мало: після «cta» вона спрацьовує й на дефісі. Потрібна
 * перевірка, що далі НЕ йде продовження імені класу.
 */
const buttons = (code: string): { to: string; cls: string }[] => {
  const out: { to: string; cls: string }[] = [];
  for (const m of code.matchAll(/<Link\s+to=\{[^}]*lp\('([^']+)'\)[^}]*\}\s+className="([^"]*)"/g))
    if (/\b(?:sysx|sysh)-cta(?![\w-])/.test(m[2])) out.push({ to: m[1], cls: m[2] });
  return out;
};

describe('головна дія — заявка', () => {
  it('кнопка в шапці веде на заявку', () => {
    // Шапка видима на кожній сторінці: це найчастіше побачена кнопка сайту.
    const shell = read('SystemShell.tsx');
    expect(shell).toMatch(/lp\('\/contact'\)[^>]*className="sysh-cta/);
    expect(shell, 'у шапці знову калькулятор').not.toMatch(/lp\('\/diagnose'\)[^>]*className="sysh-cta/);
  });

  it('на першому екрані головної — одна кнопка, і це заявка', () => {
    const home = read('SystemInMotion.tsx');
    const at = home.indexOf('sysx-hero-in');
    const hero = home.slice(at, home.indexOf('</section>', at));
    const b = buttons(hero);
    expect(b.map((x) => x.to), `кнопок у герої: ${b.length}`).toEqual(['/contact']);
  });

  it('фінальний заклик веде на заявку', () => {
    const close = read('ClosingCta.tsx');
    expect(buttons(close).map((b) => b.to)).toContain('/contact');
  });

  it('де є обидві дії — головна кнопка саме заявка', () => {
    /*
     * Правило не «ніде немає калькулятора», а «там, де поруч обидві, основна
     * (is-primary) — заявка». Інакше сторож заборонив би другий шлях замість
     * того, щоб тримати порядок між ними.
     */
    const wrong: string[] = [];
    for (const f of PUBLIC) {
      const b = buttons(read(f));
      const hasBoth = b.some((x) => x.to === '/contact') && b.some((x) => x.to === '/diagnose');
      if (!hasBoth) continue;
      for (const x of b)
        if (x.to === '/diagnose' && /is-primary/.test(x.cls) && !b.some((y) => y.to === '/contact' && /is-primary/.test(y.cls)))
          wrong.push(f);
    }
    expect([...new Set(wrong)], `калькулятор знову головна кнопка: ${wrong.join(', ')}`).toEqual([]);
  });

  it('калькулятор не зник — він лишається другим шляхом', () => {
    // Зворотний бік правила: прибрати розрахунок зовсім означало б втратити
    // тих, хто ще не готовий говорити, а таких на холодному трафіку більшість.
    const home = read('SystemInMotion.tsx') + read('ClosingCta.tsx');
    expect(home, 'другий шлях зник разом із перестановкою').toContain("lp('/diagnose')");
    expect(home, 'другий шлях подано як рівноцінну кнопку').toContain('sysx-cta-alt');
  });

  it('перший крок описаний до того, як про нього просять', () => {
    /*
     * Головній дії заважає не ціна й не сумнів в експертизі, а невідомість:
     * скільки чекати відповіді, чи буде презентація на сорок слайдів. Блок
     * «що буде після заявки» має стояти ПЕРЕД фінальною кнопкою.
     */
    const home = read('SystemInMotion.tsx');
    const after = home.indexOf('<AfterRequest />');
    const close = home.indexOf('<ClosingCta />');
    expect(after, 'блоку «що буде після заявки» немає').toBeGreaterThan(0);
    expect(after, 'про перший крок розповідають після того, як просять його зробити').toBeLessThan(close);
  });
});

describe('порядок блоків = порядок рішення', () => {
  const home = read('SystemInMotion.tsx');
  const at = (tag: string) => home.indexOf(tag);

  it('впізнавання проблеми стоїть перед доказом', () => {
    /*
     * Доказ переконує того, хто вже визнав проблему. Тому, хто ще не визнав,
     * чужі числа не кажуть нічого: «молодці, але це не про мене». Тому спершу
     * симптоми реплікою власника, і лише потім кейси.
     */
    expect(at('<Symptoms compact />'), 'симптомів немає на головній').toBeGreaterThan(0);
    expect(at('<Symptoms compact />')).toBeLessThan(at('<HomeCases />'));
  });

  it('охоплення стоїть перед кейсами, а кейси — перед форматами', () => {
    // «Вміють що саме» → «доведіть» → «то що я купую». Порушення цього порядку
    // ставить ціну раніше за підставу для неї.
    expect(at('<Coverage />')).toBeLessThan(at('<HomeCases />'));
    expect(at('<HomeCases />')).toBeLessThan(at('<HomeServices />'));
  });
});

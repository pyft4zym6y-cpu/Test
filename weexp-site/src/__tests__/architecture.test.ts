/**
 * Архитектура бренда: четыре уровня, которые должны сходиться со страницами.
 *
 * Блок «Як це влаштовано» обещает 8 систем, 9 направлений и 3 формата. Каждое
 * из этих чисел уже показывает своя страница, и разъехаться им нельзя: тогда
 * главная будет обещать одно, а страница отдавать другое — ровно та болезнь,
 * из-за которой описание /expansion продолжало звать шесть направлений при
 * девяти. Первые два числа выведены из данных, третье — литерал, потому что
 * карточки форматов собираются внутри Pricing (им нужен t); связь держит тест.
 *
 * Порядок уровней тоже проверяется: он и есть смысл блока — что строим, кто
 * строит, как заходим, чем меряем. Переставь их, и цепочка перестанет читаться.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARCHITECTURE, ENGAGEMENT_MODELS } from '@/data/architecture';
import { SYSTEMS, AUTONOMY_W } from '@/data/xray';
import { EXPERTISES } from '@/system/expertises';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const level = (key: string) => ARCHITECTURE.find((l) => l.key === key)!;

describe('уровни архитектуры', () => {
  it('идут в порядке «что → кто → как → чем меряем»', () => {
    expect(ARCHITECTURE.map((l) => l.key)).toEqual(['systems', 'expertise', 'models', 'score']);
  });

  it('числа совпадают с тем, что показывают сами страницы', () => {
    expect(level('systems').count).toBe(String(SYSTEMS.length));
    expect(level('expertise').count).toBe(String(EXPERTISES.length));
  });

  it('число форматов совпадает с карточками на /pricing', () => {
    // Карточки нумерованы n: '01'…'0N' — считаем их в исходнике страницы.
    const pricing = read('src/system/Pricing.tsx');
    const cards = [...pricing.matchAll(/^\s*n: '(\d{2})',\s*name:/gm)].length;
    expect(cards, 'на /pricing другое число форматов').toBe(ENGAGEMENT_MODELS);
  });

  it('каждый уровень ведёт на существующий маршрут и переведён', () => {
    const app = read('src/App.tsx');
    for (const l of ARCHITECTURE) {
      expect(app, `нет маршрута ${l.to}`).toContain(`'${l.to}'`);
      for (const pair of [l.title, l.question, l.body]) {
        expect(pair[0], `${l.key}: пустой uk`).toBeTruthy();
        expect(pair[1], `${l.key}: пустой en`).toBeTruthy();
        expect(pair[1], `${l.key}: en кириллицей`).not.toMatch(/\p{Script=Cyrillic}/u);
      }
    }
  });
});

describe('первый экран', () => {
  const home = read('src/system/SystemInMotion.tsx');

  it('ведёт обещанием, а не слоганом', () => {
    /*
     * Раньше H1 был «Система замість героїзму» — это позиция бренда, а не то,
     * что получает покупатель. Категория стояла выше (в надзаголовке), а
     * обещание было закопано в третьем предложении лида. Теперь порядок:
     * категория → обещание → механика → слоган в конце лида.
     */
    const h1 = /<h1 className="sysx-display sysx-h1">([\s\S]*?)<\/h1>/.exec(home)?.[1] ?? '';
    expect(h1, 'H1 не найден').toBeTruthy();
    expect(h1, 'H1 снова стал слоганом').not.toContain('героїзму');
    expect(h1).toContain('не тримаються на вас');
  });

  it('называет категорию до заголовка', () => {
    const void_ = home.slice(home.indexOf('SYMPTOM / VOID'));
    const kick = void_.indexOf('sysx-kick');
    const h1 = void_.indexOf('sysx-h1');
    expect(kick, 'надзаголовок с категорией пропал').toBeGreaterThan(-1);
    expect(kick, 'категория ушла ниже заголовка').toBeLessThan(h1);
  });

  it('не обещает, что деньги текут сами', () => {
    // Обещание пассивного дохода противоречит всему остальному тексту: мы
    // продаём управляемую систему, а не автопилот.
    expect(home).not.toContain('гроші течуть');
    expect(home).not.toContain('money flows');
  });

  it('финальная сцена не повторяет лид первого экрана', () => {
    const leads = [...home.matchAll(/className="sysx-lead">\{t\('([^']{60,})'/g)].map((m) => m[1]);
    expect(new Set(leads).size, 'два лида на странице совпадают слово в слово').toBe(leads.length);
  });
});

describe('ваги автономності', () => {
  /*
   * Independence Score і Business Health — один і той самий розрахунок:
   * середнє по восьми системах, зважене на автономність. Ваги лежали двома
   * копіями (data/xray і system/lossModel) під двома назвами підсумку. Копії
   * були байт у байт однакові, тому ніщо не падало — і саме тому правка ваг в
   * одному файлі мовчки розвела б два бали за ті самі відповіді.
   */
  it('живуть в одному місці', () => {
    const loss = read('src/system/lossModel.ts');
    expect(loss, 'у lossModel знову зʼявився власний набір ваг')
      .not.toMatch(/const W: Record<SysKey, number> = \{/);
    expect(loss).toContain('AUTONOMY_W');
  });

  it('покривають усі вісім систем', () => {
    expect(Object.keys(AUTONOMY_W).sort()).toEqual(SYSTEMS.map((s) => s.key).sort());
    for (const [k, v] of Object.entries(AUTONOMY_W)) {
      expect(v, `${k}: вага поза розумним діапазоном`).toBeGreaterThan(0);
      expect(v, `${k}: вага поза розумним діапазоном`).toBeLessThanOrEqual(2);
    }
  });

  it('дають організації більшу вагу, ніж експансії', () => {
    // Це і є сенс метрики: бізнес без ролей і процесів тримається на людині,
    // скільки б ринків він не мав. Якщо ваги зрівняти, бал перестане міряти
    // незалежність і стане просто середнім здоровʼям.
    expect(AUTONOMY_W.org).toBeGreaterThan(AUTONOMY_W.expansion);
    expect(AUTONOMY_W.operations).toBeGreaterThan(AUTONOMY_W.expansion);
  });
});

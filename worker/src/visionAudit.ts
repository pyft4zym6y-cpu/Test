/**
 * Резервный контур UX/UI-аудита ПО СКРИНШОТАМ. Когда живого доступа к сайту нет
 * (заглушка Hostinger/coming-soon, бот-блок, закрытая витрина), клиент грузит PDF
 * с полностраничными скриншотами страниц — и система разбирает их ЗРЕНИЕМ вместо
 * обхода DOM. Claude API читает PDF нативно (document-блок), поэтому растеризация
 * не нужна: каждая страница видна модели как изображение.
 *
 * По каждой странице Claude определяет тип и выносит вердикт по блокам эталона
 * (есть / есть-но-слабо / приховано / нет) + дизайн-вердикт со зрением. Итог
 * питает ту же модель (buildSiteAuditFromVision) → тот же отчёт с вайрфреймами.
 */
import { createMessage, extractJson, hasKey, apiErrorHint } from './anthropic.js';
import { REFERENCE } from './prototype.js';
import type { PageKind } from './crawl.js';
import { buildSiteAuditFromVision, type VisionPageInput, type SiteAuditReport, type BlockState } from './pagereport.js';
import type { DesignReview } from './designReview.js';

/** Каталог эталонных блоков по типам страниц — чтобы Claude ставил вердикт по точным ключам. */
function blockCatalog(): string {
  const out: string[] = [];
  for (const [kind, ref] of Object.entries(REFERENCE)) {
    if (!ref) continue;
    out.push(`\n[${kind}] ${ref.title}:`);
    for (const b of ref.blocks) out.push(`  ${b.key} — ${b.name} (${b.weight})`);
  }
  return out.join('\n');
}

const KINDS: PageKind[] = ['home', 'plp', 'pdp', 'cart', 'checkout', 'faq', 'content', 'other'];

const SYSTEM = `Ти — senior UX/UI-архітектор і design director рівня C-level. Клієнт НЕ дав живого доступу до сайту (вітрина за заглушкою), тож надав PDF із повносторінковими скріншотами сторінок. Твоє завдання — розібрати кожну сторінку ЗОРОМ, як робить обхід DOM, тільки по зображенню.

Для КОЖНОЇ сторінки-скріншота:
1. Визнач тип: home | plp (каталог) | pdp (картка товару) | cart | checkout | faq | content | other.
2. Для блоків еталона цього типу (каталог нижче) постав стан:
   - "ok" — блок є і зроблений добре;
   - "weak" — блок Є, але слабко/не за еталоном (наявність ≠ правильно): напр. блок довіри з іконок без тексту, галерея з 1 фото, розмита ієрархія CTA;
   - "gap" — блока на екрані немає;
   - "check" — не впевнено (могло не влізти у скріншот).
   Для кожного — коротке спостереження "now" (що саме видно).
3. Познач сильні блоки.

Наприкінці — ЄДИНИЙ дизайн-вердикт по всьому набору: дорого чи дешево, шаблон чи кастом, з осями й уликами шаблонності (як senior design director).

Правила: лише за тим, що видно на скріншотах. Не вигадуй. Українською. Стани — рівно з набору ok|weak|check|gap і КЛЮЧІ блоків — рівно з каталогу.

КАТАЛОГ ЕТАЛОННИХ БЛОКІВ:${blockCatalog()}

Поверни СТРОГО JSON:
{
  "pages": [
    { "kind": "home|plp|pdp|cart|checkout|faq|content|other",
      "title": "коротка назва сторінки",
      "conclusion": "заголовок-висновок сторінки (не тема, а вивід)",
      "blocks": [{"key":"<ключ з каталогу>","state":"ok|weak|check|gap","now":"що видно"}],
      "strong": ["сильні блоки"] }
  ],
  "design": {
    "tier": "кастомна дизайн-система|преміум-шаблон, доопрацьований|типовий готовий шаблон|застарілий шаблон-костиль",
    "overallScore": <0..10>,
    "verdict": "2-3 речення: дорого/дешево і чому",
    "axes": [{"name":"Візуальна ієрархія|Типографіка|Колір і контраст|Сітка й ритм|Робота із зображеннями|Консистентність","score":<0..10>,"note":"що саме"}],
    "templateTells": ["улики шаблонності/датованості"],
    "references": ["як має виглядати дорого — 2-3 орієнтири"]
  }
}`;

type VisionRaw = {
  pages: { kind: string; title?: string; conclusion?: string; blocks: { key: string; state: string; now?: string }[]; strong?: string[] }[];
  design?: { tier: DesignReview['tier']; overallScore: number; verdict: string; axes?: DesignReview['axes']; templateTells?: string[]; references?: string[] };
};

const asKind = (k: string): PageKind => (KINDS.includes(k as PageKind) ? (k as PageKind) : 'other');
const asState = (s: string): BlockState => (['ok', 'weak', 'check', 'gap'].includes(s) ? (s as BlockState) : 'check');

export type VisionAuditResult = { report: SiteAuditReport; design: DesignReview | null };
/** Файл для зрения: сырой base64 (без data:префикса) + MIME (pdf/png/jpeg). */
export type VisionFile = { data: string; mediaType: string; name?: string };

/**
 * Разбор набора файлов-скриншотов (отдельные PDF/картинки по странице, до 50 штук)
 * зрением → UX/UI-отчёт (резервный контур). Каждый файл = страница (PDF может нести
 * несколько). client — хост для шапки.
 */
export async function auditFromScreenshots(files: VisionFile[], client: string, log?: (m: string) => void): Promise<VisionAuditResult | null> {
  if (!hasKey()) { log?.('⚠️ резервний контур (скріншоти) недоступний: немає ANTHROPIC_API_KEY'); return null; }
  if (!files?.length) { log?.('⚠️ резервний контур: файлів не передано'); return null; }
  try {
    const content: any[] = [];
    files.slice(0, 50).forEach((f, i) => {
      const label = f.name || `Сторінка ${i + 1}`;
      content.push({ type: 'text', text: `\n[${i + 1}] ${label}` });
      if (/pdf/i.test(f.mediaType)) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } });
      else content.push({ type: 'image', source: { type: 'base64', media_type: /png/i.test(f.mediaType) ? 'image/png' : 'image/jpeg', data: f.data } });
    });
    content.push({ type: 'text', text: `Клієнт: ${client}. Вище — ${Math.min(files.length, 50)} файлів-скріншотів (кожен — сторінка сайту; PDF може містити кілька сторінок). Розбери КОЖНУ сторінку за інструкцією й поверни JSON. pages — по одному об'єкту на кожну сторінку у тому ж порядку.` });
    const resp: any = await createMessage({ max_tokens: 8000, system: SYSTEM, messages: [{ role: 'user', content }] });
    const text = (resp.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const raw = extractJson<VisionRaw>(text);
    if (!raw?.pages?.length) { log?.('⚠️ зір не повернув сторінок зі скріншотів'); return null; }

    const pages: VisionPageInput[] = raw.pages.map((p) => ({
      kind: asKind(p.kind), title: p.title ?? '', conclusion: p.conclusion,
      blocks: (p.blocks ?? []).map((b) => ({ key: b.key, state: asState(b.state), now: b.now ?? '' })),
      strong: p.strong ?? [],
    }));
    const report = buildSiteAuditFromVision({ client, pages });

    let design: DesignReview | null = null;
    if (raw.design && typeof raw.design.overallScore === 'number') {
      design = {
        client, source: 'зір', tier: raw.design.tier, overallScore: raw.design.overallScore, verdict: raw.design.verdict,
        axes: raw.design.axes ?? [], templateTells: raw.design.templateTells ?? [], references: raw.design.references ?? [],
        perPage: [], stackLine: 'За наданими скріншотами (резервний контур, без доступу до коду сайту)',
      };
      report.design = design;
    }
    log?.(`✓ резервний контур: розібрано ${pages.length} сторінок зі скріншотів (зір)${design ? ` · дизайн ${design.overallScore}/10` : ''}`);
    return { report, design };
  } catch (e) {
    log?.(`⚠️ резервний контур (скріншоти) не відпрацював (${String(e).slice(0, 90)})${apiErrorHint(e)}`);
    return null;
  }
}

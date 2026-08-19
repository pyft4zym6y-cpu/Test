/**
 * Генератор Excel «Уровни аудита T1–T4»: лист на тир с исчерпывающим перечнем
 * вопросов и доступов, необходимых для качественного проведения аудита на этом
 * уровне, и указанием приложенного ассета (шаблон / инструкция / скрипт).
 *
 * Источник правды — portal/src/data/auditTiers.ts (та же модель, что и в портале).
 * Запуск: npx tsx scripts/tierWorkbook.ts [outdir]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { makeXlsx, type Sheet } from '../src/xlsx.js';
import {
  TIERS,
  ASSETS,
  BLOCKS,
  REQ_LABEL,
  flatReqsAtTier,
  type Tier,
  type Asset,
} from '../../portal/src/data/auditTiers.js';

function assetCell(assetId: string | undefined): string {
  if (!assetId) return '—';
  const a: Asset | undefined = ASSETS[assetId];
  if (!a) return '—';
  const kind = a.kind === 'template' ? 'ШАБЛОН' : a.kind === 'instruction' ? 'ИНСТРУКЦИЯ' : 'СКРИПТ';
  const where = a.filename ? ` · файл: ${a.filename}` : ' · показывается в портале';
  return `${kind}: ${a.title}${where}`;
}

/* ── Обзорный лист ── */
const overview: Sheet = {
  name: 'Обзор T1–T4',
  header: ['Тир', 'Уровень', 'Что это', 'Входные данные', 'Что открывается', 'Достоверность', 'Негласно'],
  cols: [6, 30, 40, 44, 60, 14, 10],
  rows: TIERS.map((t) => [
    t.code,
    t.name,
    t.tagline,
    t.inputs,
    t.unlocks.map((u) => '• ' + u).join('\n'),
    `${t.confidence}%`,
    t.covert ? 'да' : 'нет',
  ]),
};

/* ── Лист на каждый тир: исчерпывающий кумулятивный перечень ── */
function tierSheet(tier: Tier): Sheet {
  const t = TIERS.find((x) => x.tier === tier)!;
  const reqs = flatReqsAtTier(tier);
  const header = ['#', 'Блок аудита', 'Тип', 'Что нужно', 'Зачем это нужно', 'Впервые с', 'Что прикладываем', 'Если недоступно (worst-case)'];
  const rows = reqs.map((r, i) => [
    i + 1,
    r.blockName,
    REQ_LABEL[r.kind],
    r.title,
    r.why,
    `T${r.tier}`,
    assetCell(r.assetId),
    r.fallback ?? '—',
  ]);
  // Первая строка-аннотация внутри листа — как «шапка смысла».
  const intro: (string | number)[] = [
    '',
    `${t.code} · ${t.name}`,
    '',
    t.tagline,
    `Достоверность до ${t.confidence}%. Перечень кумулятивный: включает всё из младших тиров.`,
    '',
    `Требований: ${reqs.length}`,
    'Исходим из худшего: у каждого доступа есть запасной путь.',
  ];
  return {
    name: t.code,
    header,
    cols: [5, 24, 16, 36, 46, 9, 46, 52],
    rows: [intro, ...rows],
  };
}

/* ── Лист «Ассеты»: что именно мы прикладываем ── */
const assetsSheet: Sheet = {
  name: 'Ассеты (что прикладываем)',
  header: ['ID', 'Тип', 'Название', 'Файл / где', 'Пояснение'],
  cols: [16, 14, 40, 30, 60],
  rows: Object.values(ASSETS).map((a) => [
    a.id,
    a.kind === 'template' ? 'Шаблон' : a.kind === 'instruction' ? 'Инструкция' : 'Скрипт',
    a.title,
    a.filename ? a.filename : 'инлайн в портале',
    a.note ?? '',
  ]),
};

async function main() {
  const outdir = process.argv[2] || join(process.cwd(), 'proto-out');
  await mkdir(outdir, { recursive: true });
  const sheets: Sheet[] = [
    overview,
    tierSheet(1),
    tierSheet(2),
    tierSheet(3),
    tierSheet(4),
    assetsSheet,
  ];
  const buf = makeXlsx(sheets);
  const out = join(outdir, 'Уровни-аудита-T1-T4.xlsx');
  await writeFile(out, buf);
  const total = BLOCKS.reduce((s, b) => s + b.reqs.length, 0);
  console.log(`✓ ${out}`);
  console.log(`  блоков: ${BLOCKS.length}, требований всего: ${total}`);
  for (const t of TIERS) console.log(`  ${t.code}: ${flatReqsAtTier(t.tier).length} требований (кумулятивно)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

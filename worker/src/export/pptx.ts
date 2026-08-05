/**
 * Экспорт AD-15 в .pptx из слайд-модели. Фирменный лаймовый акцент (как в
 * портале), титульник + контентные слайды. Первый слайд модели — обложка.
 */
import pptxgen from 'pptxgenjs';
import { writeFile } from 'node:fs/promises';
import type { Slide } from '../deliverables.js';

const INK = '12161C';
const LIME = '65A30D';
const MUTED = '5A6472';

export async function exportAD15Pptx(
  model: Slide[],
  meta: { name: string; tier: number; date: string },
  outPath: string,
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5"
  pptx.author = 'Commerce OS';
  pptx.company = 'weexp';

  const footer = (slide: pptxgen.Slide) => {
    slide.addText(`Commerce OS · ${meta.name} · L0 черновик · не для рассылки без правки`, {
      x: 0.5, y: 7.0, w: 12.33, h: 0.3, fontSize: 9, color: MUTED, align: 'left', fontFace: 'Arial',
    });
  };

  model.forEach((s, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    if (idx === 0) {
      // Обложка
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: LIME } });
      slide.addText('Commerce OS · Диагностика', { x: 0.9, y: 2.2, w: 11, h: 0.5, fontSize: 16, color: LIME, fontFace: 'Arial', bold: true });
      slide.addText(s.title, { x: 0.9, y: 2.8, w: 11.5, h: 1.4, fontSize: 44, color: INK, fontFace: 'Arial', bold: true });
      if (s.subtitle) slide.addText(s.subtitle, { x: 0.9, y: 4.3, w: 11, h: 0.6, fontSize: 18, color: MUTED, fontFace: 'Arial' });
      slide.addText(s.bullets.join('\n'), { x: 0.9, y: 5.1, w: 11, h: 1.2, fontSize: 13, color: MUTED, fontFace: 'Arial', bullet: false });
      footer(slide);
      return;
    }

    // Контентный слайд
    slide.addText(`${s.n}`, { x: 0.5, y: 0.45, w: 0.8, h: 0.6, fontSize: 24, color: LIME, fontFace: 'Arial', bold: true });
    slide.addText(s.title, { x: 1.25, y: 0.45, w: 11.5, h: 0.7, fontSize: 26, color: INK, fontFace: 'Arial', bold: true });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.25, w: 12.33, h: 0, line: { color: LIME, width: 2 } });
    if (s.subtitle) slide.addText(s.subtitle, { x: 0.5, y: 1.4, w: 12.33, h: 0.5, fontSize: 15, color: LIME, fontFace: 'Arial', bold: true });

    const items = s.bullets.map((b) => {
      const sub = b.startsWith('  ');
      return { text: sub ? b.trim() : b, options: { fontSize: sub ? 13 : 15, color: sub ? MUTED : INK, indentLevel: sub ? 1 : 0, bullet: { indent: 12 }, paraSpaceAfter: 6, fontFace: 'Arial' } };
    });
    slide.addText(items as any, { x: 0.6, y: s.subtitle ? 2.0 : 1.6, w: 12.1, h: 4.8, valign: 'top' });
    if (s.note) slide.addText(s.note, { x: 0.6, y: 6.4, w: 12.1, h: 0.5, fontSize: 11, italic: true, color: MUTED, fontFace: 'Arial' });
    footer(slide);
  });

  const buf = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  await writeFile(outPath, buf);
}

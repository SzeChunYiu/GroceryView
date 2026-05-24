import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

export type FlyerOcrTool = 'pdftotext' | 'tesseract' | 'provided_text';

export type FlyerPromotionExtraction = {
  rowType: 'flyer_promotion_extraction';
  productName: string;
  price: number;
  priceText: string;
  promoText: string;
  pageNumber: number;
  sourceUrl: string;
  capturedAt: string;
  confidence: number;
  manualReviewRequired: boolean;
  ocrTool: FlyerOcrTool;
  promotionRouterInput: {
    rowType: 'promotion_candidate';
    sourceKind: 'flyer_ocr';
    productName: string;
    promoText: string;
    price: number;
    sourceUrl: string;
    confidence: number;
    manualReviewRequired: boolean;
  };
};

export type ParseFlyerPdfOptions = {
  sourceUrl: string;
  capturedAt?: string;
  textExtractor?: (pdf: Uint8Array) => Promise<{ text: string; tool: FlyerOcrTool }>;
};

function parsePrice(value: string) {
  const parsed = Number(value.replace(',', '.').replace(':', '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

function confidenceFor(productName: string, promoText: string, price: number) {
  let confidence = 0.42;
  if (productName.length >= 4) confidence += 0.18;
  if (/[A-Za-zÅÄÖåäö]{3,}/.test(productName)) confidence += 0.12;
  if (price > 0 && price < 1000) confidence += 0.18;
  if (/kr|:-|st|kg|jfr|ord|medlem/i.test(promoText)) confidence += 0.1;
  return Math.min(0.95, Math.round(confidence * 100) / 100);
}

export function parseFlyerText(text: string, options: { sourceUrl: string; capturedAt?: string; ocrTool?: FlyerOcrTool }): FlyerPromotionExtraction[] {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const rows: FlyerPromotionExtraction[] = [];
  const normalizedLines = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  normalizedLines.forEach((line, index) => {
    const match = line.match(/^(.{3,}?)\s+(\d{1,3}(?:[,:]\d{1,2})?)\s*(?:kr|:-|sek)?(?:\s|$)(.*)$/i);
    if (!match) return;
    const productName = match[1]!.replace(/[•*]+/g, '').trim();
    const price = parsePrice(match[2]!);
    if (!productName || price == null) return;
    const promoText = [match[2], match[3]].filter(Boolean).join(' ').trim() || line;
    const confidence = confidenceFor(productName, promoText, price);
    const manualReviewRequired = confidence < 0.7;
    rows.push({
      rowType: 'flyer_promotion_extraction',
      productName,
      price,
      priceText: match[2]!,
      promoText,
      pageNumber: 1,
      sourceUrl: options.sourceUrl,
      capturedAt,
      confidence,
      manualReviewRequired,
      ocrTool: options.ocrTool ?? 'provided_text',
      promotionRouterInput: {
        rowType: 'promotion_candidate',
        sourceKind: 'flyer_ocr',
        productName,
        promoText,
        price,
        sourceUrl: options.sourceUrl,
        confidence,
        manualReviewRequired
      }
    });
  });

  return rows.sort((left, right) => right.confidence - left.confidence || left.productName.localeCompare(right.productName, 'sv'));
}

function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(stdout).toString('utf8'));
      else reject(new Error(`${command} exited with ${code}: ${Buffer.concat(stderr).toString('utf8')}`));
    });
  });
}

export async function extractFlyerTextWithLocalOcr(pdf: Uint8Array): Promise<{ text: string; tool: FlyerOcrTool }> {
  const directory = await mkdtemp(join(tmpdir(), 'groceryview-flyer-'));
  const pdfPath = join(directory, 'flyer.pdf');
  try {
    await writeFile(pdfPath, pdf);
    try {
      return { text: await runCommand('pdftotext', ['-layout', pdfPath, '-']), tool: 'pdftotext' };
    } catch {
      return { text: await runCommand('tesseract', [pdfPath, 'stdout', '--psm', '6']), tool: 'tesseract' };
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function parseFlyerPdf(pdf: Uint8Array, options: ParseFlyerPdfOptions): Promise<FlyerPromotionExtraction[]> {
  const extracted = await (options.textExtractor ?? extractFlyerTextWithLocalOcr)(pdf);
  return parseFlyerText(extracted.text, {
    sourceUrl: options.sourceUrl,
    capturedAt: options.capturedAt,
    ocrTool: extracted.tool
  });
}

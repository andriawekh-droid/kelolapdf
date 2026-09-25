import { PDFDocument, rgb, degrees, StandardFonts } from '@cantoo/pdf-lib';

/**
 * 1. Gabung PDF (Merge)
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * 2. Pisah PDF (Split by page ranges, e.g. "1-3, 5")
 */
export async function splitPdf(file: File, rangeInput: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = srcDoc.getPageCount();

  const newDoc = await PDFDocument.create();
  const pageIndicesToCopy: number[] = [];

  // Parse ranges like "1-3, 5, 7-9"
  const parts = rangeInput.split(',').map((p) => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      for (let i = start; i <= end; i++) {
        if (!pageIndicesToCopy.includes(i - 1)) {
          pageIndicesToCopy.push(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        if (!pageIndicesToCopy.includes(pageNum - 1)) {
          pageIndicesToCopy.push(pageNum - 1);
        }
      }
    }
  }

  // Fallback to first page if invalid range
  const targetIndices = pageIndicesToCopy.length > 0 ? pageIndicesToCopy : [0];
  const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
  copiedPages.forEach((p) => newDoc.addPage(p));

  return await newDoc.save();
}

/**
 * 3. Putar PDF (Rotate all or specific pages)
 */
export async function rotatePdf(file: File, angleDegrees: number): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + angleDegrees) % 360));
  });

  return await pdfDoc.save();
}

/**
 * 4. Kunci PDF (Password Encrypt)
 */
export async function protectPdf(file: File, userPassword: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // @cantoo/pdf-lib encrypt
  if (typeof (pdfDoc as any).encrypt === 'function') {
    await (pdfDoc as any).encrypt({
      userPassword: userPassword,
      ownerPassword: userPassword,
    });
  }

  return await pdfDoc.save();
}

/**
 * 5. Watermark PDF
 */
export async function addWatermarkPdf(
  file: File,
  watermarkText: string,
  opacity: number = 0.35
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 10;
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font: font,
      color: rgb(0.8, 0.1, 0.1),
      opacity: opacity,
      rotate: degrees(45),
    });
  });

  return await pdfDoc.save();
}

/**
 * 6. Nomor Halaman (Page Numbering)
 */
export async function addPageNumbersPdf(
  file: File,
  position: 'bottom-right' | 'bottom-center' = 'bottom-center',
  skipFirstPage: boolean = false
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  pages.forEach((page, index) => {
    if (skipFirstPage && index === 0) return;

    const { width } = page.getSize();
    const pageNumText = `Halaman ${index + 1} dari ${total}`;
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);

    let x = width / 2 - textWidth / 2;
    if (position === 'bottom-right') {
      x = width - textWidth - 36;
    }

    page.drawText(pageNumText, {
      x,
      y: 24,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return await pdfDoc.save();
}

/**
 * 7. Gambar ke PDF (Image to PDF)
 */
export async function imagesToPdf(
  imageFiles: File[],
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const imgFile of imageFiles) {
    const arrayBuffer = await imgFile.arrayBuffer();
    let embeddedImg;

    if (imgFile.type.includes('png')) {
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    }

    // A4 dimensions in points: 595.28 x 841.89
    const pageWidth = orientation === 'portrait' ? 595.28 : 841.89;
    const pageHeight = orientation === 'portrait' ? 841.89 : 595.28;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Scale image maintaining aspect ratio with margin
    const margin = 36;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scale = Math.min(
      availableWidth / embeddedImg.width,
      availableHeight / embeddedImg.height,
      1
    );

    const scaledWidth = embeddedImg.width * scale;
    const scaledHeight = embeddedImg.height * scale;

    page.drawImage(embeddedImg, {
      x: (pageWidth - scaledWidth) / 2,
      y: (pageHeight - scaledHeight) / 2,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Trigger browser download for generated bytes
 */
export function downloadPdfBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

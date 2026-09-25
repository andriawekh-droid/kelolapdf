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
 * 8. Tanda Tangan PDF (E-Sign)
 */
export async function addSignatureToPdf(
  file: File,
  signatureDataUrl: string,
  options: {
    pageNumber?: 'last' | 'first' | 'all' | number;
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
    scale?: number;
    customPlacement?: {
      pageNumber: number; // 1-indexed
      xPercent: number;   // 0 - 100 % from left
      yPercent: number;   // 0 - 100 % from top
      widthPercent: number; // % width of page
    };
  }
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Convert base64 dataURL to Uint8Array
  const base64Data = signatureDataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const pngImage = await pdfDoc.embedPng(bytes);
  const totalPages = pdfDoc.getPageCount();

  // If user used visual drag-and-drop placement
  if (options.customPlacement) {
    const { pageNumber, xPercent, yPercent, widthPercent } = options.customPlacement;
    const targetIdx = Math.max(0, Math.min(totalPages - 1, pageNumber - 1));
    const page = pdfDoc.getPage(targetIdx);
    const { width, height } = page.getSize();

    const sigWidth = (widthPercent / 100) * width;
    const sigHeight = (pngImage.height / pngImage.width) * sigWidth;
    const x = (xPercent / 100) * width;
    // PDF coordinate (0,0) is bottom-left, DOM coordinate is top-left
    const y = height - ((yPercent / 100) * height) - sigHeight;

    page.drawImage(pngImage, {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: sigWidth,
      height: sigHeight,
    });

    return await pdfDoc.save();
  }

  const pagesToSign: number[] = [];
  if (options.pageNumber === 'last') {
    pagesToSign.push(totalPages - 1);
  } else if (options.pageNumber === 'first') {
    pagesToSign.push(0);
  } else if (options.pageNumber === 'all') {
    for (let i = 0; i < totalPages; i++) pagesToSign.push(i);
  } else if (typeof options.pageNumber === 'number') {
    const p = Math.max(0, Math.min(totalPages - 1, Number(options.pageNumber) - 1));
    pagesToSign.push(p);
  } else {
    pagesToSign.push(totalPages - 1);
  }

  const sigWidth = 140 * (options.scale || 1);
  const sigHeight = (pngImage.height / pngImage.width) * sigWidth;

  for (const pageIdx of pagesToSign) {
    const page = pdfDoc.getPage(pageIdx);
    const { width } = page.getSize();

    let x = width - sigWidth - 60; // default bottom-right
    if (options.position === 'bottom-left') {
      x = 60;
    } else if (options.position === 'bottom-center') {
      x = (width - sigWidth) / 2;
    }

    const y = 60; // bottom margin

    page.drawImage(pngImage, {
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * 9. Atur & Urutkan Halaman (Arrange)
 */
export async function arrangePdfPages(file: File, activeIndices: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const outDoc = await PDFDocument.create();

  const pages = await outDoc.copyPages(srcDoc, activeIndices);
  pages.forEach((p) => outDoc.addPage(p));

  return await outDoc.save();
}

/**
 * Mendapatkan jumlah total halaman PDF
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * 10. Hapus Password / Buka Kunci (Unlock)
 */
export async function unlockPdf(file: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  // Muat dengan password yang valid
  const doc = await PDFDocument.load(arrayBuffer, { password } as any);
  // Simpan ulang tanpa enkripsi
  return await doc.save();
}

/**
 * 11. Edit Metadata Dokumen
 */
export async function updatePdfMetadata(
  file: File,
  meta: { title?: string; author?: string; subject?: string; keywords?: string }
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer);

  if (meta.title) doc.setTitle(meta.title);
  if (meta.author) doc.setAuthor(meta.author);
  if (meta.subject) doc.setSubject(meta.subject);
  if (meta.keywords) doc.setKeywords(meta.keywords.split(',').map((k) => k.trim()));

  return await doc.save();
}

/**
 * 12. Potong Margin (Crop)
 */
export async function cropPdf(file: File, marginPt: number = 30): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer);
  const pages = doc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.setCropBox(
      marginPt,
      marginPt,
      Math.max(10, width - marginPt * 2),
      Math.max(10, height - marginPt * 2)
    );
  });

  return await doc.save();
}

/**
 * 13. Ubah Ukuran Kertas (Resize)
 */
export async function resizePdfPages(
  file: File,
  targetSize: 'A4' | 'Letter' | 'F4' = 'A4'
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const outDoc = await PDFDocument.create();

  // Dimensi dalam poin PDF (72 dpi)
  let targetW = 595.28; // A4
  let targetH = 841.89;
  if (targetSize === 'Letter') {
    targetW = 612;
    targetH = 792;
  } else if (targetSize === 'F4') {
    targetW = 612; // Folio / F4 standar Indonesia
    targetH = 936;
  }

  const pagesCount = srcDoc.getPageCount();
  for (let i = 0; i < pagesCount; i++) {
    const [embedded] = await outDoc.embedPdf(srcDoc, [i]);
    const page = outDoc.addPage([targetW, targetH]);

    const scale = Math.min(targetW / embedded.width, targetH / embedded.height, 1);
    const scaledW = embedded.width * scale;
    const scaledH = embedded.height * scale;

    page.drawPage(embedded, {
      x: (targetW - scaledW) / 2,
      y: (targetH - scaledH) / 2,
      xScale: scale,
      yScale: scale,
    });
  }

  return await outDoc.save();
}

export interface RedactBoxItem {
  id?: string;
  pageNumber: number; // 1-indexed
  xPercent: number;   // 0 - 100 % from left
  yPercent: number;   // 0 - 100 % from top
  widthPercent: number; // % width of page
  heightPercent: number; // % height of page
}

/**
 * 14. Sensor Data Rahasia (Redact)
 */
export async function redactPdfPages(
  file: File,
  options: {
    pageTarget?: 'first' | 'last' | 'all';
    area?: 'top' | 'middle' | 'bottom';
    customBoxes?: RedactBoxItem[];
  }
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer);
  const total = doc.getPageCount();

  // If user placed custom visual blackout boxes
  if (options.customBoxes && options.customBoxes.length > 0) {
    for (const box of options.customBoxes) {
      const pageIdx = Math.max(0, Math.min(total - 1, box.pageNumber - 1));
      const page = doc.getPage(pageIdx);
      const { width, height } = page.getSize();

      const boxW = (box.widthPercent / 100) * width;
      const boxH = (box.heightPercent / 100) * height;
      const x = (box.xPercent / 100) * width;
      // Convert top-left DOM coordinate to bottom-left PDF coordinate
      const y = height - ((box.yPercent / 100) * height) - boxH;

      page.drawRectangle({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: boxW,
        height: boxH,
        color: rgb(0, 0, 0),
      });
    }

    return await doc.save();
  }

  // Fallback to presets
  const targetPages: number[] = [];
  if (options.pageTarget === 'first') targetPages.push(0);
  else if (options.pageTarget === 'last') targetPages.push(total - 1);
  else for (let i = 0; i < total; i++) targetPages.push(i);

  targetPages.forEach((idx) => {
    const page = doc.getPage(idx);
    const { width, height } = page.getSize();
    const boxHeight = 60;
    let y = 50; // bottom

    if (options.area === 'top') {
      y = height - boxHeight - 50;
    } else if (options.area === 'middle') {
      y = (height - boxHeight) / 2;
    }

    page.drawRectangle({
      x: 40,
      y,
      width: width - 80,
      height: boxHeight,
      color: rgb(0, 0, 0),
    });
  });

  return await doc.save();
}

/**
 * 15. PDF ke Gambar ZIP (PDF to Images)
 */
export async function pdfToImagesZip(
  file: File,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfJsDoc = await loadingTask.promise;
  const numPages = pdfJsDoc.numPages;

  const zip = new JSZip();
  const ext = format === 'image/png' ? 'png' : 'jpg';

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);
    const page = await pdfJsDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({ canvasContext: ctx, viewport }).promise;

    const imgBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, format, 0.9);
    });

    if (imgBlob) {
      zip.file(`halaman-${i}.${ext}`, imgBlob);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * 16. OCR / Ekstraksi Teks Digital dari PDF
 */
export async function extractPdfText(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfJsDoc = await loadingTask.promise;
  const numPages = pdfJsDoc.numPages;

  let fullText = '';
  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);
    const page = await pdfJsDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .trim();

    fullText += `=== Halaman ${i} ===\n${pageText || '[Tidak ada teks digital yang terdeteksi pada halaman ini]'}\n\n`;
  }

  return fullText;
}

/**
 * Trigger browser download for generated bytes or blobs
 */
export function downloadPdfBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}


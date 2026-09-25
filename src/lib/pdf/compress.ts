import { PDFDocument } from '@cantoo/pdf-lib';

export interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  percentageSaved: number;
}

export type CompressLevel = 'maksimal' | 'seimbang' | 'ringan';

const COMPRESS_PRESETS: Record<CompressLevel, { scale: number; quality: number }> = {
  maksimal: { scale: 0.9, quality: 0.45 }, // Ukuran paling kecil
  seimbang: { scale: 1.2, quality: 0.65 }, // Seimbang (Disarankan)
  ringan: { scale: 1.5, quality: 0.82 },   // Ringan, kualitas gambar tajam
};

export async function compressPdf(
  file: File,
  level: CompressLevel = 'seimbang',
  onProgress?: (current: number, total: number) => void
): Promise<CompressResult> {
  const arrayBuffer = await file.arrayBuffer();
  const originalSize = file.size;

  // Import pdfjs-dist dynamically in client environment
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdfJsDoc = await loadingTask.promise;
  const numPages = pdfJsDoc.numPages;

  const preset = COMPRESS_PRESETS[level] || COMPRESS_PRESETS.seimbang;
  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) {
      onProgress(i, numPages);
    }

    const page = await pdfJsDoc.getPage(i);
    const viewport = page.getViewport({ scale: preset.scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;

    // Fill white background first so transparent backgrounds do not turn black in JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({
      canvasContext: ctx,
      viewport,
    }).promise;

    const jpegBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', preset.quality);
    });

    if (jpegBlob) {
      const jpegArrayBuffer = await jpegBlob.arrayBuffer();
      const embeddedJpg = await outDoc.embedJpg(jpegArrayBuffer);
      const outPage = outDoc.addPage([canvas.width, canvas.height]);
      outPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
    }
  }

  const compressedBytes = await outDoc.save();
  const compressedSize = compressedBytes.byteLength;
  const percentageSaved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));

  return {
    bytes: compressedBytes,
    originalSize,
    compressedSize,
    percentageSaved,
  };
}

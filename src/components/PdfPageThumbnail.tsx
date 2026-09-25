'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PdfPageThumbnailProps {
  file: File;
  pageNumber: number; // 1-indexed
  className?: string;
}

export const PdfPageThumbnail: React.FC<PdfPageThumbnailProps> = ({
  file,
  pageNumber,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        setLoading(true);
        const pdfjsLib = await import('pdfjs-dist');
        if (typeof window !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
        }

        const arrayBuffer = await file.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Render mini scale
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = 110 / unscaledViewport.width; // Fixed thumbnail width ~110px
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await (page.render as any)({
          canvasContext: ctx,
          viewport,
        }).promise;

        setLoading(false);
      } catch {
        if (!isCancelled) setLoading(false);
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [file, pageNumber]);

  return (
    <div className={`relative bg-stone-100 rounded border border-stone-200 overflow-hidden flex items-center justify-center ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
        </div>
      )}
      <canvas ref={canvasRef} className="block w-full h-auto" />
    </div>
  );
};

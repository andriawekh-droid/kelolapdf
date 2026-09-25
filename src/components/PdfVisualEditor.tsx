'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Move,
  Maximize2,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Crop,
  Stamp,
  RotateCw,
  Hash,
} from 'lucide-react';
import { RedactBoxItem } from '@/lib/pdf/core';

export interface PdfVisualEditorProps {
  file: File;
  mode: 'sign' | 'redact' | 'crop' | 'watermark' | 'rotate' | 'page-numbers' | 'preview';
  // Sign Props
  signatureDataUrl?: string | null;
  signPlacement?: {
    pageNumber: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
  };
  onSignPlacementChange?: (placement: {
    pageNumber: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
  }) => void;
  // Redact Props
  redactBoxes?: RedactBoxItem[];
  onRedactBoxesChange?: (boxes: RedactBoxItem[]) => void;
  // Crop Props
  cropMargin?: number; // in points (15, 30, 50)
  // Watermark Props
  watermarkText?: string;
  watermarkOpacity?: number;
  // Rotate Props
  rotateAngle?: number;
  // Page Numbers Props
  pageNumberPos?: 'bottom-center' | 'bottom-right';
  skipCover?: boolean;
}

export const PdfVisualEditor: React.FC<PdfVisualEditorProps> = ({
  file,
  mode,
  signatureDataUrl,
  signPlacement,
  onSignPlacementChange,
  redactBoxes = [],
  onRedactBoxesChange,
  cropMargin = 30,
  watermarkText = 'DRAFT',
  watermarkOpacity = 0.35,
  rotateAngle = 0,
  pageNumberPos = 'bottom-center',
  skipCover = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dragging state for signature
  const [isDraggingSign, setIsDraggingSign] = useState(false);
  const [signDragOffset, setSignDragOffset] = useState({ x: 0, y: 0 });

  // Dragging / Resizing state for redact box
  const [activeRedactId, setActiveRedactId] = useState<string | null>(null);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [boxDragOffset, setBoxDragOffset] = useState({ x: 0, y: 0 });

  // Resizing state
  const [resizingBox, setResizingBox] = useState<{
    id: string;
    handle: 'right' | 'bottom' | 'corner';
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  // Load and render PDF page
  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      try {
        setIsLoadingPdf(true);
        setRenderError(null);

        const pdfjsLib = await import('pdfjs-dist');
        if (typeof window !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
        }

        const arrayBuffer = await file.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        setTotalPages(pdfDoc.numPages);
        const validPage = Math.max(1, Math.min(pdfDoc.numPages, currentPage));
        const page = await pdfDoc.getPage(validPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Container width calculation for responsive rendering
        const containerWidth = containerRef.current?.clientWidth || 500;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const desiredScale = Math.min(2.0, Math.max(0.6, (containerWidth - 20) / unscaledViewport.width));
        const viewport = page.getViewport({ scale: desiredScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await (page.render as any)({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        setIsLoadingPdf(false);
      } catch (err: any) {
        if (!isCancelled) {
          setRenderError('Gagal memuat pratinjau halaman PDF.');
          setIsLoadingPdf(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [file, currentPage]);

  // Keep signPlacement page in sync if user changes page
  useEffect(() => {
    if (mode === 'sign' && onSignPlacementChange && signPlacement) {
      if (signPlacement.pageNumber !== currentPage) {
        onSignPlacementChange({
          ...signPlacement,
          pageNumber: currentPage,
        });
      }
    }
  }, [currentPage, mode]);

  // --- SIGNATURE DRAGGING HANDLERS ---
  const handleSignMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingSign(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = ((signPlacement?.xPercent || 50) / 100) * rect.width;
      const currentY = ((signPlacement?.yPercent || 70) / 100) * rect.height;
      setSignDragOffset({
        x: clientX - rect.left - currentX,
        y: clientY - rect.top - currentY,
      });
    }
  };

  // --- REDACT BOX ACTIONS ---
  const addRedactBox = () => {
    if (!onRedactBoxesChange) return;
    const newId = `box_${Date.now()}`;
    const newBox: RedactBoxItem = {
      id: newId,
      pageNumber: currentPage,
      xPercent: 15,
      yPercent: 25,
      widthPercent: 70,
      heightPercent: 8,
    };
    onRedactBoxesChange([...redactBoxes, newBox]);
    setActiveRedactId(newId);
  };

  const removeRedactBox = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRedactBoxesChange) return;
    onRedactBoxesChange(redactBoxes.filter((b) => b.id !== id));
    if (activeRedactId === id) setActiveRedactId(null);
  };

  const handleBoxMouseDown = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setActiveRedactId(id);
    setIsDraggingBox(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const activeBox = redactBoxes.find((b) => b.id === id);
      if (activeBox) {
        const currentX = (activeBox.xPercent / 100) * rect.width;
        const currentY = (activeBox.yPercent / 100) * rect.height;
        setBoxDragOffset({
          x: clientX - rect.left - currentX,
          y: clientY - rect.top - currentY,
        });
      }
    }
  };

  const startResize = (
    id: string,
    handle: 'right' | 'bottom' | 'corner',
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    setActiveRedactId(id);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const activeBox = redactBoxes.find((b) => b.id === id);
    if (activeBox) {
      setResizingBox({
        id,
        handle,
        startX: clientX,
        startY: clientY,
        startW: activeBox.widthPercent,
        startH: activeBox.heightPercent,
      });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Handle Signature Drag
    if (isDraggingSign && onSignPlacementChange && signPlacement) {
      const mouseX = clientX - rect.left - signDragOffset.x;
      const mouseY = clientY - rect.top - signDragOffset.y;

      const xPercent = Math.max(0, Math.min(100 - signPlacement.widthPercent, (mouseX / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(90, (mouseY / rect.height) * 100));

      onSignPlacementChange({
        ...signPlacement,
        pageNumber: currentPage,
        xPercent,
        yPercent,
      });
    }

    // Handle Redact Box Drag
    if (isDraggingBox && activeRedactId && onRedactBoxesChange && !resizingBox) {
      const activeBox = redactBoxes.find((b) => b.id === activeRedactId);
      if (!activeBox) return;

      const mouseX = clientX - rect.left - boxDragOffset.x;
      const mouseY = clientY - rect.top - boxDragOffset.y;

      const xPercent = Math.max(0, Math.min(100 - activeBox.widthPercent, (mouseX / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100 - activeBox.heightPercent, (mouseY / rect.height) * 100));

      onRedactBoxesChange(
        redactBoxes.map((box) =>
          box.id === activeRedactId
            ? { ...box, pageNumber: currentPage, xPercent, yPercent }
            : box
        )
      );
    }

    // Handle Redact Box Resize (Width, Height, or Diagonal Corner)
    if (resizingBox && onRedactBoxesChange) {
      const deltaX = ((clientX - resizingBox.startX) / rect.width) * 100;
      const deltaY = ((clientY - resizingBox.startY) / rect.height) * 100;
      const activeBox = redactBoxes.find((b) => b.id === resizingBox.id);
      if (!activeBox) return;

      let newW = activeBox.widthPercent;
      let newH = activeBox.heightPercent;

      if (resizingBox.handle === 'right' || resizingBox.handle === 'corner') {
        newW = Math.max(6, Math.min(98 - activeBox.xPercent, resizingBox.startW + deltaX));
      }
      if (resizingBox.handle === 'bottom' || resizingBox.handle === 'corner') {
        newH = Math.max(2.5, Math.min(95 - activeBox.yPercent, resizingBox.startH + deltaY));
      }

      onRedactBoxesChange(
        redactBoxes.map((box) =>
          box.id === resizingBox.id
            ? { ...box, widthPercent: newW, heightPercent: newH }
            : box
        )
      );
    }
  };

  const handleContainerMouseUp = () => {
    setIsDraggingSign(false);
    setIsDraggingBox(false);
    setResizingBox(null);
  };

  // Quick preset positioning for signature
  const setSignPreset = (pos: 'bottom-right' | 'bottom-left' | 'bottom-center') => {
    if (!onSignPlacementChange || !signPlacement) return;
    let x = 65;
    if (pos === 'bottom-left') x = 10;
    if (pos === 'bottom-center') x = 38;

    onSignPlacementChange({
      ...signPlacement,
      pageNumber: currentPage,
      xPercent: x,
      yPercent: 75,
    });
  };

  const currentRedactBoxes = redactBoxes.filter((b) => b.pageNumber === currentPage);

  // Crop percentage calculation (approx 30pt out of ~600pt A4 width ≈ 5%)
  const cropPercent = Math.min(18, Math.max(2, (cropMargin / 600) * 100));

  return (
    <div className="space-y-3">
      {/* Top Bar Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100/80 p-2.5 rounded-xl border border-stone-200 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-stone-700">
          <Eye className="w-3.5 h-3.5 text-stone-500" />
          <span>Pratinjau Dokumen PDF:</span>
          {mode === 'crop' && (
            <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-semibold">
              Garis Potong ({cropMargin}pt)
            </span>
          )}
          {mode === 'watermark' && (
            <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-semibold">
              Cap Watermark
            </span>
          )}
          {mode === 'rotate' && (
            <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-semibold">
              Rotasi {rotateAngle}°
            </span>
          )}
        </div>

        {/* Page Paginator */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200 shadow-2xs">
          <button
            type="button"
            disabled={currentPage <= 1 || isLoadingPdf}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600 rounded transition"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-stone-800 px-1 text-[11px]">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages || isLoadingPdf}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600 rounded transition"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Specific Toolbar */}
      {mode === 'sign' && signatureDataUrl && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-amber-900">
            <Move className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-medium text-[11px]">
              Geser tanda tangan di lembar bawah ke posisi yang Anda inginkan
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-amber-800 font-semibold">Posisi Cepat:</span>
            <button
              type="button"
              onClick={() => setSignPreset('bottom-right')}
              className="px-2 py-0.5 bg-white border border-amber-300 text-[10px] font-medium text-amber-900 rounded hover:bg-amber-100 transition"
            >
              Kanan Bawah
            </button>
            <button
              type="button"
              onClick={() => setSignPreset('bottom-center')}
              className="px-2 py-0.5 bg-white border border-amber-300 text-[10px] font-medium text-amber-900 rounded hover:bg-amber-100 transition"
            >
              Tengah Bawah
            </button>
            <button
              type="button"
              onClick={() => setSignPreset('bottom-left')}
              className="px-2 py-0.5 bg-white border border-amber-300 text-[10px] font-medium text-amber-900 rounded hover:bg-amber-100 transition"
            >
              Kiri Bawah
            </button>
          </div>
        </div>
      )}

      {mode === 'redact' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100 p-2.5 rounded-xl border border-stone-200 text-xs">
          <div className="text-stone-700 text-[11px]">
            <span>Kotak sensor lembar {currentPage}: </span>
            <span className="font-bold text-stone-900">{currentRedactBoxes.length}</span>
            <span className="text-stone-500"> (Total semua lembar: {redactBoxes.length})</span>
          </div>

          <button
            type="button"
            onClick={addRedactBox}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium text-[11px] shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            + Tambah Kotak Sensor
          </button>
        </div>
      )}

      {/* Interactive PDF Page Visual Container */}
      <div
        ref={containerRef}
        onMouseMove={handleContainerMouseMove}
        onTouchMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onTouchEnd={handleContainerMouseUp}
        className="relative mx-auto bg-stone-200/90 rounded-2xl p-2 sm:p-4 overflow-hidden shadow-inner flex items-center justify-center select-none"
        style={{ minHeight: '380px', maxHeight: '560px' }}
      >
        {isLoadingPdf && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-2xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-xs text-stone-600 font-medium">Memuat pratinjau lembar {currentPage}...</span>
          </div>
        )}

        {renderError ? (
          <div className="p-6 text-center text-red-600 text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span>{renderError}</span>
          </div>
        ) : (
          <div
            style={{
              transform: mode === 'rotate' ? `rotate(${rotateAngle}deg)` : undefined,
              transition: 'transform 0.25s ease',
            }}
            className="relative inline-block border border-stone-300 shadow-md bg-white rounded-md overflow-hidden max-w-full"
          >
            <canvas ref={canvasRef} className="block w-full h-auto max-w-full" />

            {/* --- VISUAL OVERLAY: CROP FRAME --- */}
            {mode === 'crop' && (
              <div
                style={{
                  top: `${cropPercent}%`,
                  bottom: `${cropPercent}%`,
                  left: `${cropPercent}%`,
                  right: `${cropPercent}%`,
                }}
                className="absolute z-20 pointer-events-none border-2 border-dashed border-cyan-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]"
              >
                <div className="absolute -top-6 left-0 bg-cyan-600 text-white text-[9px] px-1.5 py-0.5 rounded font-medium shadow-xs">
                  Area Dokumen yang Dipertahankan
                </div>
              </div>
            )}

            {/* --- VISUAL OVERLAY: WATERMARK --- */}
            {mode === 'watermark' && (
              <div
                style={{ opacity: watermarkOpacity }}
                className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden"
              >
                <span
                  style={{
                    transform: 'rotate(-45deg)',
                    fontSize: 'clamp(24px, 6vw, 48px)',
                  }}
                  className="font-black text-red-600 tracking-widest uppercase select-none drop-shadow-xs"
                >
                  {watermarkText || 'WATERMARK'}
                </span>
              </div>
            )}

            {/* --- VISUAL OVERLAY: PAGE NUMBERS --- */}
            {mode === 'page-numbers' && !(skipCover && currentPage === 1) && (
              <div
                style={{
                  bottom: '16px',
                  left: pageNumberPos === 'bottom-center' ? '50%' : undefined,
                  right: pageNumberPos === 'bottom-right' ? '24px' : undefined,
                  transform: pageNumberPos === 'bottom-center' ? 'translateX(-50%)' : undefined,
                }}
                className="absolute z-20 pointer-events-none bg-stone-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono shadow-xs"
              >
                Halaman {currentPage} dari {totalPages}
              </div>
            )}

            {/* --- VISUAL OVERLAY: SIGNATURE --- */}
            {mode === 'sign' && signatureDataUrl && signPlacement?.pageNumber === currentPage && (
              <div
                onMouseDown={handleSignMouseDown}
                onTouchStart={handleSignMouseDown}
                style={{
                  left: `${signPlacement.xPercent}%`,
                  top: `${signPlacement.yPercent}%`,
                  width: `${signPlacement.widthPercent}%`,
                }}
                className={`absolute z-30 cursor-grab active:cursor-grabbing border-2 rounded p-1 group transition-shadow ${
                  isDraggingSign
                    ? 'border-amber-500 shadow-xl bg-amber-500/10'
                    : 'border-amber-400 hover:border-amber-600 bg-amber-50/20 shadow-sm'
                }`}
              >
                <div className="absolute -top-5 left-0 bg-stone-900 text-white text-[9px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 shadow-xs pointer-events-none whitespace-nowrap">
                  <Move className="w-2.5 h-2.5 text-amber-400" />
                  <span>Tanda Tangan (Geser)</span>
                </div>
                <img
                  src={signatureDataUrl}
                  alt="Tanda Tangan"
                  className="w-full h-auto object-contain pointer-events-none drop-shadow-xs"
                />
              </div>
            )}

            {/* --- VISUAL OVERLAY: REDACT BLACKOUT BOXES --- */}
            {mode === 'redact' &&
              currentRedactBoxes.map((box) => {
                const isActive = activeRedactId === box.id;
                return (
                  <div
                    key={box.id}
                    onMouseDown={(e) => handleBoxMouseDown(box.id!, e)}
                    onTouchStart={(e) => handleBoxMouseDown(box.id!, e)}
                    style={{
                      left: `${box.xPercent}%`,
                      top: `${box.yPercent}%`,
                      width: `${box.widthPercent}%`,
                      height: `${box.heightPercent}%`,
                    }}
                    className={`absolute z-30 cursor-move border transition-colors ${
                      isActive
                        ? 'bg-black border-amber-400 ring-2 ring-amber-400/50'
                        : 'bg-black/95 border-stone-800 hover:border-amber-300'
                    }`}
                  >
                    {/* Top Tag & Delete Button */}
                    <div className="absolute -top-5 left-0 flex items-center gap-1">
                      <span className="bg-stone-900 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                        Sensor
                      </span>
                      <button
                        type="button"
                        onClick={(e) => removeRedactBox(box.id!, e)}
                        className="bg-red-600 hover:bg-red-700 text-white p-0.5 rounded shadow-xs cursor-pointer"
                        title="Hapus sensor ini"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Resizing handles when active */}
                    {isActive && (
                      <>
                        {/* 1. Right Handle (Width) */}
                        <div
                          onMouseDown={(e) => startResize(box.id!, 'right', e)}
                          onTouchStart={(e) => startResize(box.id!, 'right', e)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 bg-amber-400 cursor-ew-resize hover:bg-amber-500 rounded-r flex items-center justify-center z-40"
                          title="Tarik ke samping untuk ubah lebar"
                        >
                          <div className="w-0.5 h-3 bg-stone-900 rounded-full" />
                        </div>

                        {/* 2. Bottom Handle (Height) */}
                        <div
                          onMouseDown={(e) => startResize(box.id!, 'bottom', e)}
                          onTouchStart={(e) => startResize(box.id!, 'bottom', e)}
                          className="absolute left-0 right-0 bottom-0 h-2.5 bg-amber-400 cursor-ns-resize hover:bg-amber-500 rounded-b flex items-center justify-center z-40"
                          title="Tarik ke bawah untuk ubah tinggi"
                        >
                          <div className="h-0.5 w-3 bg-stone-900 rounded-full" />
                        </div>

                        {/* 3. Bottom-Right Corner Handle (Both Width & Height) */}
                        <div
                          onMouseDown={(e) => startResize(box.id!, 'corner', e)}
                          onTouchStart={(e) => startResize(box.id!, 'corner', e)}
                          className="absolute -right-1 -bottom-1 w-4 h-4 bg-amber-500 border border-white cursor-nwse-resize hover:bg-amber-600 rounded-full flex items-center justify-center shadow-xs z-50"
                          title="Tarik pojok untuk ubah lebar & tinggi sekaligus"
                        >
                          <Maximize2 className="w-2 h-2 text-stone-900 rotate-90" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Helpful Instructions based on mode */}
      {mode === 'sign' && !signatureDataUrl && (
        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          ⚠️ Buat atau unggah tanda tangan pada panel di atas terlebih dahulu, kemudian Anda bisa menggesernya secara visual pada lembar di atas.
        </p>
      )}

      {mode === 'redact' && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-[11px] text-stone-600 flex items-start gap-2">
          <span className="text-amber-600 font-bold">💡 Tips:</span>
          <span>
            Klik kotak sensor untuk mengaktifkannya. Tarik <strong>pojok kanan bawah</strong> untuk memperbesar/memperkecil tinggi dan lebar sekaligus, atau tarik sisi kanan untuk melebarkan.
          </span>
        </div>
      )}

      {mode === 'crop' && (
        <p className="text-[11px] text-cyan-700 bg-cyan-50 p-2 rounded-lg border border-cyan-200">
          Garis putus-putus biru menunjukkan lembar yang akan dipertahankan. Bagian yang lebih gelap di luar garis akan dipangkas.
        </p>
      )}

      {mode === 'watermark' && (
        <p className="text-[11px] text-pink-700 bg-pink-50 p-2 rounded-lg border border-pink-200">
          Pratinjau di atas menampilkan teks cap watermark miring 45° dan tingkat transparansi sesuai pengaturan Anda.
        </p>
      )}

      {mode === 'rotate' && (
        <p className="text-[11px] text-orange-700 bg-orange-50 p-2 rounded-lg border border-orange-200">
          Pratinjau lembar langsung berputar {rotateAngle}° sesuai pilihan Anda di atas.
        </p>
      )}
    </div>
  );
};

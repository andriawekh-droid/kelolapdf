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
} from 'lucide-react';
import { RedactBoxItem } from '@/lib/pdf/core';

interface PdfVisualEditorProps {
  file: File;
  mode: 'sign' | 'redact';
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
}

export const PdfVisualEditor: React.FC<PdfVisualEditorProps> = ({
  file,
  mode,
  signatureDataUrl,
  signPlacement,
  onSignPlacementChange,
  redactBoxes = [],
  onRedactBoxesChange,
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

  // Dragging state for redact box
  const [activeRedactId, setActiveRedactId] = useState<string | null>(null);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [boxDragOffset, setBoxDragOffset] = useState({ x: 0, y: 0 });

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
    if (isDraggingBox && activeRedactId && onRedactBoxesChange) {
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
  };

  const handleContainerMouseUp = () => {
    setIsDraggingSign(false);
    setIsDraggingBox(false);
  };

  // --- REDACT BOX ACTIONS ---
  const addRedactBox = () => {
    if (!onRedactBoxesChange) return;
    const newId = `box_${Date.now()}`;
    const newBox: RedactBoxItem = {
      id: newId,
      pageNumber: currentPage,
      xPercent: 20,
      yPercent: 30,
      widthPercent: 60,
      heightPercent: 6,
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

  return (
    <div className="space-y-3">
      {/* Top Bar Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100/80 p-2.5 rounded-xl border border-stone-200 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-stone-700">
          <Eye className="w-3.5 h-3.5 text-stone-500" />
          <span>Pratinjau Halaman Dokumen:</span>
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
            <span className="text-[10px] text-amber-800 font-semibold">Cepat:</span>
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
            <span>Kotak sensor di lembar {currentPage}: </span>
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
        className="relative mx-auto bg-stone-200/90 rounded-2xl p-2 sm:p-3 overflow-hidden shadow-inner flex items-center justify-center select-none"
        style={{ minHeight: '380px', maxHeight: '550px' }}
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
          <div className="relative inline-block border border-stone-300 shadow-md bg-white rounded-md overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-auto max-w-full" />

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
                    className={`absolute z-30 cursor-move border transition-all ${
                      isActive
                        ? 'bg-black border-amber-400 ring-2 ring-amber-400/40'
                        : 'bg-black/90 border-stone-800 hover:border-amber-300'
                    }`}
                  >
                    <div className="absolute -top-5 left-0 flex items-center gap-1">
                      <span className="bg-stone-900 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                        Sensor
                      </span>
                      <button
                        type="button"
                        onClick={(e) => removeRedactBox(box.id!, e)}
                        className="bg-red-600 hover:bg-red-700 text-white p-0.5 rounded shadow-xs"
                        title="Hapus sensor ini"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Width Resize control */}
                    {isActive && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startWidth = box.widthPercent;
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            if (!containerRef.current) return;
                            const rect = containerRef.current.getBoundingClientRect();
                            const delta = ((moveEvent.clientX - startX) / rect.width) * 100;
                            const newWidth = Math.max(10, Math.min(95 - box.xPercent, startWidth + delta));
                            if (onRedactBoxesChange) {
                              onRedactBoxesChange(
                                redactBoxes.map((b) => (b.id === box.id ? { ...b, widthPercent: newWidth } : b))
                              );
                            }
                          };
                          const onMouseUp = () => {
                            window.removeEventListener('mousemove', onMouseMove);
                            window.removeEventListener('mouseup', onMouseUp);
                          };
                          window.addEventListener('mousemove', onMouseMove);
                          window.addEventListener('mouseup', onMouseUp);
                        }}
                        className="absolute right-0 top-0 bottom-0 w-2.5 bg-amber-400 cursor-ew-resize hover:bg-amber-500 rounded-r flex items-center justify-center"
                        title="Tarik untuk ubah lebar"
                      >
                        <div className="w-0.5 h-3 bg-stone-900 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Helpful Instructions */}
      {mode === 'sign' && !signatureDataUrl && (
        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          ⚠️ Buat atau unggah tanda tangan pada panel di atas terlebih dahulu, kemudian Anda bisa menggesernya secara visual pada lembar di atas.
        </p>
      )}

      {mode === 'redact' && currentRedactBoxes.length === 0 && (
        <p className="text-[11px] text-stone-500 text-center">
          Klik tombol <strong>+ Tambah Kotak Sensor</strong> untuk menutup NIK, nomor rekening, alamat, atau paraf pada lembar ini.
        </p>
      )}
    </div>
  );
};

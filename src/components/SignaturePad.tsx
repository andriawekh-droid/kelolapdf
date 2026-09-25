'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Type, UploadCloud, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (
    dataUrl: string | null,
    options: {
      pageNumber: 'last' | 'first' | 'all';
      position: 'bottom-right' | 'bottom-left' | 'bottom-center';
    }
  ) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange }) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [penColor, setPenColor] = useState<string>('#0f172a'); // default black/slate
  const [typedName, setTypedName] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>('cursive');
  const [uploadedImgUrl, setUploadedImgUrl] = useState<string | null>(null);

  // Position & Page settings
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'bottom-center'>('bottom-right');
  const [pageNumber, setPageNumber] = useState<'last' | 'first' | 'all'>('last');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Canvas drawing setup
  useEffect(() => {
    if (tab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = penColor;
      }
    }
  }, [tab, penColor]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    exportSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(null, { pageNumber, position });
  };

  const exportSignature = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl, { pageNumber, position });
    } else if (tab === 'type') {
      if (!typedName.trim()) {
        onSignatureChange(null, { pageNumber, position });
        return;
      }
      // Render typed text to temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 150;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 400, 150);
        ctx.font = `italic 42px ${fontFamily}, Georgia, serif`;
        ctx.fillStyle = penColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 200, 75);
        const dataUrl = tempCanvas.toDataURL('image/png');
        onSignatureChange(dataUrl, { pageNumber, position });
      }
    } else if (tab === 'upload') {
      onSignatureChange(uploadedImgUrl, { pageNumber, position });
    }
  };

  // Re-export when options change
  useEffect(() => {
    exportSignature();
  }, [position, pageNumber, typedName, fontFamily, uploadedImgUrl, tab, penColor]);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImgUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* 3 Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setTab('draw')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition ${
            tab === 'draw'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Gambar / Gores</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('type')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition ${
            tab === 'type'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Ketik Nama</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition ${
            tab === 'upload'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Unggah Berkas</span>
        </button>
      </div>

      {/* TAB 1: DRAW CANVAS */}
      {tab === 'draw' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-600">Goreskan tanda tangan Anda pada bidang di bawah ini:</span>
            <div className="flex items-center gap-2">
              {/* Color pickers */}
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${penColor === '#0f172a' ? 'border-amber-500 scale-110' : 'border-white'}`}
                title="Tinta Hitam"
              />
              <button
                type="button"
                onClick={() => setPenColor('#1d4ed8')}
                className={`w-5 h-5 rounded-full bg-blue-700 border-2 ${penColor === '#1d4ed8' ? 'border-amber-500 scale-110' : 'border-white'}`}
                title="Tinta Biru Dinas"
              />
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-red-600 ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Bersihkan</span>
              </button>
            </div>
          </div>

          <div className="border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs touch-none">
            <canvas
              ref={canvasRef}
              width={500}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 cursor-crosshair block"
            />
          </div>
          <p className="text-[11px] text-stone-400">
            Dapat menggunakan mouse, stylus, atau jari tangan langsung di layar sentuh.
          </p>
        </div>
      )}

      {/* TAB 2: TYPE NAME */}
      {tab === 'type' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-700">Ketikkan Nama / Inisial:</label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="misal: Dr. Budi Santoso"
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Style selection */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cursive', name: 'Gaya Kaligrafi Cursive' },
              { id: 'Brush Script MT', name: 'Gaya Tanda Tangan Latin' },
            ].map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => setFontFamily(font.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  fontFamily === font.id
                    ? 'border-amber-600 bg-amber-50/60 shadow-2xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <span className="text-[11px] text-stone-500 block">{font.name}</span>
                <span
                  style={{ fontFamily: `${font.id}, cursive`, color: penColor }}
                  className="text-lg font-medium block truncate mt-1 italic"
                >
                  {typedName || 'Contoh Tanda Tangan'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD IMAGE / STAMP */}
      {tab === 'upload' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-stone-700">Unggah Gambar Tanda Tangan / Stempel (PNG Transparan):</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleUploadImage}
            className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer"
          />
          {uploadedImgUrl && (
            <div className="p-3 bg-white border border-stone-200 rounded-xl flex items-center gap-3 mt-2">
              <img
                src={uploadedImgUrl}
                alt="Preview Tanda Tangan"
                className="h-12 w-auto object-contain border border-stone-100 rounded-md p-1"
              />
              <span className="text-xs text-emerald-700 font-medium">Gambar tanda tangan siap ditempelkan.</span>
            </div>
          )}
        </div>
      )}

      {/* PLACEMENT & PAGE SETTINGS */}
      <div className="pt-3 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="font-semibold text-stone-800 block mb-1.5">Posisi Penempatan:</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'bottom-left', label: 'Kiri Bawah' },
              { id: 'bottom-center', label: 'Tengah' },
              { id: 'bottom-right', label: 'Kanan Bawah' },
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setPosition(pos.id as any)}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition ${
                  position === pos.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-semibold text-stone-800 block mb-1.5">Halaman Target:</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'last', label: 'Hal. Terakhir' },
              { id: 'first', label: 'Hal. Pertama' },
              { id: 'all', label: 'Semua Hal.' },
            ].map((pg) => (
              <button
                key={pg.id}
                type="button"
                onClick={() => setPageNumber(pg.id as any)}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition ${
                  pageNumber === pg.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {pg.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

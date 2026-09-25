'use client';

import React, { useState, useRef } from 'react';
import { PdfTool } from '@/data/tools';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  Loader2,
  Download,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  mergePdfs,
  splitPdf,
  rotatePdf,
  protectPdf,
  addWatermarkPdf,
  addPageNumbersPdf,
  imagesToPdf,
  downloadPdfBlob,
} from '@/lib/pdf/core';

interface ToolWorkspaceViewProps {
  tool: PdfTool;
}

export const ToolWorkspaceView: React.FC<ToolWorkspaceViewProps> = ({ tool }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tool specific states
  const [pageRange, setPageRange] = useState('1-3');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [password, setPassword] = useState('');
  const [watermarkText, setWatermarkText] = useState('DRAFT');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.35);
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right'>('bottom-center');
  const [skipCover, setSkipCover] = useState(true);
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMultiple = tool.id === 'merge' || tool.id === 'image-to-pdf';
  const acceptedTypes =
    tool.id === 'image-to-pdf'
      ? 'image/jpeg,image/png,image/webp'
      : 'application/pdf';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      if (isMultiple) {
        setFiles((prev) => [...prev, ...selected]);
      } else {
        setFiles([selected[0]]);
      }
      setErrorMessage(null);
      setSuccess(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      if (isMultiple) {
        setFiles((prev) => [...prev, ...dropped]);
      } else {
        setFiles([dropped[0]]);
      }
      setErrorMessage(null);
      setSuccess(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const executeProcess = async () => {
    if (files.length === 0) {
      setErrorMessage('Silakan pilih berkas dokumen terlebih dahulu.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      let resultBytes: Uint8Array | null = null;
      let outputFilename = `kelolapdf-${tool.slug}-${Date.now()}.pdf`;

      switch (tool.id) {
        case 'merge':
          if (files.length < 2) {
            throw new Error('Pilih minimal 2 file PDF untuk digabungkan.');
          }
          resultBytes = await mergePdfs(files);
          outputFilename = `kelolapdf-gabungan.pdf`;
          break;

        case 'split':
          resultBytes = await splitPdf(files[0], pageRange);
          outputFilename = `kelolapdf-pisah-${pageRange.replace(/[\s,]+/g, '_')}.pdf`;
          break;

        case 'rotate':
          resultBytes = await rotatePdf(files[0], rotateAngle);
          outputFilename = `kelolapdf-putar-${rotateAngle}deg.pdf`;
          break;

        case 'protect':
          if (!password || password.length < 3) {
            throw new Error('Masukkan kata sandi pengaman minimal 3 karakter.');
          }
          resultBytes = await protectPdf(files[0], password);
          outputFilename = `kelolapdf-terproteksi.pdf`;
          break;

        case 'watermark':
          if (!watermarkText.trim()) {
            throw new Error('Masukkan teks watermark yang ingin ditempelkan.');
          }
          resultBytes = await addWatermarkPdf(files[0], watermarkText, watermarkOpacity);
          outputFilename = `kelolapdf-watermark.pdf`;
          break;

        case 'page-numbers':
          resultBytes = await addPageNumbersPdf(files[0], pageNumberPos, skipCover);
          outputFilename = `kelolapdf-bernomor.pdf`;
          break;

        case 'image-to-pdf':
          resultBytes = await imagesToPdf(files, imageOrientation);
          outputFilename = `kelolapdf-gambar-ke-pdf.pdf`;
          break;

        default:
          const ab = await files[0].arrayBuffer();
          resultBytes = new Uint8Array(ab);
          break;
      }

      if (resultBytes) {
        downloadPdfBlob(resultBytes, outputFilename);
        setSuccess(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses dokumen.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50/60 hover:bg-amber-50/20 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={isMultiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 group-hover:border-amber-300 flex items-center justify-center mx-auto mb-3 text-stone-400 group-hover:text-amber-600 transition shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>
        <p className="text-sm sm:text-base font-semibold text-stone-800">
          Klik atau seret berkas {tool.id === 'image-to-pdf' ? 'gambar (JPG/PNG)' : 'PDF'} ke sini
        </p>
        <p className="text-xs text-stone-400 mt-1">
          {isMultiple
            ? 'Bisa pilih banyak berkas sekaligus'
            : 'Pilih 1 berkas dokumen untuk diolah'}
        </p>
      </div>

      {/* Uploaded File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600 px-1">
            <span>Berkas Terpilih ({files.length}):</span>
            {isMultiple && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-amber-700 hover:underline text-[11px]"
              >
                + Tambah Berkas Lain
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="font-medium text-stone-800 truncate">{file.name}</span>
                  <span className="text-stone-400 text-[10px] shrink-0">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-stone-400 hover:text-red-600 p-1 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool specific configurations */}
      {files.length > 0 && (
        <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Pengaturan {tool.title}
          </h4>

          {/* Split Settings */}
          {tool.id === 'split' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">
                Rentang Halaman yang Ingin Diambil (contoh: 1-3, 5):
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                placeholder="misal: 1-3, 5"
              />
            </div>
          )}

          {/* Rotate Settings */}
          {tool.id === 'rotate' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Arah Putaran:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '90° Kanan', val: 90 },
                  { label: '180° Balik', val: 180 },
                  { label: '270° Kiri', val: 270 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setRotateAngle(item.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                      rotateAngle === item.val
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protect Settings */}
          {tool.id === 'protect' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">
                Kata Sandi (Password) Baru:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                placeholder="Ketik password..."
              />
            </div>
          )}

          {/* Watermark Settings */}
          {tool.id === 'watermark' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Teks Watermark:</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  placeholder="misal: DRAFT, RAHASIA"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Transparansi:</span>
                  <span>{Math.round(watermarkOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>
            </div>
          )}

          {/* Page Numbering Settings */}
          {tool.id === 'page-numbers' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipCoverCheckView"
                  checked={skipCover}
                  onChange={(e) => setSkipCover(e.target.checked)}
                  className="rounded-sm accent-amber-600"
                />
                <label htmlFor="skipCoverCheckView" className="text-xs text-stone-700">
                  Lewati halaman pertama (halaman sampul/cover)
                </label>
              </div>
            </div>
          )}

          {/* Image to PDF Settings */}
          {tool.id === 'image-to-pdf' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Orientasi Kertas:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Tegak (Portrait)', val: 'portrait' },
                  { label: 'Melebar (Landscape)', val: 'landscape' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setImageOrientation(item.val as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                      imageOrientation === item.val
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <div>
            <strong>Berhasil!</strong> Dokumen PDF baru telah diunduh otomatis ke perangkat Anda.
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>0 byte dikirim ke internet • 100% Privat</span>
        </div>

        <button
          onClick={executeProcess}
          disabled={files.length === 0 || isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Memproses di Browser...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-amber-300" />
              <span>Proses & Unduh Sekarang</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

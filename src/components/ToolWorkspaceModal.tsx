'use client';

import React, { useState, useRef } from 'react';
import { PdfTool } from '@/data/tools';
import { SignaturePad } from './SignaturePad';
import {
  X,
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
  addSignatureToPdf,
  downloadPdfBlob,
} from '@/lib/pdf/core';

interface ToolWorkspaceModalProps {
  tool: PdfTool | null;
  onClose: () => void;
}

export const ToolWorkspaceModal: React.FC<ToolWorkspaceModalProps> = ({ tool, onClose }) => {
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
  const [compressLevel, setCompressLevel] = useState<'seimbang' | 'maksimal' | 'ringan'>('seimbang');
  const [ocrLang, setOcrLang] = useState('ind');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');

  // Signature state
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureOptions, setSignatureOptions] = useState<{
    pageNumber: 'last' | 'first' | 'all';
    position: 'bottom-right' | 'bottom-left' | 'bottom-center';
  }>({
    pageNumber: 'last',
    position: 'bottom-right',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!tool) return null;

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
        case 'sign':
          if (!signatureDataUrl) {
            throw new Error('Silakan buat tanda tangan terlebih dahulu (gores pada kanvas, ketik nama, atau unggah gambar).');
          }
          resultBytes = await addSignatureToPdf(files[0], signatureDataUrl, {
            pageNumber: signatureOptions.pageNumber,
            position: signatureOptions.position,
          });
          outputFilename = `kelolapdf-bertandatangan.pdf`;
          break;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between bg-stone-50/50 rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-base sm:text-lg">{tool.title}</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                100% Client-Side
              </span>
            </div>
            <p className="text-stone-500 text-xs mt-0.5">{tool.shortDesc}</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1.5 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50/60 hover:bg-amber-50/20 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              multiple={isMultiple}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 group-hover:border-amber-300 flex items-center justify-center mx-auto mb-3 text-stone-400 group-hover:text-amber-600 transition shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-800">
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
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
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
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool specific configurations */}
          {files.length > 0 && (
            <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Pengaturan {tool.title}
              </h4>

              {/* 1. SIGN SETTINGS */}
              {tool.id === 'sign' && (
                <SignaturePad
                  onSignatureChange={(dataUrl, opts) => {
                    setSignatureDataUrl(dataUrl);
                    setSignatureOptions(opts);
                  }}
                />
              )}

              {/* 2. SPLIT SETTINGS */}
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
                  <p className="text-[11px] text-stone-400">
                    Tuliskan nomor halaman atau rentang menggunakan tanda pisah.
                  </p>
                </div>
              )}

              {/* 3. ROTATE SETTINGS */}
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

              {/* 4. PROTECT SETTINGS */}
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
                  <p className="text-[11px] text-stone-400">
                    Dokumen akan dienkripsi langsung di browser dengan sandi ini.
                  </p>
                </div>
              )}

              {/* 5. WATERMARK SETTINGS */}
              {tool.id === 'watermark' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700">Teks Watermark:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      placeholder="misal: DRAFT, RAHASIA, MILIK PRIBADI"
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

              {/* 6. PAGE NUMBERS SETTINGS */}
              {tool.id === 'page-numbers' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="skipCoverCheck"
                      checked={skipCover}
                      onChange={(e) => setSkipCover(e.target.checked)}
                      className="rounded-sm accent-amber-600"
                    />
                    <label htmlFor="skipCoverCheck" className="text-xs text-stone-700">
                      Lewati halaman pertama (halaman sampul/cover)
                    </label>
                  </div>
                </div>
              )}

              {/* 7. IMAGE TO PDF SETTINGS */}
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

              {/* 8. COMPRESS SETTINGS */}
              {tool.id === 'compress' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-700">Tingkat Kompresi:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'seimbang', label: 'Seimbang', desc: 'Disarankan' },
                      { id: 'maksimal', label: 'Maksimal', desc: 'Ukuran Terkecil' },
                      { id: 'ringan', label: 'Ringan', desc: 'Kualitas Tinggi' },
                    ].map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setCompressLevel(comp.id as any)}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          compressLevel === comp.id
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-xs font-semibold block">{comp.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${compressLevel === comp.id ? 'text-amber-100' : 'text-stone-400'}`}>
                          {comp.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. OCR SETTINGS */}
              {tool.id === 'ocr' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-700">Bahasa Dokumen Scan:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'ind', label: 'Bahasa Indonesia (ind)' },
                      { id: 'eng', label: 'English (eng)' },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setOcrLang(lang.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                          ocrLang === lang.id
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Engine OCR Tesseract.js akan mengenali karakter teks langsung di peramban Anda.
                  </p>
                </div>
              )}

              {/* 10. UNLOCK SETTINGS */}
              {tool.id === 'unlock' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">Password Pembuka Dokumen:</label>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Ketik password saat ini..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                  <p className="text-[11px] text-stone-400">
                    Dokumen akan disimpan ulang tanpa enkripsi sehingga tidak meminta password lagi saat dibuka.
                  </p>
                </div>
              )}

              {/* 11. METADATA SETTINGS */}
              {tool.id === 'metadata' && (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="font-medium text-stone-700 block mb-1">Judul Dokumen (Title):</label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Judul dokumen..."
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-stone-700 block mb-1">Penulis (Author):</label>
                    <input
                      type="text"
                      value={metaAuthor}
                      onChange={(e) => setMetaAuthor(e.target.value)}
                      placeholder="Nama penulis / instansi..."
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-amber-600"
                    />
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
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/70 rounded-b-3xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>0 byte diunggah ke internet</span>
          </div>

          <button
            onClick={executeProcess}
            disabled={files.length === 0 || isProcessing}
            className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition"
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
    </div>
  );
};

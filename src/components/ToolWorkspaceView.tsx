'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PdfTool } from '@/data/tools';
import { SignaturePad } from './SignaturePad';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  Loader2,
  Download,
  AlertCircle,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Copy,
  Check,
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
  arrangePdfPages,
  getPdfPageCount,
  unlockPdf,
  updatePdfMetadata,
  cropPdf,
  resizePdfPages,
  redactPdfPages,
  pdfToImagesZip,
  extractPdfText,
  downloadPdfBlob,
  downloadBlob,
  RedactBoxItem,
} from '@/lib/pdf/core';
import { compressPdf, CompressResult } from '@/lib/pdf/compress';
import { PdfVisualEditor } from './PdfVisualEditor';
import { PdfPageThumbnail } from './PdfPageThumbnail';
import { incrementProcessedCount } from '@/lib/counter';

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
  const [compressLevel, setCompressLevel] = useState<'seimbang' | 'maksimal' | 'ringan'>('seimbang');
  const [ocrLang, setOcrLang] = useState('ind');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');

  // Arrange state
  const [arrangePages, setArrangePages] = useState<number[]>([]);
  const [originalPageCount, setOriginalPageCount] = useState<number>(0);
  const [isAnalyzingPages, setIsAnalyzingPages] = useState(false);

  // New tool states
  const [pdfToImgFormat, setPdfToImgFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [cropMargin, setCropMargin] = useState<number>(30);
  const [resizePaper, setResizePaper] = useState<'A4' | 'Letter' | 'F4'>('A4');
  const [redactArea, setRedactArea] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [redactPage, setRedactPage] = useState<'first' | 'last' | 'all'>('all');
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [hasCopiedText, setHasCopiedText] = useState(false);

  // Visual interactive placement states
  const [signPlacement, setSignPlacement] = useState<{
    pageNumber: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
  }>({
    pageNumber: 1,
    xPercent: 60,
    yPercent: 75,
    widthPercent: 28,
  });
  const [redactBoxes, setRedactBoxes] = useState<RedactBoxItem[]>([]);

  // Signature state
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureOptions, setSignatureOptions] = useState<{
    pageNumber: 'last' | 'first' | 'all';
    position: 'bottom-right' | 'bottom-left' | 'bottom-center';
  }>({
    pageNumber: 'last',
    position: 'bottom-right',
  });

  const [compressResult, setCompressResult] = useState<CompressResult | null>(null);
  const [compressProgress, setCompressProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever the active tool changes
  useEffect(() => {
    setFiles([]);
    setSuccess(false);
    setErrorMessage(null);
    setIsProcessing(false);
    setSignatureDataUrl(null);
    setPassword('');
    setUnlockPassword('');
    setCompressResult(null);
    setCompressProgress(null);
    setArrangePages([]);
    setOriginalPageCount(0);
    setExtractedText(null);
    setHasCopiedText(false);
    setRedactBoxes([]);
    setSignPlacement({
      pageNumber: 1,
      xPercent: 60,
      yPercent: 75,
      widthPercent: 28,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [tool?.id]);

  // Load page count when file is selected for arrange tool
  const analyzePdfForArrange = async (file: File) => {
    try {
      setIsAnalyzingPages(true);
      const count = await getPdfPageCount(file);
      setOriginalPageCount(count);
      setArrangePages(Array.from({ length: count }, (_, i) => i));
    } catch {
      setOriginalPageCount(0);
      setArrangePages([]);
    } finally {
      setIsAnalyzingPages(false);
    }
  };

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
        if (tool.id === 'arrange') {
          analyzePdfForArrange(selected[0]);
        }
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
        if (tool.id === 'arrange') {
          analyzePdfForArrange(dropped[0]);
        }
      }
      setErrorMessage(null);
      setSuccess(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (tool.id === 'arrange' && next.length > 0) {
        analyzePdfForArrange(next[0]);
      } else if (tool.id === 'arrange') {
        setArrangePages([]);
        setOriginalPageCount(0);
      }
      return next;
    });
  };

  // Arrange page reorder helpers
  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= arrangePages.length) return;
    const updated = [...arrangePages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setArrangePages(updated);
  };

  const removePageFromArrange = (idxToRemove: number) => {
    if (arrangePages.length <= 1) {
      setErrorMessage('Dokumen PDF harus memiliki minimal 1 halaman.');
      return;
    }
    setArrangePages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const resetArrange = () => {
    if (originalPageCount > 0) {
      setArrangePages(Array.from({ length: originalPageCount }, (_, i) => i));
    }
  };

  const executeProcess = async () => {
    if (files.length === 0) {
      setErrorMessage('Silakan pilih berkas dokumen terlebih dahulu.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setExtractedText(null);

      let resultBytes: Uint8Array | null = null;
      let outputFilename = `kelolapdf-${tool.slug}-${Date.now()}.pdf`;

      switch (tool.id) {
        case 'compress': {
          setCompressProgress('Menyiapkan kompresi...');
          const compResult = await compressPdf(files[0], compressLevel, (current, total) => {
            setCompressProgress(`Mengompres halaman ${current} dari ${total}...`);
          });
          resultBytes = compResult.bytes;
          setCompressResult(compResult);
          outputFilename = `kelolapdf-kompres-${files[0].name}`;
          break;
        }

        case 'arrange': {
          if (arrangePages.length === 0) {
            throw new Error('Tidak ada halaman yang dipilih.');
          }
          resultBytes = await arrangePdfPages(files[0], arrangePages);
          outputFilename = `kelolapdf-urutan-baru-${files[0].name}`;
          break;
        }

        case 'sign': {
          if (!signatureDataUrl) {
            throw new Error('Silakan buat tanda tangan terlebih dahulu (gores pada kanvas, ketik nama, atau unggah gambar).');
          }
          resultBytes = await addSignatureToPdf(files[0], signatureDataUrl, {
            customPlacement: signPlacement,
          });
          outputFilename = `kelolapdf-bertandatangan-${files[0].name}`;
          break;
        }

        case 'merge': {
          if (files.length < 2) {
            throw new Error('Pilih minimal 2 file PDF untuk digabungkan.');
          }
          resultBytes = await mergePdfs(files);
          outputFilename = `kelolapdf-gabungan.pdf`;
          break;
        }

        case 'split': {
          resultBytes = await splitPdf(files[0], pageRange);
          outputFilename = `kelolapdf-pisah-${pageRange.replace(/[\s,]+/g, '_')}.pdf`;
          break;
        }

        case 'rotate': {
          resultBytes = await rotatePdf(files[0], rotateAngle);
          outputFilename = `kelolapdf-putar-${rotateAngle}deg.pdf`;
          break;
        }

        case 'protect': {
          if (!password || password.length < 3) {
            throw new Error('Masukkan kata sandi pengaman minimal 3 karakter.');
          }
          resultBytes = await protectPdf(files[0], password);
          outputFilename = `kelolapdf-terproteksi.pdf`;
          break;
        }

        case 'unlock': {
          if (!unlockPassword) {
            throw new Error('Masukkan kata sandi saat ini untuk membuka proteksi.');
          }
          resultBytes = await unlockPdf(files[0], unlockPassword);
          outputFilename = `kelolapdf-bebas-sandi-${files[0].name}`;
          break;
        }

        case 'watermark': {
          if (!watermarkText.trim()) {
            throw new Error('Masukkan teks watermark yang ingin ditempelkan.');
          }
          resultBytes = await addWatermarkPdf(files[0], watermarkText, watermarkOpacity);
          outputFilename = `kelolapdf-watermark.pdf`;
          break;
        }

        case 'page-numbers': {
          resultBytes = await addPageNumbersPdf(files[0], pageNumberPos, skipCover);
          outputFilename = `kelolapdf-bernomor.pdf`;
          break;
        }

        case 'image-to-pdf': {
          resultBytes = await imagesToPdf(files, imageOrientation);
          outputFilename = `kelolapdf-gambar-ke-pdf.pdf`;
          break;
        }

        case 'pdf-to-image': {
          setCompressProgress('Mengekstrak halaman ke gambar...');
          const zipBlob = await pdfToImagesZip(files[0], pdfToImgFormat, (cur, tot) => {
            setCompressProgress(`Mengekstrak halaman ${cur} dari ${tot}...`);
          });
          downloadBlob(zipBlob, `kelolapdf-gambar-${files[0].name.replace('.pdf', '')}.zip`);
          setSuccess(true);
          incrementProcessedCount();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
          return;
        }

        case 'extract-images': {
          setCompressProgress('Mengekstrak aset gambar...');
          const zipBlob = await pdfToImagesZip(files[0], 'image/jpeg', (cur, tot) => {
            setCompressProgress(`Menyalin aset ${cur} dari ${tot}...`);
          });
          downloadBlob(zipBlob, `kelolapdf-ekstrak-gambar-${files[0].name.replace('.pdf', '')}.zip`);
          setSuccess(true);
          incrementProcessedCount();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
          return;
        }

        case 'ocr': {
          setCompressProgress('Membaca teks dari dokumen...');
          const text = await extractPdfText(files[0], (cur, tot) => {
            setCompressProgress(`Mendeteksi teks halaman ${cur} dari ${tot}...`);
          });
          setExtractedText(text);
          const txtBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          downloadBlob(txtBlob, `kelolapdf-teks-${files[0].name.replace('.pdf', '')}.txt`);
          setSuccess(true);
          incrementProcessedCount();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
          return;
        }

        case 'crop': {
          resultBytes = await cropPdf(files[0], cropMargin);
          outputFilename = `kelolapdf-crop-${files[0].name}`;
          break;
        }

        case 'resize': {
          resultBytes = await resizePdfPages(files[0], resizePaper);
          outputFilename = `kelolapdf-ukuran-${resizePaper}-${files[0].name}`;
          break;
        }

        case 'redact': {
          if (redactBoxes.length === 0) {
            throw new Error('Silakan buat minimal 1 kotak sensor pada pratinjau dokumen dengan tombol "+ Tambah Kotak Sensor".');
          }
          resultBytes = await redactPdfPages(files[0], {
            customBoxes: redactBoxes,
          });
          outputFilename = `kelolapdf-sensor-${files[0].name}`;
          break;
        }

        case 'metadata': {
          resultBytes = await updatePdfMetadata(files[0], {
            title: metaTitle,
            author: metaAuthor,
            subject: metaSubject,
            keywords: metaKeywords,
          });
          outputFilename = `kelolapdf-metadata-${files[0].name}`;
          break;
        }

        default: {
          const ab = await files[0].arrayBuffer();
          resultBytes = new Uint8Array(ab);
          break;
        }
      }

      if (resultBytes) {
        downloadPdfBlob(resultBytes, outputFilename);
        setSuccess(true);
        incrementProcessedCount();
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
      setCompressProgress(null);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-2xl mx-auto shadow-sm flex flex-col">
      {/* View Header */}
      <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 rounded-t-3xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tool.emoji}</span>
          <div>
            <h3 className="font-bold text-stone-900 text-lg">{tool.title}</h3>
            <p className="text-stone-500 text-xs mt-0.5">{tool.shortDesc}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full shrink-0">
          100% Client-Side
        </span>
      </div>

      {/* View Body */}
      <div className="p-6 space-y-6">
        {/* File Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50/60 hover:bg-amber-50/20 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all group"
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

            {/* 1. ATUR & URUTKAN HALAMAN (ARRANGE) */}
            {tool.id === 'arrange' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-700">
                    Urutan Lembar ({arrangePages.length} dari {originalPageCount} halaman):
                  </span>
                  <button
                    type="button"
                    onClick={resetArrange}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-medium hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Kembalikan Urutan Awal
                  </button>
                </div>

                {isAnalyzingPages ? (
                  <div className="flex items-center justify-center py-6 text-xs text-stone-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    Membaca halaman dokumen...
                  </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                      {arrangePages.map((pageIdx, currentPosition) => (
                        <div
                          key={`${pageIdx}-${currentPosition}`}
                          className="bg-white border border-stone-200 rounded-xl p-2 flex flex-col justify-between shadow-2xs group hover:border-amber-400 transition"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-stone-900">
                              Lembar {currentPosition + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removePageFromArrange(currentPosition)}
                              title="Hapus lembar ini"
                              className="text-stone-300 hover:text-red-600 p-0.5 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Mini visual thumbnail */}
                          <div className="my-1 flex justify-center">
                            <PdfPageThumbnail
                              file={files[0]}
                              pageNumber={pageIdx + 1}
                              className="max-h-28 w-auto shadow-2xs"
                            />
                          </div>

                          <span className="text-[10px] text-stone-400 text-center mb-1.5 block">
                            Hal. Asli: {pageIdx + 1}
                          </span>
                          <div className="flex items-center gap-1 pt-1 border-t border-stone-100">
                            <button
                              type="button"
                              disabled={currentPosition === 0}
                              onClick={() => movePage(currentPosition, currentPosition - 1)}
                              className="flex-1 py-1 bg-stone-100 hover:bg-amber-100 disabled:opacity-30 disabled:hover:bg-stone-100 rounded text-stone-700 flex items-center justify-center text-[10px] font-medium transition cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3 mr-0.5" /> Geser
                            </button>
                            <button
                              type="button"
                              disabled={currentPosition === arrangePages.length - 1}
                              onClick={() => movePage(currentPosition, currentPosition + 1)}
                              className="flex-1 py-1 bg-stone-100 hover:bg-amber-100 disabled:opacity-30 disabled:hover:bg-stone-100 rounded text-stone-700 flex items-center justify-center text-[10px] font-medium transition cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3 mr-0.5" /> Geser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                )}
                <p className="text-[11px] text-stone-400">
                  Gunakan tombol panah untuk memindahkan urutan lembar, atau hapus lembar yang tidak dibutuhkan.
                </p>
              </div>
            )}

            {/* 2. SIGN SETTINGS */}
            {tool.id === 'sign' && (
              <div className="space-y-4">
                <SignaturePad
                  onSignatureChange={(dataUrl, opts) => {
                    setSignatureDataUrl(dataUrl);
                    setSignatureOptions(opts);
                  }}
                />
                {files.length > 0 && (
                  <div className="pt-3 border-t border-stone-200">
                    <h5 className="text-xs font-bold text-stone-900 mb-2 uppercase tracking-wider">
                      Atur Posisi Tanda Tangan Secara Visual:
                    </h5>
                    <PdfVisualEditor
                      file={files[0]}
                      mode="sign"
                      signatureDataUrl={signatureDataUrl}
                      signPlacement={signPlacement}
                      onSignPlacementChange={setSignPlacement}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 3. SPLIT SETTINGS */}
            {tool.id === 'split' && (
              <div className="space-y-3">
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
                {files.length > 0 && (
                  <div className="pt-2 border-t border-stone-200">
                    <PdfVisualEditor file={files[0]} mode="preview" />
                  </div>
                )}
              </div>
            )}

            {/* 4. ROTATE SETTINGS */}
            {tool.id === 'rotate' && (
              <div className="space-y-3">
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
                {files.length > 0 && (
                  <div className="pt-2 border-t border-stone-200">
                    <PdfVisualEditor file={files[0]} mode="rotate" rotateAngle={rotateAngle} />
                  </div>
                )}
              </div>
            )}

            {/* 5. PROTECT SETTINGS */}
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

            {/* 6. WATERMARK SETTINGS */}
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
                {files.length > 0 && (
                  <div className="pt-2 border-t border-stone-200">
                    <PdfVisualEditor
                      file={files[0]}
                      mode="watermark"
                      watermarkText={watermarkText}
                      watermarkOpacity={watermarkOpacity}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 7. PAGE NUMBERS SETTINGS */}
            {tool.id === 'page-numbers' && (
              <div className="space-y-3">
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700">Posisi Nomor:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Bawah Tengah', val: 'bottom-center' },
                        { label: 'Bawah Kanan', val: 'bottom-right' },
                      ].map((pos) => (
                        <button
                          key={pos.val}
                          type="button"
                          onClick={() => setPageNumberPos(pos.val as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                            pageNumberPos === pos.val
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="pt-2 border-t border-stone-200">
                    <PdfVisualEditor
                      file={files[0]}
                      mode="page-numbers"
                      pageNumberPos={pageNumberPos}
                      skipCover={skipCover}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 8. IMAGE TO PDF SETTINGS */}
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

            {/* 9. COMPRESS SETTINGS */}
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

            {/* 10. PDF TO IMAGE SETTINGS */}
            {tool.id === 'pdf-to-image' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-stone-700">Format Gambar Hasil Ekstrak:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'image/jpeg', label: 'JPG (Standar)', desc: 'Ukuran file lebih ringan' },
                    { id: 'image/png', label: 'PNG (Lossless)', desc: 'Kualitas gambar maksimal' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setPdfToImgFormat(fmt.id as any)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        pdfToImgFormat === fmt.id
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-xs font-semibold block">{fmt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${pdfToImgFormat === fmt.id ? 'text-amber-100' : 'text-stone-400'}`}>
                        {fmt.desc}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-400">
                  Semua lembar halaman PDF akan diekstrak ke dalam satu arsip ZIP siap unduh.
                </p>
              </div>
            )}

            {/* 11. EXTRACT IMAGES SETTINGS */}
            {tool.id === 'extract-images' && (
              <div className="space-y-1.5">
                <p className="text-xs text-stone-700 font-medium">
                  Ekstrak Gambar & Elemen Visual Asli:
                </p>
                <p className="text-[11px] text-stone-500">
                  Sistem akan memindai seluruh lembar dokumen PDF dan mengemas foto, diagram, atau ilustrasi ke dalam satu berkas ZIP.
                </p>
              </div>
            )}

            {/* 12. OCR SETTINGS */}
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
                  Teks digital akan diekstrak langsung di browser peramban dan diunduh sebagai berkas teks (.txt).
                </p>
              </div>
            )}

            {/* 13. UNLOCK SETTINGS */}
            {tool.id === 'unlock' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">Password Pembuka Dokumen Saat Ini:</label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Ketik password saat ini..."
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                <p className="text-[11px] text-stone-400">
                  Dokumen akan disimpan ulang tanpa proteksi password sehingga bisa dibuka langsung kapan pun.
                </p>
              </div>
            )}

            {/* 14. CROP SETTINGS */}
            {tool.id === 'crop' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-700">Ukuran Pangkas Margin:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Ringan (15pt)', val: 15 },
                      { label: 'Sedang (30pt)', val: 30 },
                      { label: 'Lebar (50pt)', val: 50 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setCropMargin(item.val)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                          cropMargin === item.val
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Tepi kosong di sekeliling halaman akan dipangkas secara proporsional.
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="pt-2 border-t border-stone-200">
                    <PdfVisualEditor
                      file={files[0]}
                      mode="crop"
                      cropMargin={cropMargin}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 15. RESIZE SETTINGS */}
            {tool.id === 'resize' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-stone-700">Ukuran Standar Kertas:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'A4 Standar', val: 'A4' },
                    { label: 'US Letter', val: 'Letter' },
                    { label: 'F4 / Folio', val: 'F4' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setResizePaper(item.val as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                        resizePaper === item.val
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-400">
                  Seluruh lembar akan diskalakan secara presisi mengikuti standar dimensi kertas yang dipilih.
                </p>
              </div>
            )}

            {/* 16. REDACT SETTINGS */}
            {tool.id === 'redact' && (
              <div className="space-y-3">
                <p className="text-xs text-stone-600">
                  Tutup bagian data rahasia (seperti NIK, nomor rekening, alamat, nama, atau paraf) secara langsung pada lembar dokumen di bawah ini:
                </p>
                {files.length > 0 && (
                  <PdfVisualEditor
                    file={files[0]}
                    mode="redact"
                    redactBoxes={redactBoxes}
                    onRedactBoxesChange={setRedactBoxes}
                  />
                )}
              </div>
            )}

            {/* 17. METADATA SETTINGS */}
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
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Subjek / Topik (Subject):</label>
                  <input
                    type="text"
                    value={metaSubject}
                    onChange={(e) => setMetaSubject(e.target.value)}
                    placeholder="Subjek dokumen..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Kata Kunci (Keywords):</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="kata1, kata2, kata3..."
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
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">
                Berhasil! Dokumen hasil olahan telah selesai diproses dan diunduh ke perangkat Anda.
              </span>
            </div>

            {/* Compression stats */}
            {compressResult && (
              <div className="bg-white border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 text-[11px] block">Perbandingan Ukuran:</span>
                  <span className="font-bold text-stone-800 text-xs">
                    {(compressResult.originalSize / 1024 / 1024).toFixed(2)} MB → {(compressResult.compressedSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                {compressResult.percentageSaved > 0 && (
                  <span className="font-bold text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    Hemat {compressResult.percentageSaved}%
                  </span>
                )}
              </div>
            )}

            {/* OCR Extracted Text Preview */}
            {extractedText && (
              <div className="bg-white border border-emerald-300 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800 text-xs">Pratinjau Teks Hasil OCR:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedText);
                      setHasCopiedText(true);
                      setTimeout(() => setHasCopiedText(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    {hasCopiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {hasCopiedText ? 'Tersalin!' : 'Salin Teks'}
                  </button>
                </div>
                <pre className="max-h-36 overflow-y-auto bg-stone-50 p-2.5 rounded-lg text-[11px] text-stone-700 whitespace-pre-wrap font-mono border border-stone-200">
                  {extractedText.slice(0, 1000)}
                  {extractedText.length > 1000 ? '\n... (teks lengkap ada di berkas .txt yang diunduh)' : ''}
                </pre>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setSuccess(false);
                  setErrorMessage(null);
                  setSignatureDataUrl(null);
                  setCompressResult(null);
                  setCompressProgress(null);
                  setArrangePages([]);
                  setExtractedText(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-medium hover:bg-emerald-100 transition shadow-2xs"
              >
                + Olah Berkas Lainnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Footer */}
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
              <span>{compressProgress || 'Memproses di Browser...'}</span>
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

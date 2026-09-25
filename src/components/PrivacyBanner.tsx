import React from 'react';
import { ShieldCheck, Lock, Zap, HardDriveDownload } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div
      id="keunggulan"
      className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 sm:p-8 my-10 relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300/80 flex items-center justify-center shrink-0 text-amber-800 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-stone-900 text-base sm:text-lg">
            Privasi Mutlak: Berkas Anda Tidak Pernah Dikirim ke Server
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
            Berbeda dengan layanan PDF lain yang mengunggah dokumen sensitif Anda (KTP, ijazah, kontrak kerja, laporan keuangan) ke cloud publik, <strong>KelolaPDF</strong> mengeksekusi seluruh komputasi langsung di dalam peramban (browser) laptop atau ponsel Anda. Data Anda tetap privat dan aman di tangan Anda.
          </p>
        </div>
      </div>

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-amber-200/60">
        <div className="flex items-center gap-2.5 text-xs text-stone-700">
          <div className="w-7 h-7 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span><strong>Zero Data Leak:</strong> Dokumen tidak pernah meninggalkan memori RAM lokal.</span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-stone-700">
          <div className="w-7 h-7 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span><strong>Tanpa Antre Upload:</strong> Langsung diproses seketika tanpa nunggu upload 50MB.</span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-stone-700">
          <div className="w-7 h-7 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <HardDriveDownload className="w-3.5 h-3.5" />
          </div>
          <span><strong>Gratis Selamanya:</strong> Tanpa langganan, tanpa watermark paksaan, tanpa kuota.</span>
        </div>
      </div>
    </div>
  );
};

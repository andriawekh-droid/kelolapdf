import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <BrandLogo size="md" />
            <p className="text-xs text-stone-500 mt-2 max-w-md leading-relaxed">
              Platform perkakas pengolah dokumen PDF terlengkap di Indonesia. Didesain cepat, intuitif, dan 100% aman beroperasi langsung di browser Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-stone-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 font-mono">
              <span>Domain:</span>
              <strong className="text-stone-900">kelolapdf.web.id</strong>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>Privasi Terlindungi</span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} KelolaPDF — Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <a href="#katalog-alat" className="hover:text-stone-700 transition">
              18 Alat PDF
            </a>
            <span>•</span>
            <a href="#keunggulan" className="hover:text-stone-700 transition">
              Keamanan Data
            </a>
            <span>•</span>
            <span className="flex items-center gap-1">
              Dibuat dengan <Heart className="w-3 h-3 text-red-500 fill-red-500" /> untuk Indonesia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

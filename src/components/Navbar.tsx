'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Sparkles, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FBFBFA]/90 border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Center Pill: Privacy Badge */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% Privat — Dokumen tidak dikirim ke server</span>
        </div>

        {/* Right Action Links */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#katalog-alat"
            className="text-stone-600 hover:text-stone-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Semua 18 Alat
          </a>
          <a
            href="#keunggulan"
            className="text-stone-600 hover:text-stone-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Kenapa Privat?
          </a>
          <a
            href="#katalog-alat"
            className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Mulai Edit PDF</span>
          </a>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-[#FBFBFA] px-4 pt-2 pb-4 space-y-2">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-medium mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Privat — Dokumen diolah di browser</span>
          </div>
          <a
            href="#katalog-alat"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
          >
            Katalog 18 Alat
          </a>
          <a
            href="#keunggulan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
          >
            Keunggulan Client-Side
          </a>
          <a
            href="#katalog-alat"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pilih Alat PDF Sekarang</span>
          </a>
        </div>
      )}
    </header>
  );
};

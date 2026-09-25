'use client';

import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { DocumentCounter } from './DocumentCounter';
import { Sparkles, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FBFBFA]/90 border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Right Action Links */}
        <div className="hidden md:flex items-center gap-3">
          <DocumentCounter variant="badge" />
          <a
            href="#keunggulan"
            className="text-stone-600 hover:text-stone-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Kenapa Privat?
          </a>
          <a
            href="#katalog-alat"
            className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs"
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
          <a
            href="#keunggulan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
          >
            Kenapa Privat?
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

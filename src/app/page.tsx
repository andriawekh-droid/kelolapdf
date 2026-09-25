'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { ToolWorkspaceModal } from '@/components/ToolWorkspaceModal';
import { DocumentCounter } from '@/components/DocumentCounter';
import { PDF_TOOLS, CATEGORIES, PdfTool } from '@/data/tools';
import { Search, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTool, setActiveTool] = useState<PdfTool | null>(null);

  // Filter tools based on category and search query
  const filteredTools = useMemo(() => {
    return PDF_TOOLS.filter((tool) => {
      const matchCat =
        selectedCategory === 'all' || tool.category === selectedCategory;
      const matchSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-5">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 leading-[1.15]">
            Kelola Dokumen PDF Anda <br className="hidden sm:inline" />
            <span className="relative inline-block text-stone-900">
              Tanpa Batas & 100% Privat
              <svg
                className="absolute -bottom-1.5 left-0 w-full text-amber-300/80 -z-10 h-3"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,15 Q50,0 100,15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Gabungkan, pisahkan, kompres, beri tanda tangan digital, hingga OCR teks hasil scan.
            Seluruh berkas diproses langsung di peramban Anda — <strong>tanpa dikirim ke server</strong>, tanpa kuota, dan bebas biaya selamanya.
          </p>

          {/* Live Document Counter */}
          <div className="pt-1 flex justify-center">
            <DocumentCounter variant="hero" />
          </div>

          {/* Search Box */}
          <div className="pt-3 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari alat... misal: gabung, kompres, tanda tangan, ocr, kunci"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-300/90 hover:border-stone-400 focus:border-amber-600 rounded-2xl text-xs sm:text-sm shadow-xs focus:outline-hidden focus:ring-3 focus:ring-amber-500/15 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs font-semibold text-stone-400 hover:text-stone-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

        {/* CATEGORY TABS */}
        <section id="katalog-alat" className="mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none sm:justify-center">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? PDF_TOOLS.length
                  : PDF_TOOLS.filter((t) => t.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 border ${
                    isActive
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-white text-stone-600 border-stone-200/90 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* TOOLS GRID */}
        <section className="mb-16">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onSelect={setActiveTool} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-stone-200 rounded-3xl p-8">
              <p className="text-3xl mb-2">🔍</p>
              <h3 className="font-bold text-stone-800 text-sm sm:text-base">
                Alat tidak ditemukan
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Tidak ada alat yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba cari kata lain seperti &quot;gabung&quot;, &quot;pisah&quot;, atau &quot;tanda tangan&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl"
              >
                Tampilkan Semua 18 Alat
              </button>
            </div>
          )}
        </section>

        {/* PRIVACY BANNER */}
        <PrivacyBanner />

        {/* COMPARISON SECTION (KelolaPDF vs Layanan Lain) */}
        <section className="my-16 bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-stone-900">
              Mengapa Menggunakan KelolaPDF?
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              Bandingkan cara kerja arsitektur client-side kami dengan layanan pengolah PDF konvensional.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 text-xs font-semibold">
                  <th className="py-3 px-4">Fitur & Jaminan</th>
                  <th className="py-3 px-4 text-emerald-800 bg-emerald-50/70 rounded-t-xl font-bold">
                    KelolaPDF
                  </th>
                  <th className="py-3 px-4 text-stone-500">Layanan PDF Cloud Konvensional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">
                    Lokasi Pemrosesan Berkas
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-50/40 text-emerald-900 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    100% di browser laptop/HP Anda
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">
                    Diunggah ke server pihak ketiga
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">
                    Keamanan Dokumen Sensitif (KTP/Ijazah/Gaji)
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-50/40 text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      Zero Data Leak (Data tidak pernah bocor)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">
                    Beresiko tersimpan di cloud atau diintip
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">
                    Kecepatan & Waktu Tunggu
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-50/40 text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      Instan (0 detik antre upload)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">
                    Tergantung kecepatan upload internet
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">
                    Biaya & Batasan Dokumen
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-50/40 text-emerald-900 font-semibold rounded-b-xl">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      Gratis selamanya tanpa kuota
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">
                    Dibatasi 2-3 tugas per jam kecuali bayar VIP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="my-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-stone-900">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-xs text-stone-500 mt-1">
              Semua hal yang perlu Anda ketahui tentang keamanan dan cara kerja KelolaPDF.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Apakah dokumen saya benar-benar aman dan tidak dibaca orang lain?',
                a: 'Sangat aman! Seluruh teknologi di KelolaPDF menggunakan pustaka WebAssembly dan JavaScript yang berjalan di dalam peramban lokal perangkat Anda. File PDF Anda tidak pernah dikirim lewat internet ke server manapun.',
              },
              {
                q: 'Apakah saya bisa menggunakan KelolaPDF saat internet lambat?',
                a: 'Bisa! Karena tidak ada proses unggah dokumen besar ke server, proses penggabungan, pemotongan, atau kompresi PDF berlangsung secepat kemampuan CPU dan RAM laptop/ponsel Anda.',
              },
              {
                q: 'Bagaimana fitur OCR bekerja di browser?',
                a: 'Fitur OCR ditenagai oleh Tesseract.js (WebAssembly). Pada pembukaan pertama, browser mengunduh modul bahasa (Bahasa Indonesia & Inggris), lalu mengekstrak teks langsung di perangkat tanpa perlu server kecerdasan buatan luar.',
              },
              {
                q: 'Apakah ada batasan jumlah halaman atau ukuran file?',
                a: 'Tidak ada batasan buatan dari kami. Batasan ukuran hanya ditentukan oleh kapasitas memori RAM perangkat Anda.',
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-stone-800 text-xs sm:text-sm">
                  <span>{faq.q}</span>
                  <span className="text-stone-400 group-open:rotate-180 transition-transform text-sm">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />

      {/* ACTIVE TOOL WORKSPACE MODAL */}
      {activeTool && (
        <ToolWorkspaceModal
          key={activeTool.id}
          tool={activeTool}
          onClose={() => setActiveTool(null)}
        />
      )}
    </div>
  );
}

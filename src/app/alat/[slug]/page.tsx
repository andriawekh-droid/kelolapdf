import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PDF_TOOLS, PdfTool } from '@/data/tools';
import { DynamicIcon } from '@/components/DynamicIcon';
import { ToolWorkspaceView } from '@/components/ToolWorkspaceView';
import { ArrowLeft, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PDF_TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = PDF_TOOLS.find((t) => t.slug === slug);

  if (!tool) {
    return {
      title: 'Alat Tidak Ditemukan — KelolaPDF',
    };
  }

  const title = `${tool.title} Online Gratis & 100% Privat — KelolaPDF`;
  const description = `${tool.shortDesc} Diproses langsung di browser laptop/HP tanpa upload ke server. Bebas biaya dan aman di kelolapdf.web.id.`;

  return {
    title,
    description,
    keywords: [
      tool.title.toLowerCase(),
      `${tool.title.toLowerCase()} online`,
      `${tool.title.toLowerCase()} gratis`,
      'kelolapdf',
      'edit pdf online',
      'pdf privat',
    ],
    alternates: {
      canonical: `https://kelolapdf.web.id/alat/${tool.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://kelolapdf.web.id/alat/${tool.slug}`,
      siteName: 'KelolaPDF',
      locale: 'id_ID',
      type: 'website',
      images: [
        {
          url: '/cover.png',
          width: 1200,
          height: 630,
          alt: `${tool.title} — KelolaPDF`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/cover.png'],
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = PDF_TOOLS.find((t) => t.slug === slug);

  if (!tool) {
    notFound();
  }

  // JSON-LD Structured Data for this specific tool
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${tool.title} — KelolaPDF`,
    url: `https://kelolapdf.web.id/alat/${tool.slug}`,
    description: tool.shortDesc,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb & Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Semua Alat</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl border ${tool.accentBg} ${tool.accentBorder} flex items-center justify-center mx-auto shadow-xs`}
          >
            <DynamicIcon name={tool.iconName} className={`w-7 h-7 ${tool.accentText}`} />
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            {tool.title}
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {tool.shortDesc}
          </p>

          <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diproses 100% lokal di browser Anda — Tanpa upload ke server</span>
          </div>
        </div>

        {/* Dedicated Interactive Tool Workspace */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-12">
          <ToolWorkspaceView tool={tool} />
        </div>

        {/* How-to Guide (SEO friendly) */}
        <section className="bg-stone-50/60 border border-stone-200/80 rounded-2xl p-6 sm:p-8 mb-10">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-4">
            Cara Menggunakan {tool.title} di KelolaPDF:
          </h2>
          <ol className="space-y-3 text-xs sm:text-sm text-stone-600 list-decimal list-inside leading-relaxed">
            <li>
              <strong>Pilih berkas dokumen:</strong> Klik area unggah atau seret berkas Anda langsung ke kotak di atas.
            </li>
            <li>
              <strong>Atur opsi:</strong> Sesuaikan pengaturan sesuai kebutuhan Anda (misal: rotasi, rentang halaman, atau sandi).
            </li>
            <li>
              <strong>Proses & Unduh:</strong> Klik tombol proses dan berkas baru akan selesai dan terunduh seketika ke perangkat Anda.
            </li>
          </ol>
        </section>

        {/* Security Assurance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600 mb-8">
          <div className="flex items-start gap-2.5 bg-white border border-stone-200 rounded-xl p-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block mb-0.5">Aman untuk Dokumen Rahasia</strong>
              Berkas Anda tidak pernah dikirim ke internet, menjaga kerahasiaan KTP, ijazah, atau laporan keuangan Anda.
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-white border border-stone-200 rounded-xl p-4">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block mb-0.5">Kecepatan Maksimal</strong>
              Langsung diolah menggunakan CPU dan RAM lokal perangkat Anda tanpa antre atau batasan kuota.
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kelolapdf.web.id'),
  title: {
    default: 'KelolaPDF — Kelola Dokumen PDF Lengkap, Cepat & 100% Privat',
    template: '%s — KelolaPDF',
  },
  description:
    'Platform perkakas pengolah dokumen PDF terlengkap di Indonesia. Gabung, pisah, kompres, tanda tangan digital, hingga OCR teks. 100% aman beroperasi di browser tanpa upload ke server.',
  keywords: [
    'kelolapdf',
    'kelolapdf.web.id',
    'gabung pdf',
    'pisah pdf',
    'kompres pdf',
    'ocr pdf indonesia',
    'tanda tangan pdf',
    'ilovepdf indonesia',
    'edit pdf online gratis',
    'pdf to jpg',
    'kunci pdf',
    'watermark pdf',
  ],
  authors: [{ name: 'KelolaPDF Team' }],
  creator: 'KelolaPDF',
  publisher: 'KelolaPDF',
  alternates: {
    canonical: 'https://kelolapdf.web.id',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'KelolaPDF — Perkakas PDF Lengkap & 100% Privat',
    description:
      'Semua kebutuhan olah dokumen PDF Anda, beroperasi 100% di browser tanpa risiko kebocoran data.',
    url: 'https://kelolapdf.web.id',
    siteName: 'KelolaPDF',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/cover.png',
        width: 1200,
        height: 630,
        alt: 'KelolaPDF — 100% Client-Side PDF Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KelolaPDF — Perkakas PDF Lengkap & 100% Privat',
    description:
      'Platform pengolah PDF lokal terlengkap di Indonesia. 100% privat langsung di browser.',
    images: ['/cover.png'],
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const globalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'KelolaPDF',
    url: 'https://kelolapdf.web.id',
    description:
      'Platform pengolah dokumen PDF terlengkap di Indonesia dengan 18 alat manipulasi PDF 100% client-side tanpa upload ke server.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
    },
    author: {
      '@type': 'Organization',
      name: 'KelolaPDF',
      url: 'https://kelolapdf.web.id',
      logo: 'https://kelolapdf.web.id/logo.png',
    },
  };

  return (
    <html lang="id" className={`${jakartaSans.variable} scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-[#FBFBFA] text-stone-900">
        {children}
      </body>
    </html>
  );
}

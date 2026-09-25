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
  title: 'KelolaPDF — Kelola Dokumen PDF Lengkap, Cepat & 100% Privat',
  description:
    'Platform perkakas pengolah dokumen PDF terlengkap di Indonesia (kelolapdf.web.id). Gabung, pisah, kompres, tanda tangan digital, hingga OCR teks. 100% aman beroperasi di browser tanpa upload ke server.',
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
  ],
  authors: [{ name: 'KelolaPDF Team' }],
  openGraph: {
    title: 'KelolaPDF — Perkakas PDF Lengkap & 100% Privat',
    description:
      'Semua kebutuhan olah dokumen PDF Anda, beroperasi 100% di browser tanpa risiko kebocoran data.',
    url: 'https://kelolapdf.web.id',
    siteName: 'KelolaPDF',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakartaSans.variable} scroll-smooth`}>
      <body className="font-sans antialiased min-h-screen bg-[#FBFBFA] text-stone-900">
        {children}
      </body>
    </html>
  );
}

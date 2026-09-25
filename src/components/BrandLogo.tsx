import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md' }) => {
  // Ratio 1024x224 (~4.57:1)
  const heightClass =
    size === 'sm' ? 'h-7' : size === 'lg' ? 'h-11' : 'h-8 sm:h-9';

  return (
    <Link href="/" className="inline-flex items-center group select-none">
      <img
        src="/logo.png"
        alt="KelolaPDF"
        className={`${heightClass} w-auto object-contain transition-transform duration-200 group-hover:opacity-95`}
      />
    </Link>
  );
};

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showBadge = true }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group select-none">
      {/* Notion-style Playful Document Badge */}
      <div
        className={`${iconSize} relative flex items-center justify-center bg-stone-900 text-white rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-2deg]`}
      >
        {/* Folded paper corner effect */}
        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-stone-200 rounded-bl-sm border-b border-l border-stone-300" />
        
        {/* Playful 'K' glyph & PDF spark */}
        <span className="font-bold text-sm tracking-tight text-stone-100 font-mono">
          K
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border-2 border-stone-900" />
      </div>

      <div className="flex items-center gap-2">
        <span className={`${textSize} font-bold tracking-tight text-stone-900 flex items-center`}>
          Kelola<span className="text-amber-600 font-black">PDF</span>
        </span>
        
        {showBadge && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-medium tracking-wide bg-stone-100 text-stone-600 rounded-full border border-stone-200/80">
            kelolapdf.web.id
          </span>
        )}
      </div>
    </Link>
  );
};

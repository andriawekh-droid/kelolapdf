'use client';

import React, { useEffect, useState } from 'react';
import { getTotalProcessedCount, formatNumberId } from '@/lib/counter';
import { ShieldCheck, FileCheck, Sparkles } from 'lucide-react';

interface DocumentCounterProps {
  variant?: 'hero' | 'compact' | 'badge';
  className?: string;
}

export const DocumentCounter: React.FC<DocumentCounterProps> = ({
  variant = 'hero',
  className = '',
}) => {
  const [count, setCount] = useState<number>(38420);
  const [mounted, setMounted] = useState(false);
  const [isBumped, setIsBumped] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getTotalProcessedCount();
    setCount(initial);

    const handleProcessed = () => {
      const updated = getTotalProcessedCount();
      setCount(updated);
      setIsBumped(true);
      setTimeout(() => setIsBumped(false), 1200);
    };

    window.addEventListener('kelolapdf_document_processed', handleProcessed);
    window.addEventListener('storage', handleProcessed);

    // Micro increment check berkala (setiap 30 detik)
    const interval = setInterval(() => {
      setCount(getTotalProcessedCount());
    }, 30000);

    return () => {
      window.removeEventListener('kelolapdf_document_processed', handleProcessed);
      window.removeEventListener('storage', handleProcessed);
      clearInterval(interval);
    };
  }, []);

  const formatted = mounted ? formatNumberId(count) : '38.420';

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium shadow-2xs transition-all ${
          isBumped ? 'scale-105 bg-emerald-100 ring-2 ring-emerald-400' : ''
        } ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
        <span>
          <strong className="font-bold">{formatted}</strong> Dokumen Diproses
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-stone-600 font-medium ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
        <span>
          <strong className="font-bold text-stone-800">{formatted}+</strong> Dokumen telah diproses
        </span>
      </div>
    );
  }

  // Default 'hero' variant
  return (
    <div
      className={`inline-flex items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xs border border-stone-200 shadow-xs hover:border-stone-300 transition-all ${
        isBumped ? 'scale-105 border-amber-400 ring-2 ring-amber-400/20' : ''
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
      </span>
      <span className="text-xs sm:text-sm font-extrabold text-stone-900 tracking-tight">
        {formatted}+
      </span>
      <span className="text-xs text-stone-600 font-medium">Dokumen PDF Telah Diproses</span>
    </div>
  );
};

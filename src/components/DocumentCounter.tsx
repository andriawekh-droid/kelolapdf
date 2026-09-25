'use client';

import React, { useEffect, useState } from 'react';
import { getCachedCount, fetchServerCount, formatNumberId } from '@/lib/counter';
import { FileCheck } from 'lucide-react';

interface DocumentCounterProps {
  className?: string;
}

export const DocumentCounter: React.FC<DocumentCounterProps> = ({ className = '' }) => {
  const [count, setCount] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [isBumped, setIsBumped] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getCachedCount();
    setCount(initial);

    // Ambil data real dari server API
    fetchServerCount().then((real) => {
      setCount(real);
    });

    const handleProcessed = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>;
      if (customEvent.detail?.count !== undefined) {
        setCount(customEvent.detail.count);
      } else {
        setCount(getCachedCount());
      }
      setIsBumped(true);
      setTimeout(() => setIsBumped(false), 1200);
    };

    window.addEventListener('kelolapdf_document_processed', handleProcessed);
    window.addEventListener('storage', handleProcessed);

    // Refresh hitungan setiap 60 detik
    const interval = setInterval(() => {
      fetchServerCount().then((val) => setCount(val));
    }, 60000);

    return () => {
      window.removeEventListener('kelolapdf_document_processed', handleProcessed);
      window.removeEventListener('storage', handleProcessed);
      clearInterval(interval);
    };
  }, []);

  const formatted = mounted ? formatNumberId(count) : '0';

  return (
    <div
      className={`flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs transition-all ${
        isBumped ? 'scale-105 border-emerald-400 bg-emerald-100 ring-2 ring-emerald-300' : ''
      } ${className}`}
      title="Jumlah dokumen yang telah diproses secara nyata di KelolaPDF"
    >
      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
      <span>
        <strong className="font-semibold text-emerald-900">{formatted}</strong> Dokumen Telah Diproses
      </span>
    </div>
  );
};

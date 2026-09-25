/**
 * Utility untuk menghitung dan melacak total dokumen yang telah diproses di KelolaPDF
 */

const BASE_COUNT = 38420;
// Waktu patokan peluncuran
const START_TIMESTAMP = 1774400000000;
const STORAGE_KEY = 'kelolapdf_user_processed_count';

export function getLocalProcessedCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function getTotalProcessedCount(): number {
  if (typeof window === 'undefined') return BASE_COUNT;
  
  // Hitung penambahan organik berbasis waktu (estimasi 1 dokumen per 7.5 menit)
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.floor((now - START_TIMESTAMP) / (1000 * 60 * 7.5)));
  const userCount = getLocalProcessedCount();

  return BASE_COUNT + diffMinutes + userCount;
}

export function incrementProcessedCount(): number {
  if (typeof window === 'undefined') return BASE_COUNT;
  try {
    const current = getLocalProcessedCount();
    const updated = current + 1;
    localStorage.setItem(STORAGE_KEY, updated.toString());
    
    // Kirim event agar semua komponen yang menampilkan counter langsung update
    window.dispatchEvent(new CustomEvent('kelolapdf_document_processed', { detail: { count: updated } }));
    return getTotalProcessedCount();
  } catch {
    return getTotalProcessedCount();
  }
}

export function formatNumberId(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

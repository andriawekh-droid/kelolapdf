/**
 * Utility untuk menghitung dan melacak total dokumen nyata yang telah diproses di KelolaPDF
 */

const STORAGE_KEY = 'kelolapdf_real_count';

export function getCachedCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setCachedCount(val: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, val.toString());
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Mengambil total real count dari server API
 */
export async function fetchServerCount(): Promise<number> {
  try {
    const res = await fetch('/api/counter', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.count === 'number') {
        setCachedCount(data.count);
        return data.count;
      }
    }
  } catch (err) {
    console.warn('Gagal mengambil hitungan real dari server:', err);
  }
  return getCachedCount();
}

/**
 * Menambah hitungan real dokumen setelah proses PDF selesai dan diunduh
 */
export async function incrementProcessedCount(): Promise<number> {
  const current = getCachedCount();
  const optimistic = current + 1;
  setCachedCount(optimistic);

  // Trigger event lokal langsung untuk UI responsif instan
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('kelolapdf_document_processed', {
        detail: { count: optimistic },
      })
    );
  }

  // Kirim hit ke server API di latar belakang
  try {
    const res = await fetch('/api/counter', {
      method: 'POST',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.count === 'number') {
        setCachedCount(data.count);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('kelolapdf_document_processed', {
              detail: { count: data.count },
            })
          );
        }
        return data.count;
      }
    }
  } catch (err) {
    console.warn('Gagal menyinkronkan increment counter ke server:', err);
  }

  return optimistic;
}

export function formatNumberId(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

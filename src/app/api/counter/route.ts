import { NextResponse } from 'next/server';

const ABACUS_BASE = 'https://abacus.jasoncameron.dev';
const COUNTER_KEY = 'kelolapdf/documents';

// Fallback in-memory cache jika external API mengalami gangguan
let cachedCount = 0;

export async function GET() {
  try {
    const res = await fetch(`${ABACUS_BASE}/get/${COUNTER_KEY}`, {
      cache: 'no-store',
      headers: { 'User-Agent': 'KelolaPDF-Client' },
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.value === 'number') {
        cachedCount = data.value;
        return NextResponse.json(
          { count: data.value },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }
    }
  } catch (error) {
    console.error('Error fetching counter from abacus:', error);
  }

  return NextResponse.json(
    { count: cachedCount },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST() {
  try {
    const res = await fetch(`${ABACUS_BASE}/hit/${COUNTER_KEY}`, {
      method: 'GET', // abacus /hit acts as increment
      cache: 'no-store',
      headers: { 'User-Agent': 'KelolaPDF-Client' },
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.value === 'number') {
        cachedCount = data.value;
        return NextResponse.json(
          { count: data.value },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }
    }
  } catch (error) {
    console.error('Error incrementing counter on abacus:', error);
  }

  cachedCount += 1;
  return NextResponse.json(
    { count: cachedCount },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

import { NextResponse } from 'next/server';
import { fetchCoinLoreData } from '@/lib/coinlore';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stocks = await fetchCoinLoreData();

    if (stocks.length === 0) {
      throw new Error("No data received from CoinLore");
    }

    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error in stocks API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

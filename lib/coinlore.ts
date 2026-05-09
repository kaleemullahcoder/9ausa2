
// Helper function to map CoinLore data to our Stock interface
export function mapCoinLoreToStock(coin: any) {
    const price = parseFloat(coin.price_usd);
    const changePercent = parseFloat(coin.percent_change_24h);

    // Calculate absolute change based on the percentage
    // OldPrice = Price / (1 + (ChangePercent/100))
    // Change = Price - OldPrice
    const oldPrice = price / (1 + (changePercent / 100));
    const change = price - oldPrice;

    return {
        symbol: coin.symbol.replace(/[^a-zA-Z0-9-]/g, ''),
        name: coin.name,
        price: price,
        change: parseFloat(change.toFixed(2)),
        changePercent: changePercent,
        volume: parseFloat(coin.volume24),
        marketCap: parseFloat(coin.market_cap_usd),
        sector: "Cryptocurrency"
    };
}

export async function fetchCoinLoreData() {
    try {
        const response = await fetch('https://api.coinlore.net/api/tickers/?start=0&limit=50', {
            headers: {
                'Cache-Control': 'no-store'
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!response.ok) {
            throw new Error(`CoinLore API returned status: ${response.status}`);
        }

        const data = await response.json();

        // CoinLore returns { data: [...coins], info: {...} }
        if (!data.data || !Array.isArray(data.data)) {
            return [];
        }

        return data.data.map(mapCoinLoreToStock);
    } catch (error) {
        console.error('Error fetching data from CoinLore:', error);
        return [];
    }
}

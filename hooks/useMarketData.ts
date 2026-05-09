"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface MarketData {
    symbol: string;
    price: number;
    trend: 'UP' | 'DOWN' | 'RANDOM' | 'STABLE';
    last_updated: string;
}

export function useMarketData(symbol: string, initialPrice: number = 0) {
    const [price, setPrice] = useState<number>(initialPrice);
    const [prevPrice, setPrevPrice] = useState<number>(initialPrice);
    const [trend, setTrend] = useState<'UP' | 'DOWN' | 'RANDOM' | 'STABLE'>('RANDOM');
    const [history, setHistory] = useState<{ time: number, price: number }[]>([]);

    useEffect(() => {
        if (!symbol) return;

        // Fetch initial state
        const fetchInitial = async () => {
            const { data, error } = await supabase
                .from('market_state')
                .select('*')
                .eq('symbol', symbol)
                .single();

            if (data) {
                setPrice(Number(data.price));
                setPrevPrice(Number(data.price)); // Init prev
            } else {
                // If not found, init with passed value or mock
                if (initialPrice > 0) setPrice(initialPrice);
            }
        };

        fetchInitial();

        // Subscribe to changes
        const channel = supabase
            .channel(`market-${symbol}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'market_state',
                    filter: `symbol=eq.${symbol}`
                },
                (payload) => {
                    const newPrice = Number(payload.new.price);
                    setPrevPrice(price);
                    setPrice(newPrice);
                    setTrend(payload.new.trend);

                    setHistory(prev => {
                        const newItem = { time: Date.now(), price: newPrice };
                        const newHist = [...prev, newItem];
                        return newHist.slice(-50); // Keep last 50 points for mini-charts
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [symbol]);

    // Client-side simulation "fuzzing" if no server updates come in
    // This makes it feel "alive" even without admin interaction
    useEffect(() => {
        const interval = setInterval(() => {
            if (trend === 'UP') {
                setPrice(p => p + (Math.random() * p * 0.001));
            } else if (trend === 'DOWN') {
                setPrice(p => p - (Math.random() * p * 0.001));
            } else if (trend === 'RANDOM') {
                // Small random jitter
                setPrice(p => p + (Math.random() - 0.5) * p * 0.0005);
            }
            // If STABLE, do nothing
        }, 1000);

        return () => clearInterval(interval);
    }, [trend]);

    return { price, prevPrice, trend, history };
}

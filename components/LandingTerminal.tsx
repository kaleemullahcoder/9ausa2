"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, RefreshCw, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data Generator
const generateData = (points: number) => {
    let data = [];
    let price = 64000;
    for (let i = 0; i < points; i++) {
        price = price + (Math.random() - 0.48) * 200; // Slight uptrend
        data.push({
            time: i,
            price: price + Math.random() * 50,
            volume: Math.random() * 100
        });
    }
    return data;
};

export default function LandingTerminal() {
    const [data, setData] = useState(generateData(50));
    const [currentPrice, setCurrentPrice] = useState(64250);
    const [priceChange, setPriceChange] = useState(2.45);
    const [activeTab, setActiveTab] = useState("chart");
    const [notification, setNotification] = useState<string | null>(null);

    const [asks, setAsks] = useState(() => Array(8).fill(0).map((_, i) => ({
        price: 64000 + (i + 1) * 50,
        amount: 0.5,
        total: 5
    })));
    const [bids, setBids] = useState(() => Array(8).fill(0).map((_, i) => ({
        price: 64000 - (i + 1) * 50,
        amount: 0.5,
        total: 5
    })));

    // Live Data Simulation
    useEffect(() => {
        // Initial Fetch of Real Data
        const fetchData = async () => {
            try {
                const res = await fetch('/api/stocks');
                const stocks = await res.json();
                const btc = stocks.find((s: any) => s.symbol === 'BTC');
                if (btc) {
                    setCurrentPrice(btc.price);
                    setPriceChange(btc.changePercent);
                    // Regenerate chart data centered around real price
                    const newData = [];
                    let price = btc.price;
                    for (let i = 0; i < 50; i++) {
                        price = price + (Math.random() - 0.48) * (btc.price * 0.005);
                        newData.push({
                            time: i,
                            price: price,
                            volume: Math.random() * 100
                        });
                    }
                    setData(newData);
                }
            } catch (error) {
                console.error("Error fetching BTC data:", error);
            }
        };

        fetchData();

        const interval = setInterval(() => {
            // Update Chart
            setData(prev => {
                if (prev.length === 0) return prev;
                const lastPrice = prev[prev.length - 1].price;
                const volatility = lastPrice * 0.001; // 0.1% volatility
                const newPrice = lastPrice + (Math.random() - 0.5) * volatility;

                // Slowly converge to real price updates if we were polling, 
                // but here just random walk from last real price is fine for visual effect.
                setCurrentPrice(newPrice);

                // Update Order Book
                const spread = newPrice * 0.001;
                setAsks(Array(8).fill(0).map((_, i) => ({
                    price: newPrice + spread + (i * spread),
                    amount: Math.random() * 0.5,
                    total: Math.random() * 10
                })));
                setBids(Array(8).fill(0).map((_, i) => ({
                    price: newPrice - spread - (i * spread),
                    amount: Math.random() * 0.5,
                    total: Math.random() * 10
                })));

                return [...prev.slice(1), {
                    time: prev[prev.length - 1].time + 1,
                    price: newPrice,
                    volume: Math.random() * 100
                }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const router = useRouter();

    const handleTrade = (type: "buy" | "sell") => {
        router.push("/signin");
    };

    return (
        <div className="w-full max-w-5xl mx-auto rounded-xl border border-white/10 bg-dark-card/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px] md:h-[600px]">

            {/* LEFT: Chart Section */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/10">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <span className="text-orange-500 font-bold">₿</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white">BTC/USD</h3>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">Bitcoin</span>
                                <span className={`flex items-center ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-mono font-bold text-white">${currentPrice.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">24h Vol: $52.1B</div>
                    </div>
                </div>

                {/* Chart */}
                <div className="flex-1 p-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['auto', 'auto']} orientation="right" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(val) => `$${val.toFixed(0)}`} stroke="#ffffff10" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000000cc', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#10b981' }}
                                labelStyle={{ display: 'none' }}
                                formatter={(val: number) => [`$${val.toFixed(2)}`, "Price"]}
                            />
                            <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Timeframe Toggles */}
                <div className="flex border-t border-white/10">
                    {['1H', '1D', '1W', '1M', '1Y'].map(tf => (
                        <button key={tf} className={`flex-1 py-3 text-xs font-medium hover:bg-white/5 transition-colors ${tf === '1H' ? 'text-emerald-400 bg-white/5 border-b-2 border-emerald-400' : 'text-gray-500'}`}>
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Order Panel */}
            <div className="w-full md:w-80 flex flex-col bg-black/20">

                {/* Order Book Mockup */}
                <div className="flex-1 overflow-hidden flex flex-col text-xs">
                    <div className="p-3 font-bold text-gray-400 border-b border-white/10 uppercase tracking-wider">Order Book</div>
                    <div className="flex items-center justify-between px-3 py-2 text-gray-500 font-mono text-[10px]">
                        <span>Price (USD)</span>
                        <span>Amount (BTC)</span>
                        <span>Total</span>
                    </div>

                    {/* Asks (Red) */}
                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-x-0 bottom-0 flex flex-col-reverse">
                            {asks.map((ask, i) => (
                                <div key={i} className="flex justify-between px-3 py-1 hover:bg-white/5 cursor-pointer group">
                                    <span className="text-red-400 font-mono group-hover:text-red-300">{ask.price.toFixed(1)}</span>
                                    <span className="text-gray-300">{ask.amount.toFixed(4)}</span>
                                    <span className="text-gray-500">{ask.total.toFixed(2)}K</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Spread */}
                    <div className="py-2 text-center border-y border-white/10 bg-white/5">
                        <span className="text-emerald-400 font-bold text-lg">${currentPrice.toFixed(2)}</span>
                        <span className="ml-2 text-[10px] text-gray-400">Spread: 0.1%</span>
                    </div>

                    {/* Bids (Green) */}
                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-x-0 top-0 flex flex-col">
                            {bids.map((bid, i) => (
                                <div key={i} className="flex justify-between px-3 py-1 hover:bg-white/5 cursor-pointer group">
                                    <span className="text-emerald-400 font-mono group-hover:text-emerald-300">{bid.price.toFixed(1)}</span>
                                    <span className="text-gray-300">{bid.amount.toFixed(4)}</span>
                                    <span className="text-gray-500">{bid.total.toFixed(2)}K</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trade Actions */}
                <div className="p-4 border-t border-white/10 bg-dark-bg">
                    <div className="flex gap-2 mb-3">
                        <button className="flex-1 py-1.5 rounded bg-white/10 text-white text-xs font-medium hover:bg-white/20">Limit</button>
                        <button className="flex-1 py-1.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/50">Market</button>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="bg-black/40 rounded px-3 py-2 border border-white/10 flex justify-between items-center">
                            <span className="text-gray-500 text-xs">Amount</span>
                            <span className="text-white font-mono text-sm">0.1 BTC</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleTrade('buy')}
                            className="py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            Buy BTC
                        </button>
                        <button
                            onClick={() => handleTrade('sell')}
                            className="py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 active:scale-95"
                        >
                            Sell BTC
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: -50 }}
                        animate={{ opacity: 1, y: 20, x: 20 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-4 left-4 right-4 md:right-auto md:w-auto p-3 rounded-lg bg-emerald-500 text-white shadow-xl z-50 flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">{notification}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper component
function CheckCircle({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
}

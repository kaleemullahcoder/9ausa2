"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StockCard from "@/components/StockCard";
import BuySellModal from "@/components/BuySellModal";
import Loading from "@/components/Loading";
import { Stock } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function TradePage() {
    const { user, loading: authLoading } = useAuth();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [modalType, setModalType] = useState<"buy" | "sell">("buy");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function fetchStocks() {
            try {
                const res = await fetch("/api/stocks");
                const data = await res.json();
                if (!data.error) {
                    setStocks(data);
                }
            } catch (error) {
                console.error("Failed to fetch stocks:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (!authLoading) {
            if (!user) {
                window.location.href = "/signin?redirect=/trade";
                return;
            }
            fetchStocks();
        }
    }, [user, authLoading]);

    // Filter stocks
    const filteredStocks = stocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTrade = (stock: Stock, type: "buy" | "sell" = "buy") => {
        setSelectedStock(stock);
        setModalType(type);
        setIsModalOpen(true);
    };

    if (authLoading || isLoading) return <Loading />;

    return (
        <div className="min-h-screen bg-dark-bg">
            <Navbar />
            <div className="flex pt-0">
                <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-72 mt-16 lg:mt-0">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <h1 className="text-3xl font-bold text-white mb-4">Trade</h1>
                            <p className="text-gray-400 mb-6">Execute time-based trades on global markets.</p>

                            {/* Search Bar */}
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search assets (e.g. BTC, Apple)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-dark-card border border-dark-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </motion.div>

                        {/* Info Banner */}
                        <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-8">
                            <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-purple-400 font-bold text-sm">Time-Based Trading</h3>
                                <p className="text-sm text-purple-300/70 mt-1">
                                    Select an asset, choose your duration and amount, and let the admin manage your trade outcome. Potential 80% profit on wins!
                                </p>
                            </div>
                        </div>

                        {/* Stocks Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredStocks.map((stock, index) => (
                                <div key={stock.symbol} className="relative group">
                                    {/* Overlay Button for Quick Trade */}
                                    <StockCard stock={stock} index={index} />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm rounded-xl z-20">
                                        <button
                                            onClick={() => handleTrade(stock, "buy")}
                                            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                        >
                                            Trade
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredStocks.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No assets found matching &quot;{searchQuery}&quot;
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Trade Modal */}
            {selectedStock && (
                <BuySellModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    stock={selectedStock}
                    type={modalType}
                />
            )}
        </div>
    );
}

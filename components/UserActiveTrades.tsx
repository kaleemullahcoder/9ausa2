"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Clock, RefreshCcw, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface TradeSession {
    id: string;
    symbol: string;
    amount: number;
    duration: number;
    start_time: string;
    status: "PENDING" | "WON" | "LOST";
    outcome_override?: string;
    trade_type?: "call" | "put";
}

export default function UserActiveTrades() {
    const { session } = useAuth();
    const [sessions, setSessions] = useState<TradeSession[]>([]);
    const [loading, setLoading] = useState(false);
    const prevSessionsRef = useRef<TradeSession[]>([]);

    // Countdown logic
    const [timeLeftMap, setTimeLeftMap] = useState<Record<string, number>>({});

    const fetchSessions = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const res = await fetch("/api/trade/session", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();

                // Check for status changes
                data.forEach((newSession: TradeSession) => {
                    const oldSession = prevSessionsRef.current.find(s => s.id === newSession.id);
                    if (oldSession && oldSession.status === 'PENDING' && newSession.status !== 'PENDING') {
                        // Trade completed!
                        if (newSession.status === 'WON') {
                            const profit = newSession.amount * 0.8;
                            toast.success("Trade Won!", {
                                description: `You earned ${formatCurrency(profit)} on ${newSession.symbol}`,
                                duration: 5000,
                            });
                            // Trigger balance and notification update
                            window.dispatchEvent(new Event('balanceUpdated'));
                            window.dispatchEvent(new Event('notificationsUpdated'));
                        } else {
                            toast.error("Trade Lost", {
                                description: `You lost ${formatCurrency(newSession.amount)} on ${newSession.symbol}`,
                                duration: 5000,
                            });
                            // Trigger notification update even on loss
                            window.dispatchEvent(new Event('notificationsUpdated'));
                        }
                    }
                });

                setSessions(data);
                prevSessionsRef.current = data;
            }
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 2000); // Check every 2s
        return () => clearInterval(interval);
    }, [fetchSessions]);

    // Timer Interval
    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeftMap: Record<string, number> = {};
            sessions.forEach(s => {
                if (s.status === 'PENDING') {
                    // Timezone Fix
                    let createdStr = s.start_time;
                    if (!createdStr.endsWith('Z') && !createdStr.match(/[+-]\d{2}:\d{2}$/)) {
                        createdStr += 'Z';
                    }
                    const startTime = new Date(createdStr).getTime();
                    const endTime = startTime + (s.duration * 1000);
                    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
                    newTimeLeftMap[s.id] = remaining;
                }
            });
            setTimeLeftMap(newTimeLeftMap);
        }, 1000);
        return () => clearInterval(timer);
    }, [sessions]);

    // Filter to show active or recently completed
    const displaySessions = sessions.filter(s => s.status === 'PENDING' || (new Date(s.start_time).getTime() + s.duration * 1000 + 60000 > Date.now()));

    if (displaySessions.length === 0) return null;

    return (
        <div className="w-full bg-dark-card border border-dark-border rounded-xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Active Time Trades
                </h2>
                <button onClick={fetchSessions} disabled={loading} className="text-gray-400 hover:text-white">
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="space-y-3">
                {displaySessions.map((item) => {
                    const remaining = timeLeftMap[item.id] !== undefined ? timeLeftMap[item.id] : item.duration;
                    const progress = Math.min(100, Math.max(0, (remaining / item.duration) * 100));

                    return (
                        <div key={item.id} className="relative bg-dark-hover rounded-lg p-4 border border-dark-border overflow-hidden">
                            {/* Progress Bar for Pending Trades */}
                            {item.status === 'PENDING' && (
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10 gap-2 sm:gap-0">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="font-bold text-lg text-white flex items-center gap-2">
                                            {item.symbol}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {item.status === 'PENDING' ? 'Trade in progress' :
                                                item.status === 'WON' ? 'Trade Won' : 'Trade Ended'}
                                        </div>
                                    </div>

                                    {/* Trade Type Badge */}
                                    {item.trade_type && (
                                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 font-bold text-xs ${item.trade_type === 'call' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                            'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}>
                                            {item.trade_type === 'call' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                            {item.trade_type.toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Timer - Central & Prominent */}
                                {item.status === 'PENDING' && (
                                    <div className="mt-2 sm:mt-0 sm:absolute sm:left-1/2 sm:top-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 flex items-center justify-center gap-2 bg-dark-card/50 px-4 py-1.5 rounded-full border border-dark-border backdrop-blur-sm z-20">
                                        <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
                                        <span className="font-mono text-xl font-bold text-white tracking-wider tabular-nums">
                                            00:{remaining.toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                )}

                                <div className="text-right">
                                    <div className="text-lg font-bold text-white">{formatCurrency(item.amount)}</div>
                                    <div className={`text-xs font-bold mt-1 ${item.status === 'PENDING' ? 'text-yellow-500' :
                                        item.status === 'WON' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {item.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

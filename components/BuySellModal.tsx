"use client";

import { useState, useEffect } from "react";
import { X, Clock, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Stock } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BuySellModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  type: "buy" | "sell";
}

interface TradeSetting {
  duration_seconds: number;
  profit_percentage: number;
  is_active: boolean;
}

// Default trade settings
const DEFAULT_TRADE_SETTINGS: TradeSetting[] = [
  { duration_seconds: 60, profit_percentage: 30, is_active: true },
  { duration_seconds: 120, profit_percentage: 50, is_active: true },
  { duration_seconds: 180, profit_percentage: 60, is_active: true },
  { duration_seconds: 240, profit_percentage: 70, is_active: true },
  { duration_seconds: 300, profit_percentage: 80, is_active: true },
];

// Preset amounts
const PRESET_AMOUNTS = [50, 100, 150, 200, 500];

// Generate mock candlestick data for the chart
const generateCandlestickData = (basePrice: number) => {
  const data = [];
  let currentPrice = basePrice;

  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - 0.5) * (basePrice * 0.02);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.01);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.01);

    data.push({
      time: i,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    currentPrice = close;
  }

  return data;
};

export default function BuySellModal({
  isOpen,
  onClose,
  stock,
  type,
}: BuySellModalProps) {
  const { session } = useAuth();

  // Trade Settings
  const [tradeSettings, setTradeSettings] = useState<TradeSetting[]>(DEFAULT_TRADE_SETTINGS);
  const [selectedSetting, setSelectedSetting] = useState<TradeSetting | null>(null);

  // Time Trade State
  const [duration, setDuration] = useState<number>(60);
  const [profitPercentage, setProfitPercentage] = useState<number>(30);
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Trade Monitoring
  const [activeTrade, setActiveTrade] = useState<string | null>(null); // Trade ID
  const [activeTradeData, setActiveTradeData] = useState<any | null>(null); // Full trade object
  const [tradeResult, setTradeResult] = useState<'WON' | 'LOST' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Fetch trade settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/trade/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.settings && data.settings.length > 0) {
            setTradeSettings(data.settings);
            // Set default selection
            const defaultSetting = data.settings[0];
            setSelectedSetting(defaultSetting);
            setDuration(defaultSetting.duration_seconds);
            setProfitPercentage(defaultSetting.profit_percentage);
          }
        }
      } catch (error) {
        console.error("Error fetching trade settings:", error);
      }
    };

    if (isOpen) {
      fetchSettings();
      // Reset active trade state on open
      setActiveTrade(null);
      setTradeResult(null);
      setTimeLeft(0);
    }
  }, [isOpen]);

  // Generate candlestick data when stock changes
  useEffect(() => {
    if (stock) {
      setCandlestickData(generateCandlestickData(stock.price));
    }
  }, [stock]);

  // Update candlestick data every 2 seconds for live effect
  useEffect(() => {
    if (!stock || !isOpen) return;

    const interval = setInterval(() => {
      setCandlestickData(prev => {
        const newData = [...prev];
        newData.shift(); // Remove first element

        const lastCandle = newData[newData.length - 1];
        const change = (Math.random() - 0.5) * (stock.price * 0.02);
        const open = lastCandle.close;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (stock.price * 0.01);
        const low = Math.min(open, close) - Math.random() * (stock.price * 0.01);

        newData.push({
          time: lastCandle.time + 1,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
        });

        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [stock, isOpen]);

  // Timer Countdown
  useEffect(() => {
    if (!activeTrade || tradeResult) return;

    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeTrade, timeLeft, tradeResult]);

  // Status Polling
  useEffect(() => {
    if (!activeTrade || tradeResult) return;

    const checkResult = async () => {
      try {
        // console.log("Checking trade status for:", activeTrade);
        const response = await fetch('/api/trade/session', { cache: 'no-store' });
        const data = await response.json();

        // Find our specific trade
        const myTrade = data.find((t: any) => t.id === activeTrade);

        if (myTrade) {
          // console.log("Found trade status:", myTrade.status);
          if (myTrade.status !== 'PENDING') {
            setTradeResult(myTrade.status);
            window.dispatchEvent(new Event('balanceUpdated'));
          }
        }
      } catch (e) {
        console.error("Error checking result", e);
      }
    };

    // Initial check (in case we reloaded into an expired trade)
    checkResult();

    // Poll consistently every 2 seconds
    const interval = setInterval(checkResult, 2000);
    return () => clearInterval(interval);
  }, [activeTrade, tradeResult]); // Removed timeLeft dependency to prevent interval clearing

  if (!stock) return null;

  const handleDurationSelect = (setting: TradeSetting) => {
    setSelectedSetting(setting);
    setDuration(setting.duration_seconds);
    setProfitPercentage(setting.profit_percentage);
  };

  const getEffectiveAmount = () => {
    if (useCustomAmount && customAmount) {
      return parseFloat(customAmount) || 0;
    }
    return amount;
  };

  const handleSubmit = async (direction: 'call' | 'put') => {
    if (!session) {
      setError("Please sign in to place orders");
      return;
    }

    const tradeAmount = getEffectiveAmount();

    if (tradeAmount < 10) {
      setError("Minimum trade amount is $10");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = session.access_token;

      // Ensure symbol has /USDT suffix for trade sessions
      const tradeSymbol = stock.symbol.includes('/') ? stock.symbol : `${stock.symbol}/USDT`;

      const response = await fetch("/api/trade/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: tradeSymbol,
          amount: tradeAmount,
          duration: duration,
          profit_percentage: profitPercentage,
          trade_type: direction
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transaction");
      }

      // Success - trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));

      // Don't close immediately. Instead, switch to "Active Trade" view
      if (data.session && data.session.id) {
        const tradeId = data.session.id;
        setActiveTrade(tradeId);
        setTimeLeft(duration);
        // Set initial trade data
        setActiveTradeData({
          id: tradeId,
          symbol: tradeSymbol,
          amount: tradeAmount,
          duration: duration,
          profit_percentage: profitPercentage,
          trade_type: direction,
          start_time: new Date().toISOString(),
        });
      } else if (data.tradeId) {
        // Handle legacy response format if any
        setActiveTrade(data.tradeId);
        setTimeLeft(duration);
        setActiveTradeData({
          id: data.tradeId,
          symbol: tradeSymbol,
          amount: tradeAmount,
          duration: duration,
          profit_percentage: profitPercentage,
          trade_type: direction,
          start_time: new Date().toISOString(),
        });
      } else {
        // Fallback if no ID returned
        console.warn("No trade ID returned", data);
        toast.success("Trade Executed");
        onClose();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "Failed to process transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate min and max for chart scaling
  const allPrices = candlestickData.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;

  const effectiveAmount = getEffectiveAmount();
  const potentialProfit = effectiveAmount * (profitPercentage / 100);
  const totalPayout = effectiveAmount + potentialProfit;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl rounded-lg border border-dark-border bg-dark-card shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-border bg-purple-500/10 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" /> {activeTrade ? 'Active Trade Status' : `Trade ${stock.symbol}/USDT`}
                </h2>
                <button onClick={onClose} className="rounded-lg p-1 text-blue-accent hover:bg-dark-hover">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!activeTrade && (
                <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Stock Info with Live Chart */}
                  <div className="rounded-lg bg-dark-hover p-4 border border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-blue-accent text-lg">{stock.symbol}/USDT</div>
                        <div className="text-sm text-blue-accent/70">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{formatCurrency(stock.price)}</div>
                        <div className={`text-sm flex items-center gap-1 justify-end ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    {/* Candlestick Chart */}
                    <div className="relative h-48 bg-dark-bg rounded-lg p-2">
                      <svg width="100%" height="100%" className="overflow-visible">
                        {candlestickData.map((candle, index) => {
                          const x = (index / (candlestickData.length - 1)) * 100;
                          const yHigh = ((maxPrice - candle.high) / priceRange) * 100;
                          const yLow = ((maxPrice - candle.low) / priceRange) * 100;
                          const yOpen = ((maxPrice - candle.open) / priceRange) * 100;
                          const yClose = ((maxPrice - candle.close) / priceRange) * 100;

                          const isGreen = candle.close >= candle.open;
                          const color = isGreen ? "#10b981" : "#ef4444";

                          return (
                            <g key={index}>
                              {/* Wick */}
                              <line
                                x1={`${x}%`}
                                y1={`${yHigh}%`}
                                x2={`${x}%`}
                                y2={`${yLow}%`}
                                stroke={color}
                                strokeWidth="1"
                              />
                              {/* Body */}
                              <rect
                                x={`${x - 1.5}%`}
                                y={`${Math.min(yOpen, yClose)}%`}
                                width="3%"
                                height={`${Math.abs(yClose - yOpen) || 0.5}%`}
                                fill={color}
                              />
                            </g>
                          );
                        })}
                      </svg>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-green-500" /> Live Chart
                      </div>
                    </div>
                  </div>

                  {/* Duration Selection with Profit Percentages */}
                  <div>
                    <label className="block text-sm font-medium text-blue-accent mb-2">
                      Duration & Profit Rate
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {tradeSettings.map((setting) => (
                        <button
                          key={setting.duration_seconds}
                          type="button"
                          onClick={() => handleDurationSelect(setting)}
                          className={`px-3 py-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-1 ${duration === setting.duration_seconds
                            ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-400"
                            : "bg-dark-hover text-blue-accent hover:text-white border border-dark-border hover:border-purple-500/50"
                            }`}
                        >
                          <span className="font-bold">{setting.duration_seconds}s</span>
                          <span className={`text-xs ${duration === setting.duration_seconds ? 'text-green-300' : 'text-green-400'}`}>
                            +{setting.profit_percentage}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-blue-accent">Amount ($)</label>
                      <button
                        type="button"
                        onClick={() => setUseCustomAmount(!useCustomAmount)}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        {useCustomAmount ? 'Use Presets' : 'Enter Custom Amount (Max)'}
                      </button>
                    </div>

                    {useCustomAmount ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter any amount (min $10)"
                          min="10"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum: $10 | No maximum limit</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {PRESET_AMOUNTS.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAmount(a)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${amount === a
                              ? "bg-green-600 text-white shadow-lg"
                              : "bg-dark-hover text-blue-accent hover:text-white border border-dark-border"
                              }`}
                          >
                            ${a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trade Summary */}
                  <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 p-4 border border-purple-500/20">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Investment</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(effectiveAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Duration</p>
                        <p className="text-lg font-bold text-white">{duration} seconds</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Profit Rate</p>
                        <p className="text-lg font-bold text-green-400">+{profitPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Potential Payout</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(totalPayout)}</p>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-sm text-center text-purple-200">
                        Trade <b>{stock.symbol}/USDT</b> for <b>{duration}s</b> at <b>{formatCurrency(effectiveAmount)}</b>
                      </p>
                      <p className="text-xs text-center text-green-300/70 mt-1">
                        Win: +{formatCurrency(potentialProfit)} profit | Loss: -{formatCurrency(effectiveAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleSubmit('call')}
                      disabled={isSubmitting || effectiveAmount < 10}
                      className="py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-green-500/20 disabled:opacity-50 bg-green-500 hover:bg-green-600 flex flex-col items-center justify-center gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-lg">Buy (UP)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmit('put')}
                      disabled={isSubmitting || effectiveAmount < 10}
                      className="py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-red-500/20 disabled:opacity-50 bg-red-500 hover:bg-red-600 flex flex-col items-center justify-center gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-6 h-6" />
                        <span className="text-lg">Buy (DOWN)</span>
                      </div>
                    </button>
                  </div>
                </form>
              )}

              {/* ACTIVE TRADE VIEW */}
              {activeTrade && activeTradeData && (
                <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                  {!tradeResult ? (
                    <div className="text-center w-full">
                      <h3 className="text-xl font-bold text-white mb-2">Trade in Progress</h3>
                      <div className="text-blue-accent mb-8">
                        {activeTradeData.trade_type === 'call' ?
                          <span className="text-green-400 font-bold flex items-center justify-center gap-1"><TrendingUp /> CALL (UP)</span> :
                          <span className="text-red-400 font-bold flex items-center justify-center gap-1"><TrendingDown /> PUT (DOWN)</span>
                        }
                      </div>

                      {/* BIG TIMER */}
                      <div className="relative mb-8 flex justify-center">
                        <div className="w-48 h-48 rounded-full border-4 border-dark-border flex items-center justify-center relative">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="90" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-dark-hover" />
                            <circle
                              cx="96" cy="96" r="90"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              className="text-purple-500 transition-all duration-1000 linear"
                              strokeDasharray={565}
                              strokeDashoffset={565 - (565 * (timeLeft / activeTradeData.duration))}
                            />
                          </svg>
                          <div className="text-4xl font-mono font-bold text-white relative z-10 transition-all duration-300">
                            {timeLeft > 0 ? `${timeLeft}s` : '...'}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-40 h-40 rounded-full bg-purple-500/5 ${timeLeft > 0 ? 'animate-pulse' : ''}`}></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center max-w-sm mx-auto">
                        <div className="bg-dark-hover p-3 rounded-lg">
                          <div className="text-xs text-gray-400">Invested</div>
                          <div className="text-lg font-bold text-white">{formatCurrency(activeTradeData.amount)}</div>
                        </div>
                        <div className="bg-dark-hover p-3 rounded-lg">
                          <div className="text-xs text-gray-400">Potential Payout</div>
                          <div className="text-lg font-bold text-green-400">
                            {formatCurrency(activeTradeData.amount * (1 + activeTradeData.profit_percentage / 100))}
                          </div>
                        </div>
                      </div>

                      <p className="mt-8 text-sm text-gray-500 animate-pulse">
                        Waiting for expiration...
                      </p>
                    </div>
                  ) : (
                    <div className="text-center w-full animate-in zoom-in duration-300">
                      <div className="flex justify-center mb-6">
                        {tradeResult === 'WON' ? (
                          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center ring-4 ring-green-500/30">
                            <TrendingUp className="w-12 h-12 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center ring-4 ring-red-500/30">
                            <TrendingDown className="w-12 h-12 text-red-500" />
                          </div>
                        )}
                      </div>

                      <h3 className="text-3xl font-bold text-white mb-2">
                        {tradeResult === 'WON' ? 'YOU WON!' : 'TRADE LOST'}
                      </h3>

                      <div className="text-lg mb-8">
                        {tradeResult === 'WON' ? (
                          <span className="text-green-400">
                            Profit: +{formatCurrency(activeTradeData.amount * (activeTradeData.profit_percentage / 100))}
                          </span>
                        ) : (
                          <span className="text-red-400">
                            Loss: -{formatCurrency(activeTradeData.amount)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          window.location.reload();
                        }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                      >
                        Close & Continue Trading
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

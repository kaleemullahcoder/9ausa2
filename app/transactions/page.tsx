"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { History, AlertCircle } from "lucide-react";
import Loading from "@/components/Loading";
import Link from "next/link";

interface Transaction {
  id: string;
  symbol: string;
  type: string;
  quantity: number;
  price: number;
  total_amount: number;
  created_at: string;
}

interface TradeSession {
  id: string;
  symbol: string;
  amount: number;
  duration: number;
  start_time: string;
  status: "PENDING" | "WON" | "LOST";
  profit_percentage?: number;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tradeSessions, setTradeSessions] = useState<TradeSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'transactions'>('trades');

  useEffect(() => {
    const fetchData = async () => {
      if (!session) {
        router.push("/signin?redirect=/transactions");
        return;
      }

      try {
        // Fetch both transactions and trade sessions
        const [transRes, sessionRes] = await Promise.all([
          fetch("/api/transactions", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch("/api/trade/session", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        ]);

        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactions(transData.transactions || []);
        }

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          // Filter to show only completed trades
          const completedTrades = sessionData.filter((s: TradeSession) => s.status !== 'PENDING');
          setTradeSessions(completedTrades);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [session, authLoading, router]);

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <Loading />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <div className="flex-1 p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                <p className="text-blue-accent/70">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <History className="h-8 w-8 text-blue-primary" />
                <h1 className="text-3xl font-bold text-white">Trade History</h1>
              </div>
              <p className="text-blue-accent/70">
                View all your past trades and transactions
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('trades')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'trades'
                    ? 'bg-blue-primary text-white'
                    : 'bg-dark-card text-gray-400 hover:text-white'
                  }`}
              >
                Time Trades ({tradeSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'transactions'
                    ? 'bg-blue-primary text-white'
                    : 'bg-dark-card text-gray-400 hover:text-white'
                  }`}
              >
                Stock Transactions ({transactions.length})
              </button>
            </div>

            {/* Trade Sessions Tab */}
            {activeTab === 'trades' && (
              <>
                {tradeSessions.length === 0 ? (
                  <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                    <p className="text-blue-accent/70">No completed trades yet</p>
                    <Link
                      href="/trade"
                      className="mt-4 inline-block px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all"
                    >
                      Start Trading
                    </Link>
                  </div>
                ) : (
                  <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-dark-hover">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Symbol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Result
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Profit/Loss
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                          {tradeSessions.map((trade) => {
                            const profitPercent = trade.profit_percentage || 80;
                            const profitLoss = trade.status === 'WON'
                              ? trade.amount * (profitPercent / 100)
                              : -trade.amount;
                            return (
                              <tr key={trade.id} className="hover:bg-dark-hover transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                                  {new Date(trade.start_time).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                  {trade.symbol}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                                  {formatCurrency(trade.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                                  {trade.duration}s
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${trade.status === "WON"
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-red-500/10 text-red-400"
                                      }`}
                                  >
                                    {trade.status}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${trade.status === 'WON' ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                  {trade.status === 'WON' ? '+' : ''}{formatCurrency(profitLoss)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <>
                {transactions.length === 0 ? (
                  <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                    <p className="text-blue-accent/70">No transactions yet</p>
                    <Link
                      href="/markets"
                      className="mt-4 inline-block px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all"
                    >
                      Browse Stocks
                    </Link>
                  </div>
                ) : (
                  <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-dark-hover">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Symbol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-dark-hover transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${transaction.type === "buy"
                                      ? "bg-green-500/10 text-green-400"
                                      : "bg-red-500/10 text-red-400"
                                    }`}
                                >
                                  {transaction.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                {transaction.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                                {transaction.quantity.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                                {formatCurrency(transaction.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {formatCurrency(transaction.total_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

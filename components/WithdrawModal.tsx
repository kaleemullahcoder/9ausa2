"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Lock, AlertTriangle, Wallet, CheckCircle, XCircle, Clock, Bitcoin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WithdrawalRequest {
    id: string;
    amount: number;
    network: string;
    wallet_address: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_reason?: string;
    created_at: string;
    processed_at?: string;
}

type NetworkType = 'ERC20' | 'TRC20' | 'BTC';

const NETWORKS: { id: NetworkType; name: string; icon: string; description: string }[] = [
    { id: 'ERC20', name: 'ERC-20 (Ethereum)', icon: '🔷', description: 'Ethereum Network (USDT, ETH)' },
    { id: 'TRC20', name: 'TRC-20 (Tron)', icon: '🔴', description: 'Tron Network (USDT, TRX)' },
    { id: 'BTC', name: 'Bitcoin', icon: '🟠', description: 'Bitcoin Network' },
];

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
    const { session } = useAuth();
    const [step, setStep] = useState<'select' | 'form' | 'history'>('select');
    const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Fetch withdrawal history
    const fetchWithdrawals = useCallback(async () => {
        if (!session) return;
        setLoadingHistory(true);
        try {
            const response = await fetch("/api/withdrawals", {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setWithdrawals(data.withdrawals || []);
            }
        } catch (err) {
            console.error("Error fetching withdrawals:", err);
        } finally {
            setLoadingHistory(false);
        }
    }, [session]);

    useEffect(() => {
        if (isOpen && session) {
            fetchWithdrawals();
        }
    }, [isOpen, session, fetchWithdrawals]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStep('select');
            setSelectedNetwork(null);
            setAmount('');
            setWalletAddress('');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !selectedNetwork) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/withdrawals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    network: selectedNetwork,
                    wallet_address: walletAddress,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit withdrawal");
            }

            toast.success("Withdrawal Request Submitted", {
                description: "Your request is pending admin approval.",
            });

            // Refresh withdrawal history
            await fetchWithdrawals();
            setStep('history');
            setAmount('');
            setWalletAddress('');
            setSelectedNetwork(null);
        } catch (err: any) {
            setError(err.message || "Failed to submit withdrawal");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                );
            case 'approved':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                );
        }
    };

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
                        <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-dark-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                        <Wallet className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
                                        <p className="text-xs text-gray-400">
                                            {step === 'select' && 'Select withdrawal network'}
                                            {step === 'form' && 'Enter withdrawal details'}
                                            {step === 'history' && 'Your withdrawal history'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex border-b border-dark-border">
                                <button
                                    onClick={() => setStep('select')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${step === 'select' || step === 'form'
                                        ? 'text-purple-400 border-b-2 border-purple-400'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    New Withdrawal
                                </button>
                                <button
                                    onClick={() => setStep('history')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${step === 'history'
                                        ? 'text-purple-400 border-b-2 border-purple-400'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    History ({withdrawals.length})
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {error && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Network Selection */}
                                {step === 'select' && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-400 mb-4">
                                            Choose the blockchain network for your withdrawal:
                                        </p>
                                        {NETWORKS.map((network) => (
                                            <button
                                                key={network.id}
                                                onClick={() => {
                                                    setSelectedNetwork(network.id);
                                                    setStep('form');
                                                }}
                                                className="w-full p-4 bg-dark-hover border border-dark-border rounded-lg hover:border-purple-500/50 transition-all flex items-center gap-4 group"
                                            >
                                                <span className="text-2xl">{network.icon}</span>
                                                <div className="text-left flex-1">
                                                    <p className="font-medium text-white">{network.name}</p>
                                                    <p className="text-xs text-gray-400">{network.description}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Withdrawal Form */}
                                {step === 'form' && selectedNetwork && (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Selected Network */}
                                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">
                                                        {NETWORKS.find(n => n.id === selectedNetwork)?.icon}
                                                    </span>
                                                    <span className="font-medium text-white">
                                                        {NETWORKS.find(n => n.id === selectedNetwork)?.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep('select')}
                                                    className="text-xs text-purple-400 hover:text-purple-300"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Amount (USD)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="Enter amount"
                                                    min="10"
                                                    step="0.01"
                                                    required
                                                    className="w-full pl-8 pr-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: $10</p>
                                        </div>

                                        {/* Wallet Address */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {selectedNetwork === 'BTC' ? 'Bitcoin' : selectedNetwork} Wallet Address
                                            </label>
                                            <input
                                                type="text"
                                                value={walletAddress}
                                                onChange={(e) => setWalletAddress(e.target.value)}
                                                placeholder={
                                                    selectedNetwork === 'BTC'
                                                        ? 'bc1q...'
                                                        : selectedNetwork === 'ERC20'
                                                            ? '0x...'
                                                            : 'T...'
                                                }
                                                required
                                                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Double-check your address. Incorrect addresses may result in loss of funds.
                                            </p>
                                        </div>

                                        {/* Warning */}
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div className="text-xs text-yellow-300">
                                                <p className="font-medium mb-1">Important Notice</p>
                                                <ul className="list-disc list-inside space-y-1 text-yellow-400/80">
                                                    <li>Withdrawals are processed within 24-48 hours</li>
                                                    <li>Make sure the network matches your wallet</li>
                                                    <li>Admin approval is required for all withdrawals</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !amount || !walletAddress}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
                                        </button>
                                    </form>
                                )}

                                {/* Withdrawal History */}
                                {step === 'history' && (
                                    <div className="space-y-4">
                                        {loadingHistory ? (
                                            <div className="text-center py-8">
                                                <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-gray-400">Loading history...</p>
                                            </div>
                                        ) : withdrawals.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                                <p className="text-gray-400">No withdrawal requests yet</p>
                                                <button
                                                    onClick={() => setStep('select')}
                                                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                                                >
                                                    Make Your First Withdrawal
                                                </button>
                                            </div>
                                        ) : (
                                            withdrawals.map((w) => (
                                                <div
                                                    key={w.id}
                                                    className={`p-4 rounded-lg border ${w.status === 'approved'
                                                        ? 'bg-green-500/5 border-green-500/20'
                                                        : w.status === 'rejected'
                                                            ? 'bg-red-500/5 border-red-500/20'
                                                            : 'bg-dark-hover border-dark-border'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-bold text-white">{formatCurrency(w.amount)}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {w.network} • {new Date(w.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(w.status)}
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-mono break-all mb-2">
                                                        {w.wallet_address}
                                                    </p>
                                                    {w.admin_reason && (
                                                        <div className={`p-2 rounded text-xs ${w.status === 'rejected'
                                                            ? 'bg-red-500/10 text-red-400'
                                                            : 'bg-gray-500/10 text-gray-400'
                                                            }`}>
                                                            <span className="font-medium">Admin Note:</span> {w.admin_reason}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

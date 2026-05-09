"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCcw,
    DollarSign,
    User,
    AlertTriangle,
    Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface WithdrawalRequest {
    id: string;
    user_id: string;
    amount: number;
    network: string;
    wallet_address: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_reason: string | null;
    processed_by: string | null;
    processed_at: string | null;
    created_at: string;
    users: {
        id: string;
        email: string;
        name: string;
        unique_user_id: string;
        account_balance: number;
    };
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminWithdrawalManagement() {
    const { session } = useAuth();
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; withdrawalId: string | null }>({
        isOpen: false,
        withdrawalId: null,
    });
    const [rejectReason, setRejectReason] = useState('');

    const fetchWithdrawals = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        try {
            const statusParam = filterStatus === 'all' ? '' : `?status=${filterStatus}`;
            const response = await fetch(`/api/admin/withdrawals${statusParam}`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setWithdrawals(data.withdrawals || []);
            } else {
                toast.error("Failed to fetch withdrawals");
            }
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            toast.error("Error loading withdrawals");
        } finally {
            setLoading(false);
        }
    }, [session, filterStatus]);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    const handleApprove = async (withdrawalId: string) => {
        if (!session) return;

        setProcessingId(withdrawalId);
        try {
            const response = await fetch("/api/admin/withdrawals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    withdrawal_id: withdrawalId,
                    action: 'approve',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Withdrawal Approved", {
                    description: "The withdrawal has been processed and user notified.",
                });
                fetchWithdrawals();
            } else {
                toast.error(data.error || "Failed to approve withdrawal");
            }
        } catch (error) {
            toast.error("Error processing withdrawal");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!session || !rejectModal.withdrawalId) return;

        setProcessingId(rejectModal.withdrawalId);
        try {
            const response = await fetch("/api/admin/withdrawals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    withdrawal_id: rejectModal.withdrawalId,
                    action: 'reject',
                    reason: rejectReason || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Withdrawal Rejected", {
                    description: "The withdrawal has been rejected and user notified.",
                });
                setRejectModal({ isOpen: false, withdrawalId: null });
                setRejectReason('');
                fetchWithdrawals();
            } else {
                toast.error(data.error || "Failed to reject withdrawal");
            }
        } catch (error) {
            toast.error("Error processing withdrawal");
        } finally {
            setProcessingId(null);
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

    const getNetworkIcon = (network: string) => {
        switch (network) {
            case 'ERC20':
                return '🔷';
            case 'TRC20':
                return '🔴';
            case 'BTC':
                return '🟠';
            default:
                return '💰';
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            w.users?.email?.toLowerCase().includes(search) ||
            w.users?.name?.toLowerCase().includes(search) ||
            w.users?.unique_user_id?.toLowerCase().includes(search) ||
            w.wallet_address.toLowerCase().includes(search)
        );
    });

    const stats = {
        pending: withdrawals.filter(w => w.status === 'pending').length,
        approved: withdrawals.filter(w => w.status === 'approved').length,
        rejected: withdrawals.filter(w => w.status === 'rejected').length,
        totalPending: withdrawals
            .filter(w => w.status === 'pending')
            .reduce((sum, w) => sum + Number(w.amount), 0),
    };

    return (
        <div className="p-6 bg-dark-card border border-dark-border rounded-xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Withdrawal Management</h2>
                        <p className="text-sm text-gray-400">Process client withdrawal requests</p>
                    </div>
                </div>
                <button
                    onClick={fetchWithdrawals}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-gray-300 hover:text-white hover:border-purple-500 transition-colors"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.approved}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">Rejected</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400 text-sm font-medium">Pending Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPending)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === status
                                ? 'bg-purple-600 text-white'
                                : 'bg-dark-hover text-gray-400 hover:text-white border border-dark-border'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by email, name, or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>
            </div>

            {/* Withdrawals List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading withdrawals...</p>
                </div>
            ) : filteredWithdrawals.length === 0 ? (
                <div className="text-center py-12">
                    <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                        {filterStatus === 'all' ? 'No withdrawal requests' : `No ${filterStatus} withdrawals`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredWithdrawals.map((withdrawal) => (
                        <motion.div
                            key={withdrawal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border ${withdrawal.status === 'pending'
                                ? 'bg-dark-hover border-yellow-500/30'
                                : withdrawal.status === 'approved'
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                                }`}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* User Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-dark-bg rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{withdrawal.users?.name || 'Unknown'}</p>
                                        <p className="text-sm text-gray-400">{withdrawal.users?.email}</p>
                                        <p className="text-xs text-gray-500">ID: {withdrawal.users?.unique_user_id}</p>
                                    </div>
                                </div>

                                {/* Withdrawal Details */}
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                                        <p className="text-lg font-bold text-white">{formatCurrency(withdrawal.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Network</p>
                                        <p className="flex items-center gap-2 text-white">
                                            <span>{getNetworkIcon(withdrawal.network)}</span>
                                            {withdrawal.network}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">User Balance</p>
                                        <p className={`font-medium ${Number(withdrawal.users?.account_balance) >= withdrawal.amount
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                            }`}>
                                            {formatCurrency(withdrawal.users?.account_balance || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Status</p>
                                        {getStatusBadge(withdrawal.status)}
                                    </div>
                                </div>

                                {/* Actions */}
                                {withdrawal.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(withdrawal.id)}
                                            disabled={processingId === withdrawal.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectModal({ isOpen: true, withdrawalId: withdrawal.id })}
                                            disabled={processingId === withdrawal.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Wallet Address */}
                            <div className="mt-4 pt-4 border-t border-dark-border">
                                <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                                <p className="font-mono text-sm text-gray-300 break-all">{withdrawal.wallet_address}</p>
                            </div>

                            {/* Admin Reason (for rejected) */}
                            {withdrawal.admin_reason && (
                                <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                                    <p className="text-xs text-red-400">
                                        <span className="font-medium">Rejection Reason:</span> {withdrawal.admin_reason}
                                    </p>
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                <span>Requested: {new Date(withdrawal.created_at).toLocaleString()}</span>
                                {withdrawal.processed_at && (
                                    <span>Processed: {new Date(withdrawal.processed_at).toLocaleString()}</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectModal.isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRejectModal({ isOpen: false, withdrawalId: null })}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Reject Withdrawal</h3>
                                        <p className="text-sm text-gray-400">Provide a reason for rejection (optional)</p>
                                    </div>
                                </div>

                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g., Suspicious activity, Insufficient verification..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                                />

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            setRejectModal({ isOpen: false, withdrawalId: null });
                                            setRejectReason('');
                                        }}
                                        className="flex-1 py-2 bg-dark-hover border border-dark-border rounded-lg text-gray-300 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={processingId !== null}
                                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {processingId ? 'Processing...' : 'Confirm Rejection'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

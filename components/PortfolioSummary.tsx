"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Portfolio } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const isPositive = portfolio.totalGain >= 0;
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Data now comes directly from the portfolio prop which is typed
  const creditScore = portfolio.creditScore ?? 1;
  const level = portfolio.level; // Allow it to be whatever comes from API, even if 0 or undefined

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value & Banking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-2 rounded-lg border border-dark-border bg-dark-card p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-blue-accent/70">Total Portfolio Value</h3>
              <Wallet className="h-5 w-5 text-blue-primary" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {formatCurrency(portfolio.totalValue)}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
            >
              <ArrowDownCircle className="w-4 h-4" /> Deposit
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
            >
              <ArrowUpCircle className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </motion.div>

        {/* Gamification: Level & Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-dark-border bg-dark-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-blue-accent/70">Credit Score</h3>
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Simple visual ring */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="18" stroke="#1e293b" strokeWidth="4" fill="none" />
                <circle cx="20" cy="20" r="18" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="113" strokeDashoffset={113 - (113 * creditScore / 100)} />
              </svg>
              <span className="text-xs font-bold text-white">{creditScore}</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-white font-medium text-sm">
              {creditScore >= 80 ? 'Excellent Standing' : creditScore >= 50 ? 'Good Standing' : creditScore >= 20 ? 'Fair Standing' : 'Building Credit'}
            </div>
            <div className={`text-xs mt-1 ${creditScore >= 80 ? 'text-green-400' : creditScore >= 50 ? 'text-blue-400' : 'text-yellow-400'}`}>
              {creditScore >= 80 ? 'Top 10% of Traders' : creditScore >= 50 ? 'Above Average' : 'Keep Trading'}
            </div>
          </div>
        </motion.div>

        {/* Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-purple-500/30 bg-gradient-to-br from-dark-card to-purple-900/10 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-blue-accent/70">Trader Level</h3>
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white leading-none">{level || 1}</span>
            <span className="text-sm text-purple-300 mb-1">/ 10</span>
          </div>
          <div className="w-full bg-dark-bg h-2 mt-4 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${((level || 1) / 10) * 100}%` }}></div>
          </div>
        </motion.div>

      </div>

      {/* Modals */}
      <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} />
    </>
  );
}

"use client";

import { X, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type CryptoType = "ethereum" | "tron" | "bitcoin";

interface CryptoInfo {
    name: string;
    symbol: string;
    address: string;
    qrImage: string;
    color: string;
    warning: string;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
    const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("ethereum");
    const [copied, setCopied] = useState(false);

    const cryptoData: Record<CryptoType, CryptoInfo> = {
        ethereum: {
            name: "Ethereum",
            symbol: "ETH",
            address: "0xE1A012c52d1e0F7014b9CCF31adCA8aF70eE25C7",
            qrImage: "/eth-qr-new.jpg",
            color: "text-blue-400",
            warning: "Only supports Ethereum assets (ERC20). Sending other assets may result in permanent loss."
        },
        tron: {
            name: "Tron",
            symbol: "TRX",
            address: "TDb2hh9bHHcQJHXhZEJFzAqG2Vbpm6eEz1",
            qrImage: "/tron-qr-new.jpg",
            color: "text-red-400",
            warning: "Only supports Tron assets (TRC10/TRC20). Sending other assets may result in permanent loss."
        },
        bitcoin: {
            name: "Bitcoin",
            symbol: "BTC",
            address: "bc1qxsuamkz08fqcxp07y73d4hmsr7fh3twet3jcvt",
            qrImage: "/BTC_Deposit.jpg",
            color: "text-orange-400",
            warning: "Only supports Bitcoin assets (Ordinals and inscription assets are not supported). Sending other assets may result in permanent loss."
        }
    };

    const currentCrypto = cryptoData[selectedCrypto];

    const handleCopy = () => {
        navigator.clipboard.writeText(currentCrypto.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                        <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-xl font-bold text-white mb-2">Deposit Funds</h2>
                            <p className="text-sm text-gray-400 mb-6">
                                Scan the QR code or copy the address below to deposit cryptocurrency.
                            </p>

                            {/* Crypto Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => {
                                        setSelectedCrypto("ethereum");
                                        setCopied(false);
                                    }}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${selectedCrypto === "ethereum"
                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                        : "bg-dark-hover text-gray-400 hover:text-white border border-dark-border"
                                        }`}
                                >
                                    Ethereum
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCrypto("tron");
                                        setCopied(false);
                                    }}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${selectedCrypto === "tron"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-dark-hover text-gray-400 hover:text-white border border-dark-border"
                                        }`}
                                >
                                    Tron
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCrypto("bitcoin");
                                        setCopied(false);
                                    }}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${selectedCrypto === "bitcoin"
                                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                        : "bg-dark-hover text-gray-400 hover:text-white border border-dark-border"
                                        }`}
                                >
                                    Bitcoin
                                </button>
                            </div>

                            {/* QR Code */}
                            <div className="flex flex-col items-center justify-center mb-6 rounded-lg w-64 h-64 mx-auto overflow-hidden relative bg-black/50 border border-dark-border">
                                <Image
                                    src={currentCrypto.qrImage}
                                    alt={`${currentCrypto.name} QR Code`}
                                    width={500}
                                    height={500}
                                    className="w-full h-full object-cover scale-[1.35]" // aligned center by default, scale to crop text
                                />
                            </div>

                            {/* Wallet Address */}
                            <div className="bg-dark-hover p-4 rounded-lg border border-dark-border mb-4">
                                <p className="text-xs text-gray-500 mb-1">
                                    {currentCrypto.name} Wallet Address
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                    <code className={`text-sm ${currentCrypto.color} break-all`}>
                                        {currentCrypto.address}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 hover:bg-dark-card rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0"
                                    >
                                        {copied ? (
                                            <span className="text-green-500 text-xs whitespace-nowrap">Copied!</span>
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="text-xs text-center text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                {currentCrypto.warning}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AdminTradeControl from "@/components/AdminTradeControl";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminTradesPage() {
    const { session, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!session) {
                router.push("/signin?redirect=/admin/trades");
                return;
            }

            try {
                const res = await fetch("/api/admin/check", {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                const data = await res.json();
                if (data.isAdmin) {
                    setIsAdmin(true);
                } else {
                    router.push("/dashboard");
                }
            } catch (e) {
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) checkAdmin();
    }, [session, authLoading, router]);

    if (authLoading || loading) return <Loading />;

    if (!isAdmin) return null;

    return (
        <>
            <Navbar />
            <Sidebar />
            <div className="flex lg:ml-64 min-h-screen bg-dark-bg pt-20 px-4 pb-8">
                <div className="max-w-7xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Activity className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Live Trading Floor</h1>
                                <p className="text-gray-400">Real-time market monitoring and trade intervention.</p>
                            </div>
                        </div>
                    </motion.div>

                    <AdminTradeControl />
                </div>
            </div>
        </>
    );
}

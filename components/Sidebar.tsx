"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  TrendingUp,
  User,
  Wallet,
  BarChart3,
  Settings,
  X,
  LogOut,
  Shield,
  Users,
  History,
  CandlestickChart,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Public menu items (always visible)
const publicMenuItems = [
  { icon: Home, label: "Home", href: "/", requiresAuth: false },
  { icon: TrendingUp, label: "Markets", href: "/markets", requiresAuth: false },
];

// Protected menu items (only visible when authenticated)
const protectedMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", requiresAuth: true },
  { icon: CandlestickChart, label: "Trade", href: "/trade", requiresAuth: true },
  { icon: History, label: "Trade History", href: "/transactions", requiresAuth: true },
  { icon: User, label: "Profile", href: "/profile", requiresAuth: true },
];

// Admin menu items (only visible to admins)
const adminMenuItems = [
  { icon: Shield, label: "Admin Portal", href: "/admin", requiresAuth: true, adminOnly: true },
  { icon: Activity, label: "Live Trades", href: "/admin/trades", requiresAuth: true, adminOnly: true },
  { icon: Users, label: "Client Management", href: "/admin/clients", requiresAuth: true, adminOnly: true },
  { icon: Shield, label: "Admin Requests", href: "/admin/requests", requiresAuth: true, adminOnly: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen: controlledIsOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, signOut, loading: authLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isMobileOpen;
  const setIsOpen = onClose ? onClose : setIsMobileOpen;

  useEffect(() => {
    const checkAdmin = async () => {
      if (session) {
        try {
          const response = await fetch("/api/admin/check", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        } catch (error) {
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, [session]);

  const menuItems = [
    ...publicMenuItems,
    ...(user ? protectedMenuItems : []),
    ...(user && isAdmin ? adminMenuItems : []),
  ];

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-dark-bg/95 backdrop-blur-2xl border-r border-white/5 relative overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">

      {/* Decorative Green/Blue Gradient Top */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />

      <div className="flex flex-col p-4 space-y-1 relative z-10 mt-4">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Main Menu</h2>

        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const uniqueKey = `${item.href}-${item.label}-${index}`;

          return (
            <motion.div
              key={uniqueKey}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                href={item.requiresAuth && !user ? "/signin" : item.href}
                onClick={(e) => {
                  if (window.innerWidth < 1024) setIsOpen(false);
                  if (item.requiresAuth && !user && !authLoading) {
                    e.preventDefault();
                    router.push(`/signin?redirect=${item.href}`);
                  }
                }}
                className={`group flex items-center gap-3 rounded-r-full mr-2 px-4 py-3 transition-all duration-200 relative overflow-hidden ${isActive
                  ? "bg-active-gradient text-green-400 border-l-2 border-green-500" // Green Highlight
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                  }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-green-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-gray-500 group-hover:text-white'}`} />
                <span className="font-medium tracking-wide text-sm">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Profile Section */}
      <div className="mt-auto p-4 border-t border-white/5 space-y-2 bg-black/40">
        {user ? (
          <>
            <div className="glass p-3 rounded-lg mb-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{user.email?.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.email}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-[10px] text-gray-400">Online</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/signin"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90 text-white font-medium text-sm transition-all shadow-lg"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-30 pt-16 border-r border-white/5 bg-dark-bg">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 z-[100]"
            >
              <div className="h-full relative shadow-2xl">
                <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 z-[110] p-2 text-gray-400 hover:text-white bg-black/20 rounded-full"><X className="h-5 w-5" /></button>
                {sidebarContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Hexagon, Bell, User, LogOut, Menu, X, Search } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar, { MobileMenuButton } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import UserSearch from "./UserSearch";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, session } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notification count
  useEffect(() => {
    if (!session || !user) {
      setUnreadCount(0);
      return;
    }

    const fetchNotificationCount = async () => {
      try {
        const token = session.access_token;
        const response = await fetch("/api/notifications?limit=1", {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000);
    return () => clearInterval(interval);
  }, [session, user]);

  const handleSignOut = async () => {
    await signOut();
    setIsNotificationOpen(false);
  };

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleSidebarOpen = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 z-40 w-full h-16 border-b border-white/5 bg-dark-bg/80 backdrop-blur-xl"
      >
        <div className="flex h-full items-center justify-between px-4 lg:px-8">

          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-4">
            <MobileMenuButton onClick={handleSidebarOpen} />

            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center p-1.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-md group-hover:bg-white/10 transition-colors">
                <Hexagon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-medium tracking-wide text-white">
                9Aus
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          {user && (
            <div className="hidden md:block flex-1 max-w-xl mx-8 relative">
              <UserSearch />
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>

                {/* Profile Link (Mobile only mostly, or quick link) */}
                <Link
                  href="/profile"
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all md:hidden"
                >
                  <User className="h-5 w-5" />
                </Link>

                {/* Desktop User Widget */}
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/5">
                  <div className="text-right hidden lg:block">
                    <div className="text-sm font-medium text-white">{user.user_metadata?.name || "Trader"}</div>
                    <div className="text-xs text-emerald-400">Pro Plan</div>
                  </div>
                  <Link href="/profile" className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 p-[2px] cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                    <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center">
                      <span className="font-bold text-white text-sm">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/signin"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signin"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
    </>
  );
}

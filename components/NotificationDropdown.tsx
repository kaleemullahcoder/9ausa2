"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ArrowUpRight, ArrowDownRight, DollarSign, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "credit_received" | "credit_sent" | "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  amount?: number;
  from_user?: { id: string; name: string; email: string; unique_user_id?: string };
  to_user?: { id: string; name: string; email: string; unique_user_id?: string };
  isReceived?: boolean;
  created_at: string;
  read: boolean;
  source?: "transfer" | "admin";
  from_admin?: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications function
  // Robust fetch with retry logic
  const fetchNotifications = useCallback(async (retryCount = 0, silent = false) => {
    if (!session) return;

    if (!silent && retryCount === 0) setLoading(true);
    try {
      const token = session.access_token;
      // Force cache busting with timestamp
      const response = await fetch(`/api/notifications?limit=100&_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(data.unreadCount || 0);
        if (!silent) console.log(`✅ Fetched ${notifs.length} notifications`);
      } else {
        const errorData = await response.json();
        console.error("❌ Error fetching notifications:", errorData);
        // Retry logic on server error - ONLY if not silent (background polls shouldn't hammer server on error)
        if (!silent && retryCount < 3) {
          console.log(`Retrying fetch (${retryCount + 1}/3)...`);
          setTimeout(() => fetchNotifications(retryCount + 1, false), 1000 * (retryCount + 1));
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      if (!silent && retryCount < 3) {
        setTimeout(() => fetchNotifications(retryCount + 1, false), 1000 * (retryCount + 1));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [session]);

  // Expose for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugNotifications = {
        fetch: () => fetchNotifications(0),
        list: notifications,
        session: session
      };
    }
  }, [fetchNotifications, notifications, session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      fetchNotifications();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, session, fetchNotifications, onClose]);



  // Pure polling implementation (Alternative to Websockets for stability)
  useEffect(() => {
    if (!session?.user?.id) return;

    // Initial fetch
    fetchNotifications();

    // Poll every 1 second (Near-Realtime)
    const pollInterval = setInterval(() => {
      // Pass silent=true if you want to avoid loading spinners
      fetchNotifications(0, true);
    }, 1000);

    // Global event listeners for other components to trigger updates
    const handleGlobalUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('balanceUpdated', handleGlobalUpdate);
    window.addEventListener('notificationsUpdated', handleGlobalUpdate);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('balanceUpdated', handleGlobalUpdate);
      window.removeEventListener('notificationsUpdated', handleGlobalUpdate);
    };
  }, [session, fetchNotifications]);

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === "credit_received" || (notification.isReceived && notification.amount)) {
      return <ArrowDownRight className="h-5 w-5 text-green-400" />;
    }
    if (notification.type === "credit_sent" || (notification.amount && !notification.isReceived)) {
      return <ArrowUpRight className="h-5 w-5 text-blue-primary" />;
    }
    if (notification.type === "success") {
      return <Check className="h-5 w-5 text-green-400" />;
    }
    if (notification.type === "warning") {
      return <Bell className="h-5 w-5 text-yellow-400" />;
    }
    if (notification.type === "error") {
      return <X className="h-5 w-5 text-red-400" />;
    }
    return <Bell className="h-5 w-5 text-blue-primary" />;
  };

  const getNotificationColor = (notification: Notification) => {
    if (notification.type === "credit_received" || (notification.isReceived && notification.amount)) {
      return "bg-green-500/10 border-green-500/20";
    }
    if (notification.type === "success") {
      return "bg-green-500/10 border-green-500/20";
    }
    if (notification.type === "warning") {
      return "bg-yellow-500/10 border-yellow-500/20";
    }
    if (notification.type === "error") {
      return "bg-red-500/10 border-red-500/20";
    }
    return "bg-blue-500/10 border-blue-500/20";
  };

  const handleDismissNotification = async (notificationId: string) => {
    if (!session || dismissingId) return;

    setDismissingId(notificationId);

    try {
      const token = session.access_token;
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Notification dismissed:", notificationId, result);
        // Remove notification from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        const errorData = await response.json();
        console.log("⚠️ API failed but dismissing from UI:", errorData);
        // Even if API fails, remove from UI (for transfer notifications)
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
      // Remove from UI anyway
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Dropdown */}
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-dark-border bg-dark-card shadow-xl z-50 max-h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-primary" />
                <h3 className="text-lg font-bold text-white">Notifications (Live)</h3>
              </div>
              <button
                onClick={onClose}
                className="text-blue-accent/70 hover:text-blue-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="h-8 w-8 border-4 border-blue-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-blue-accent/70">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-blue-accent/30 mx-auto mb-4" />
                  <p className="text-blue-accent/70">No notifications yet</p>
                  <p className="text-blue-accent/50 text-sm mt-2">
                    You&apos;ll see notifications for trades, balance changes, and more here
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="divide-y divide-dark-border">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`p-4 hover:bg-dark-hover transition-colors ${getNotificationColor(notification)} relative group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-white">
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-blue-primary flex-shrink-0 mt-1"></div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismissNotification(notification.id);
                                  }}
                                  disabled={dismissingId === notification.id}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-accent/70 hover:text-red-400 p-1 rounded hover:bg-red-500/10 disabled:opacity-50"
                                  title="Dismiss notification"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {notification.message && (
                              <p className="text-xs text-blue-accent/70 mb-2">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {notification.amount ? (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3 text-green-400" />
                                  <span className="text-sm font-bold text-green-400">
                                    {formatCurrency(notification.amount)}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {notification.from_admin && (
                                    <span className="text-xs text-purple-400 font-medium">
                                      From Admin
                                    </span>
                                  )}
                                </div>
                              )}
                              <span className="text-xs text-blue-accent/50">
                                {(() => {
                                  try {
                                    let dateStr = notification.created_at;
                                    if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
                                      dateStr += 'Z';
                                    }
                                    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
                                  } catch (e) {
                                    return 'Just now';
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-dark-border">
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    // Refresh notifications
                    fetchNotifications();
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-dark-hover hover:bg-dark-border text-blue-accent hover:text-blue-primary transition-colors text-sm font-medium mb-1"
                >
                  Refresh & View All
                </button>
              )}
              <div className="text-[10px] text-center text-gray-600">
                Last updated: {new Date().toLocaleTimeString()} • {notifications.length} items
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


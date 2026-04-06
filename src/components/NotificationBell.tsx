import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAdminNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/useAdminNotifications";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useAdminNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-silver hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-display font-semibold text-sm">Notifications</h3>
                {unread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => markAllRead.mutate()}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) markRead.mutate(n.id);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                        !n.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-display text-sm font-semibold truncate">{n.title}</p>
                            {n.type === "vibetor_request" && (
                              <Badge className="bg-vibetor/90 hover:bg-vibetor text-[9px] px-1 py-0 shrink-0">
                                VIBETOR
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-body mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          {n.sender_email && (
                            <p className="text-[11px] text-muted-foreground/70 font-body mt-1">
                              {n.sender_name} · {n.sender_email}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/50 font-body mt-1">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground font-body">
                    No notifications yet
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;

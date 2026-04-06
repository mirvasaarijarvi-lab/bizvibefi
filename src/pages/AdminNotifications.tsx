import { useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import {
  useAdminNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  type AdminNotification,
} from "@/hooks/useAdminNotifications";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Bell,
  CheckCheck,
  Check,
  ArrowLeft,
  Mail,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TypeFilter = "all" | "contact" | "vibetor_request" | "general";
type ReadFilter = "all" | "unread" | "read";

const AdminNotifications = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: notifications, isLoading } = useAdminNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const filtered = useMemo(() => {
    if (!notifications) return [];
    return notifications.filter((n) => {
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (readFilter === "unread" && n.is_read) return false;
      if (readFilter === "read" && !n.is_read) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.sender_name?.toLowerCase().includes(q) ||
          n.sender_email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notifications, typeFilter, readFilter, search]);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const typeBadge = (type: string) => {
    switch (type) {
      case "vibetor_request":
        return (
          <Badge className="bg-vibetor/90 hover:bg-vibetor text-primary-foreground text-[10px] px-1.5 py-0">
            VIBETOR
          </Badge>
        );
      case "contact":
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            CONTACT
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            GENERAL
          </Badge>
        );
    }
  };

  return (
    <Layout>
      <PageMeta
        title="Notifications — Admin — BizVibe"
        description="Admin notification history and management."
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-end mb-4">
            <Link
              to="/admin/audit-log"
              className="text-sm text-primary hover:underline font-body"
            >
              Audit Log →
            </Link>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Notifications
                </h1>
                <p className="text-sm text-muted-foreground font-body">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                    : "All caught up"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="font-body gap-1"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 font-body"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="vibetor_request">Vibetor Request</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={readFilter}
              onValueChange={(v) => setReadFilter(v as ReadFilter)}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification list */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">
                {search || typeFilter !== "all" || readFilter !== "all"
                  ? "No notifications match your filters."
                  : "No notifications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className={`bg-card border rounded-xl p-5 transition-colors ${
                    !n.is_read
                      ? "border-primary/30 bg-primary/[0.03]"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.is_read && (
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={
                            n.type === "vibetor_request" ? "/admin/users" :
                            n.type === "showcase_submission" ? "/admin/showcase" :
                            "#"
                          }
                          className={`font-display font-semibold text-foreground ${
                            n.type === "vibetor_request" || n.type === "showcase_submission" ? "hover:underline hover:text-primary" : ""
                          }`}
                        >
                          {n.title}
                        </Link>
                        {typeBadge(n.type)}
                      </div>
                      <p className="text-sm text-muted-foreground font-body mt-1">
                        {n.message}
                      </p>
                      {(n.sender_name || n.sender_email) && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/70 font-body">
                          <Mail className="h-3 w-3 shrink-0" />
                          {n.sender_name && <span>{n.sender_name}</span>}
                          {n.sender_name && n.sender_email && <span>·</span>}
                          {n.sender_email && (
                            <a
                              href={`mailto:${n.sender_email}`}
                              className="hover:text-foreground underline"
                            >
                              {n.sender_email}
                            </a>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground/60 font-body">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {!n.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 font-body gap-1"
                            onClick={() => markRead.mutate(n.id)}
                            disabled={markRead.isPending}
                          >
                            <Check className="h-3.5 w-3.5" /> Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminNotifications;

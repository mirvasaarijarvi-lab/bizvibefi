import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";

type AllowedUser = {
  user_id: string | null;
  display_name: string | null;
  email: string | null;
  source: "admin" | "creator" | "rsvp" | "signup";
};

type AuditRow = {
  presentation_id: string;
  event_id: string;
  event_title: string;
  event_starts_at: string;
  presentation_title: string;
  file_size: number | null;
  allowed_users: AllowedUser[] | null;
  allowed_user_count: number;
  denied_last_30d: number;
  last_denial_at: string | null;
  last_denial_reason: string | null;
};

type DenialRow = {
  id: string;
  presentation_id: string | null;
  event_id: string | null;
  user_id: string | null;
  user_email: string | null;
  reason: string | null;
  http_status: number | null;
  created_at: string;
};

const sourceVariant = (s: AllowedUser["source"]) => {
  switch (s) {
    case "admin":
      return "default";
    case "creator":
      return "secondary";
    case "rsvp":
      return "outline";
    case "signup":
      return "outline";
  }
};

const UNEXPECTED_DENIAL_REASONS = new Set([
  "event_lookup_failed",
  "signed_url_failed",
  "presentation_not_found",
  "event_not_found",
]);

const AdminPresentationAccess = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const audit = useQuery({
    queryKey: ["admin-presentation-access-audit"],
    enabled: !!user && !!isAdmin,
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase.rpc(
        "get_presentation_access_audit" as never,
      );
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const recentDenials = useQuery({
    queryKey: ["admin-presentation-recent-denials"],
    enabled: !!user && !!isAdmin,
    queryFn: async (): Promise<DenialRow[]> => {
      const { data, error } = await supabase
        .from("presentation_access_log")
        .select("*")
        .eq("allowed", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as DenialRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = audit.data ?? [];
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.event_title?.toLowerCase().includes(q) ||
        r.presentation_title?.toLowerCase().includes(q),
    );
  }, [audit.data, search]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const flaggedDenials = (recentDenials.data ?? []).filter((d) =>
    UNEXPECTED_DENIAL_REASONS.has(d.reason ?? ""),
  );

  return (
    <Layout>
      <PageMeta
        title="Presentation Access Audit"
        description="Audit which users can access each event presentation and review denied attempts."
      />
      <div className="container max-w-6xl py-10">
        <Breadcrumbs />
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Presentation Access Audit
          </h1>
          <p className="text-muted-foreground">
            Who can access each event presentation, plus any unexpected access denials.
          </p>
        </div>

        {flaggedDenials.length > 0 && (
          <Card className="p-4 mb-6 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-display font-semibold text-destructive mb-1">
                  {flaggedDenials.length} unexpected denial
                  {flaggedDenials.length === 1 ? "" : "s"} flagged
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  These reasons usually indicate a misconfiguration rather than a
                  legitimate access denial. Investigate the rows below.
                </p>
                <ul className="text-sm space-y-1">
                  {flaggedDenials.slice(0, 5).map((d) => (
                    <li key={d.id} className="font-body">
                      <code className="text-xs">{d.reason}</code>
                      {" — "}
                      {d.user_email ?? d.user_id ?? "unknown user"}
                      {" — "}
                      {format(new Date(d.created_at), "PPp")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <Input
          placeholder="Filter by event or presentation title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 max-w-md"
        />

        {audit.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading audit...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No presentations found.
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => {
              const open = openId === row.presentation_id;
              const hasDenials = row.denied_last_30d > 0;
              const users = row.allowed_users ?? [];
              return (
                <Card key={row.presentation_id} className="overflow-hidden">
                  <Collapsible
                    open={open}
                    onOpenChange={(o) =>
                      setOpenId(o ? row.presentation_id : null)
                    }
                  >
                    <CollapsibleTrigger className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/40 transition-colors">
                      {open ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold truncate">
                          {row.presentation_title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {row.event_title}
                          {" • "}
                          {format(new Date(row.event_starts_at), "PP")}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-body shrink-0">
                        <Users className="h-3 w-3 mr-1" />
                        {row.allowed_user_count}
                      </Badge>
                      {hasDenials && (
                        <Badge
                          variant="destructive"
                          className="font-body shrink-0"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {row.denied_last_30d} denied (30d)
                        </Badge>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border p-4 space-y-3">
                        {row.last_denial_at && (
                          <p className="text-xs text-muted-foreground">
                            Last denial:{" "}
                            {format(new Date(row.last_denial_at), "PPp")} —{" "}
                            <code className="text-xs">
                              {row.last_denial_reason}
                            </code>
                          </p>
                        )}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Access via</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground"
                                  >
                                    No users have access yet.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                users.map((u, idx) => (
                                  <TableRow
                                    key={`${row.presentation_id}-${u.user_id ?? u.email ?? idx}`}
                                  >
                                    <TableCell className="font-body">
                                      {u.display_name ?? "—"}
                                    </TableCell>
                                    <TableCell className="font-body text-muted-foreground">
                                      {u.email ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={sourceVariant(u.source)}
                                        className="font-body capitalize"
                                      >
                                        {u.source}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPresentationAccess;

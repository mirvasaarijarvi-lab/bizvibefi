import { useState } from "react";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, History, ArrowUpDown, Zap } from "lucide-react";
import { format } from "date-fns";

type ActionFilter = "all" | "tier_change" | "viber_access_override";

const actionLabels: Record<string, { label: string; icon: React.ElementType }> = {
  tier_change: { label: "Tier Change", icon: ArrowUpDown },
  viber_access_override: { label: "Viber Access Override", icon: Zap },
};

const AuditLog = () => {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      // Fetch display names for all user IDs
      const userIds = new Set<string>();
      (data as any[]).forEach((log: any) => {
        if (log.performed_by) userIds.add(log.performed_by);
        if (log.target_user_id) userIds.add(log.target_user_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", Array.from(userIds));

      const nameMap = new Map(
        profiles?.map((p) => [p.user_id, p.display_name ?? "Unknown"]) ?? []
      );

      return (data as any[]).map((log: any) => ({
        ...log,
        performed_by_name: nameMap.get(log.performed_by) ?? "System",
        target_name: nameMap.get(log.target_user_id) ?? "Unknown",
      }));
    },
    enabled: !!user && isAdmin,
  });

  if (authLoading) {
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

  const filtered = logs?.filter((log: any) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.performed_by_name?.toLowerCase().includes(q) ||
      log.target_name?.toLowerCase().includes(q) ||
      log.old_value?.toLowerCase().includes(q) ||
      log.new_value?.toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <PageMeta
        title="Audit Log — BizVibe Admin"
        description="Review history of tier changes and access overrides."
      />
      <section className="py-24 md:py-32">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-3">
              Admin
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-[-0.03em]">
              Audit <span className="text-gradient-storm">Log</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body">
              History of tier changes and access overrides.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or value..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionFilter)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="tier_change">Tier Changes</SelectItem>
                <SelectItem value="viber_access_override">Access Overrides</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body">Action</TableHead>
                    <TableHead className="font-body">Target</TableHead>
                    <TableHead className="font-body">Change</TableHead>
                    <TableHead className="font-body">By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log: any) => {
                    const config = actionLabels[log.action];
                    const Icon = config?.icon ?? History;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-body text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-body text-xs gap-1">
                            <Icon className="h-3 w-3" />
                            {config?.label ?? log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-sm font-medium">
                          {log.target_name}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          <span className="text-muted-foreground">{log.old_value}</span>
                          <span className="mx-1.5 text-muted-foreground">→</span>
                          <span className="font-medium">{log.new_value}</span>
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {log.performed_by_name}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-body">
                {search || actionFilter !== "all" ? "No entries match your filters." : "No audit log entries yet."}
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AuditLog;

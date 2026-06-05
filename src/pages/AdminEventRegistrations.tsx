import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronDown, Search, Users, Mail, Phone, Building2, Download } from "lucide-react";
import { format } from "date-fns";

const csvEscape = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCsv = (filename: string, rows: (string | null | undefined)[][]) => {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event";

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
};

type Rsvp = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  event_id: string;
};

type Signup = {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string;
  created_at: string;
};

type ProfileLite = {
  user_id: string;
  display_name: string | null;
  contact_email: string | null;
  company: string | null;
};

const AdminEventRegistrations = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [search, setSearch] = useState("");

  const { data: events } = useQuery({
    queryKey: ["admin-events-list"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,starts_at,ends_at")
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const { data: rsvps } = useQuery({
    queryKey: ["admin-event-rsvps"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("id,user_id,status,created_at,event_id");
      if (error) throw error;
      return (data ?? []) as Rsvp[];
    },
  });

  const { data: signups } = useQuery({
    queryKey: ["admin-event-signups"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_signups")
        .select("id,event_id,full_name,email,phone,company,created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Signup[];
    },
  });

  const userIds = useMemo(
    () => Array.from(new Set((rsvps ?? []).map((r) => r.user_id))),
    [rsvps],
  );

  const { data: profiles } = useQuery({
    queryKey: ["admin-event-rsvp-profiles", userIds],
    enabled: isAdmin && userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,display_name,contact_email,company")
        .in("user_id", userIds);
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
  });

  const profileById = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    (profiles ?? []).forEach((p) => m.set(p.user_id, p));
    return m;
  }, [profiles]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.title.toLowerCase().includes(q));
  }, [events, search]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <Layout>
      <PageMeta
        title="Event Registrations — Admin — <Good Vibes Café/>"
        description="People registered to each event."
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <CalendarDays className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Event Registrations
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                Members and guests signed up to each event.
              </p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 font-body"
            />
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">No events found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const eventRsvps = (rsvps ?? []).filter(
                  (r) => r.event_id === event.id && r.status === "going",
                );
                const eventSignups = (signups ?? []).filter(
                  (s) => s.event_id === event.id,
                );
                const total = eventRsvps.length + eventSignups.length;

                return (
                  <Collapsible key={event.id}>
                    <div className="bg-card border border-border rounded-xl">
                      <CollapsibleTrigger className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-muted/40 transition-colors rounded-xl group">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display font-semibold text-foreground truncate">
                            {event.title}
                          </h2>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">
                            {format(new Date(event.starts_at), "PPP p")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="gap-1 font-body">
                            <Users className="h-3 w-3" /> {total}
                          </Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-5 pb-5 pt-1 border-t border-border">
                        {total === 0 ? (
                          <p className="text-sm text-muted-foreground font-body py-4">
                            No registrations yet.
                          </p>
                        ) : (
                          <div className="space-y-4 pt-3">
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const header = ["Type", "Name", "Email", "Phone", "Company", "Registered At"];
                                  const rows: (string | null | undefined)[][] = [header];
                                  eventRsvps.forEach((r) => {
                                    const p = profileById.get(r.user_id);
                                    rows.push([
                                      "Member",
                                      p?.display_name ?? "",
                                      p?.contact_email ?? "",
                                      "",
                                      p?.company ?? "",
                                      format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
                                    ]);
                                  });
                                  eventSignups.forEach((s) => {
                                    rows.push([
                                      "Guest",
                                      s.full_name,
                                      s.email,
                                      s.phone ?? "",
                                      s.company,
                                      format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
                                    ]);
                                  });
                                  downloadCsv(
                                    `registrations-${slugify(event.title)}-${format(new Date(event.starts_at), "yyyy-MM-dd")}.csv`,
                                    rows,
                                  );
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" /> Export CSV
                              </Button>
                            </div>
                            {eventRsvps.length > 0 && (
                              <div>
                                <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                  Members ({eventRsvps.length})
                                </h3>
                                <ul className="space-y-2">
                                  {eventRsvps.map((r) => {
                                    const p = profileById.get(r.user_id);
                                    return (
                                      <li
                                        key={r.id}
                                        className="text-sm font-body flex flex-wrap items-center gap-x-3 gap-y-1 p-2 rounded-md bg-muted/40"
                                      >
                                        <span className="font-medium text-foreground">
                                          {p?.display_name ?? "Member"}
                                        </span>
                                        {p?.company && (
                                          <span className="text-muted-foreground inline-flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {p.company}
                                          </span>
                                        )}
                                        {p?.contact_email && (
                                          <a
                                            href={`mailto:${p.contact_email}`}
                                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                          >
                                            <Mail className="h-3 w-3" />
                                            {p.contact_email}
                                          </a>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                            {eventSignups.length > 0 && (
                              <div>
                                <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                  Guests ({eventSignups.length})
                                </h3>
                                <ul className="space-y-2">
                                  {eventSignups.map((s) => (
                                    <li
                                      key={s.id}
                                      className="text-sm font-body flex flex-wrap items-center gap-x-3 gap-y-1 p-2 rounded-md bg-muted/40"
                                    >
                                      <span className="font-medium text-foreground">
                                        {s.full_name}
                                      </span>
                                      <span className="text-muted-foreground inline-flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {s.company}
                                      </span>
                                      <a
                                        href={`mailto:${s.email}`}
                                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                      >
                                        <Mail className="h-3 w-3" />
                                        {s.email}
                                      </a>
                                      {s.phone && (
                                        <a
                                          href={`tel:${s.phone}`}
                                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                        >
                                          <Phone className="h-3 w-3" />
                                          {s.phone}
                                        </a>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminEventRegistrations;

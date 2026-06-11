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
import {
  MessageSquare,
  ChevronDown,
  Search,
  Star,
  Download,
  Mail,
} from "lucide-react";
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
};

type ProgramRating = { label: string; rating: number };

type Feedback = {
  id: string;
  event_id: string;
  email: string | null;
  name: string | null;
  overall_rating: number | null;
  program_ratings: ProgramRating[] | null;
  comments: string | null;
  responses: Record<string, string | null> | null;
  created_at: string;
};

const Stars = ({ value }: { value: number | null }) => {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < value ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
};

const RESPONSE_LABELS: Record<string, string> = {
  attend_again: "Would attend again",
  want_to_present: "Wants to present",
  bring_demo_to_end_customer_event: "Would bring demo to end-customer event",
};

const AdminEventFeedback = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [search, setSearch] = useState("");

  const { data: events } = useQuery({
    queryKey: ["admin-feedback-events"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,starts_at")
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const { data: feedback } = useQuery({
    queryKey: ["admin-event-feedback"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_feedback")
        .select("id,event_id,email,name,overall_rating,program_ratings,comments,responses,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Feedback[];
    },
  });

  const byEvent = useMemo(() => {
    const m = new Map<string, Feedback[]>();
    (feedback ?? []).forEach((f) => {
      const arr = m.get(f.event_id) ?? [];
      arr.push(f);
      m.set(f.event_id, arr);
    });
    return m;
  }, [feedback]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const q = search.trim().toLowerCase();
    const list = q ? events.filter((e) => e.title.toLowerCase().includes(q)) : events;
    return list.filter((e) => (byEvent.get(e.id)?.length ?? 0) > 0);
  }, [events, search, byEvent]);

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
        title="Event Feedback — Admin — <Good Vibes Café/>"
        description="Feedback responses for each event."
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Event Feedback
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                Ratings, comments, and survey responses submitted after each event.
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
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">No feedback yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const items = byEvent.get(event.id) ?? [];
                const avg =
                  items.length === 0
                    ? 0
                    : items.reduce((s, f) => s + (f.overall_rating ?? 0), 0) /
                      items.filter((f) => f.overall_rating).length || 0;

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
                          {avg > 0 && (
                            <span className="text-xs font-body text-muted-foreground">
                              avg {avg.toFixed(1)}
                            </span>
                          )}
                          <Badge variant="secondary" className="gap-1 font-body">
                            <MessageSquare className="h-3 w-3" /> {items.length}
                          </Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-5 pb-5 pt-1 border-t border-border">
                        <div className="flex justify-end pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const header = [
                                "Submitted",
                                "Name",
                                "Email",
                                "Overall",
                                "Program Ratings",
                                "Attend again",
                                "Wants to present",
                                "Bring demo",
                                "Comments",
                              ];
                              const rows: (string | null | undefined)[][] = [header];
                              items.forEach((f) => {
                                const progs = (f.program_ratings ?? [])
                                  .map((p) => `${p.label}: ${p.rating}`)
                                  .join(" | ");
                                const r = f.responses ?? {};
                                rows.push([
                                  format(new Date(f.created_at), "yyyy-MM-dd HH:mm"),
                                  f.name ?? "",
                                  f.email ?? "",
                                  f.overall_rating != null ? String(f.overall_rating) : "",
                                  progs,
                                  r.attend_again ?? "",
                                  r.want_to_present ?? "",
                                  r.bring_demo_to_end_customer_event ?? "",
                                  f.comments ?? "",
                                ]);
                              });
                              downloadCsv(
                                `feedback-${slugify(event.title)}-${format(new Date(event.starts_at), "yyyy-MM-dd")}.csv`,
                                rows,
                              );
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" /> Export CSV
                          </Button>
                        </div>

                        <ul className="space-y-3 mt-3">
                          {items.map((f) => (
                            <li
                              key={f.id}
                              className="rounded-md border border-border bg-muted/30 p-4 space-y-2"
                            >
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-medium text-foreground font-body text-sm">
                                  {f.name || "Anonymous"}
                                </span>
                                {f.email && (
                                  <a
                                    href={`mailto:${f.email}`}
                                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-body"
                                  >
                                    <Mail className="h-3 w-3" />
                                    {f.email}
                                  </a>
                                )}
                                <span className="text-xs text-muted-foreground font-body ml-auto">
                                  {format(new Date(f.created_at), "PPP p")}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-body">
                                <span className="text-muted-foreground">Overall:</span>
                                <Stars value={f.overall_rating} />
                              </div>

                              {f.program_ratings && f.program_ratings.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                                    Program ratings
                                  </p>
                                  <ul className="space-y-1">
                                    {f.program_ratings.map((p, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-center justify-between gap-3 text-sm font-body"
                                      >
                                        <span className="text-foreground truncate">{p.label}</span>
                                        <Stars value={p.rating} />
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {f.responses && Object.keys(f.responses).some((k) => f.responses?.[k]) && (
                                <div className="space-y-1">
                                  <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                                    Follow-up
                                  </p>
                                  <ul className="space-y-0.5 text-sm font-body">
                                    {Object.entries(f.responses).map(([k, v]) =>
                                      v ? (
                                        <li key={k} className="flex gap-2">
                                          <span className="text-muted-foreground">
                                            {RESPONSE_LABELS[k] ?? k}:
                                          </span>
                                          <span className="text-foreground capitalize">{v}</span>
                                        </li>
                                      ) : null,
                                    )}
                                  </ul>
                                </div>
                              )}

                              {f.comments && (
                                <div className="space-y-1">
                                  <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                                    Comments
                                  </p>
                                  <p className="text-sm font-body text-foreground whitespace-pre-wrap">
                                    {f.comments}
                                  </p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
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

export default AdminEventFeedback;

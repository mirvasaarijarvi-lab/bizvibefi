import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronRight, Mail, CalendarClock } from "lucide-react";

type LogRow = {
  id: string;
  message_id: string;
  template_name: string;
  recipient_email: string;
  status: string;
  created_at: string;
  metadata: {
    batch_id?: string;
    subject?: string;
    body_preview?: string;
    event_title?: string | null;
    sender_name?: string | null;
  } | null;
};

type Batch = {
  key: string;
  templateName: string;
  subject: string;
  preview: string;
  eventTitle: string | null;
  firstSentAt: string;
  recipients: { email: string; status: string }[];
  sentCount: number;
  failedCount: number;
};

const TEMPLATE_LABELS: Record<string, string> = {
  "admin-message": "Admin message",
  "event-confirmation": "Event confirmation",
  "event-reminder": "Event reminder",
  "event-feedback": "Event feedback request",
  signup: "Account signup",
};

const TEMPLATE_FILTERS = [
  "admin-message",
  "event-confirmation",
  "event-reminder",
  "event-feedback",
];

const SentMessagesList = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("email_send_log")
        .select("id,message_id,template_name,recipient_email,status,created_at,metadata")
        .in("template_name", TEMPLATE_FILTERS)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) {
        console.error("load send log failed", error);
        setRows([]);
      } else {
        setRows((data ?? []) as LogRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const batches = useMemo<Batch[]>(() => {
    // Group by metadata.batch_id; fallback to message_id
    const map = new Map<string, Batch>();
    for (const r of rows) {
      const batchId = r.metadata?.batch_id || r.message_id;
      // For event templates each send has its own batch (one recipient).
      // For admin-message, many rows share the batch_id.
      const key = `${r.template_name}::${batchId}`;
      let b = map.get(key);
      if (!b) {
        b = {
          key,
          templateName: r.template_name,
          subject:
            r.metadata?.subject ||
            r.metadata?.event_title ||
            TEMPLATE_LABELS[r.template_name] ||
            r.template_name,
          preview: r.metadata?.body_preview || "",
          eventTitle: r.metadata?.event_title ?? null,
          firstSentAt: r.created_at,
          recipients: [],
          sentCount: 0,
          failedCount: 0,
        };
        map.set(key, b);
      }
      // Keep earliest created_at as "sent at"
      if (new Date(r.created_at) < new Date(b.firstSentAt)) {
        b.firstSentAt = r.created_at;
      }
      // Deduplicate per recipient — prefer sent over pending
      const existing = b.recipients.find((x) => x.email === r.recipient_email);
      if (!existing) {
        b.recipients.push({ email: r.recipient_email, status: r.status });
      } else if (existing.status !== "sent" && r.status === "sent") {
        existing.status = "sent";
      }
    }
    // Tally counts
    for (const b of map.values()) {
      b.sentCount = b.recipients.filter((r) => r.status === "sent").length;
      b.failedCount = b.recipients.filter((r) =>
        ["failed", "suppressed"].includes(r.status)
      ).length;
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.firstSentAt).getTime() - new Date(a.firstSentAt).getTime()
    );
  }, [rows]);

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (batches.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        No sent messages yet.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Date</TableHead>
            <TableHead className="w-[150px]">Type</TableHead>
            <TableHead>Subject / Topic</TableHead>
            <TableHead>Highlights</TableHead>
            <TableHead className="w-[140px]">Recipients</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => {
            const isOpen = openKey === b.key;
            const isEvent = b.templateName.startsWith("event-");
            return (
              <Fragment key={b.key}>
                <TableRow className="align-top">
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(b.firstSentAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isEvent ? "secondary" : "default"} className="gap-1">
                      {isEvent ? (
                        <CalendarClock className="h-3 w-3" />
                      ) : (
                        <Mail className="h-3 w-3" />
                      )}
                      {TEMPLATE_LABELS[b.templateName] || b.templateName}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="line-clamp-1">{b.subject}</div>
                    {b.eventTitle && b.eventTitle !== b.subject && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Event: {b.eventTitle}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="line-clamp-2 max-w-md">
                      {b.preview || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setOpenKey(isOpen ? null : b.key)}
                      className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                    >
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                      <span>
                        {b.sentCount} sent
                        {b.failedCount > 0 && (
                          <span className="text-destructive">
                            , {b.failedCount} failed
                          </span>
                        )}
                      </span>
                    </button>
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow key={`${b.key}-detail`} className="bg-muted/30">
                    <TableCell colSpan={5} className="py-3">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Recipient list ({b.recipients.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {b.recipients.map((r) => (
                          <Badge
                            key={r.email}
                            variant={
                              r.status === "sent"
                                ? "outline"
                                : r.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className="font-normal"
                          >
                            {r.email}
                            {r.status !== "sent" && (
                              <span className="ml-1 opacity-70">· {r.status}</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
};

export default SentMessagesList;

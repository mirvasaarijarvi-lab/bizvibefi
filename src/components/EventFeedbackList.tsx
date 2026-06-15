import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

type FeedbackRow = {
  id: string;
  name: string | null;
  overall_rating: number;
  program_ratings: Array<{ label?: string; rating?: number }> | unknown;
  comments: string | null;
  created_at: string;
};

interface Props {
  eventId: string;
  lang: "en" | "fi" | "sv";
}

const L = {
  en: {
    heading: "Attendee feedback",
    none: "No feedback shared yet for this event.",
    anonymous: "Anonymous",
    avg: "Average overall rating",
    count: (n: number) => `${n} response${n === 1 ? "" : "s"}`,
  },
  fi: {
    heading: "Osallistujien palaute",
    none: "Tästä tapahtumasta ei ole vielä jaettua palautetta.",
    anonymous: "Anonyymi",
    avg: "Keskiarvo (kokonaisarvio)",
    count: (n: number) => `${n} vastaus${n === 1 ? "" : "ta"}`,
  },
  sv: {
    heading: "Deltagarnas feedback",
    none: "Ingen feedback delad för detta evenemang ännu.",
    anonymous: "Anonym",
    avg: "Genomsnittligt helhetsbetyg",
    count: (n: number) => `${n} svar`,
  },
};

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < value ? "fill-turquoise text-turquoise" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

export default function EventFeedbackList({ eventId, lang }: Props) {
  const t = L[lang] ?? L.en;

  const { data, isLoading } = useQuery({
    queryKey: ["event-feedback-public", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_feedback_public", {
        _event_id: eventId,
      });
      if (error) throw error;
      return (data ?? []) as FeedbackRow[];
    },
    // Re-poll so newly submitted feedback shows up without a reload.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  if (isLoading) return null;

  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-1 text-sm font-display font-semibold text-foreground">
          <MessageSquare className="h-4 w-4 text-turquoise" />
          {t.heading}
        </div>
        <p className="text-xs text-muted-foreground font-body">{t.none}</p>
      </div>
    );
  }

  const avg = rows.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / rows.length;

  return (
    <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-display font-semibold text-foreground">
          <MessageSquare className="h-4 w-4 text-turquoise" />
          {t.heading}
        </div>
        <div className="text-xs text-muted-foreground font-body flex items-center gap-2">
          <span>{t.count(rows.length)}</span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            <Stars value={Math.round(avg)} />
            <span>{avg.toFixed(1)}</span>
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {rows.map((r) => {
          const programs = Array.isArray(r.program_ratings)
            ? (r.program_ratings as Array<{ label?: string; rating?: number }>).filter(
                (p) => typeof p?.rating === "number",
              )
            : [];
          return (
            <li
              key={r.id}
              className="p-3 rounded-lg border border-border/60 bg-background"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-body font-medium text-foreground">
                  {r.name || t.anonymous}
                </span>
                <span className="text-xs text-muted-foreground font-body">
                  {format(new Date(r.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Stars value={r.overall_rating} />
                <span className="text-xs text-muted-foreground font-body">
                  {r.overall_rating}/5
                </span>
              </div>
              {programs.length > 0 && (
                <ul className="mt-1 mb-1 flex flex-wrap gap-x-3 gap-y-1">
                  {programs.map((p, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground font-body flex items-center gap-1"
                    >
                      <span className="truncate max-w-[14rem]">{p.label ?? `#${i + 1}`}</span>
                      <Stars value={Math.round(p.rating ?? 0)} />
                    </li>
                  ))}
                </ul>
              )}
              {r.comments && (
                <p className="text-sm text-foreground/90 font-body whitespace-pre-wrap mt-1">
                  {r.comments}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

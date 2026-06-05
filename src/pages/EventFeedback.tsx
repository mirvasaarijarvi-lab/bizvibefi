import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface EventRow {
  id: string;
  title: string;
  agenda: string | null;
  starts_at: string;
}

function parseAgenda(agenda: string | null): string[] {
  if (!agenda) return [];
  return agenda
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, 8);
}

function StarRow({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            onClick={() => onChange(n)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                n <= value
                  ? "fill-primary text-primary"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EventFeedback() {
  const { id: eventId } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const initialOverall = Number(params.get("r")) || 0;

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [overall, setOverall] = useState<number>(initialOverall);
  const [programRatings, setProgramRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");

  const programItems = useMemo(() => parseAgenda(event?.agenda ?? null), [event]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!eventId) return;
      const { data } = await supabase
        .from("events")
        .select("id,title,agenda,starts_at")
        .eq("id", eventId)
        .maybeSingle();
      if (!cancelled) {
        setEvent((data as EventRow) ?? null);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !token || !email) {
      toast({
        title: "Invalid link",
        description: "This feedback link is missing required information.",
        variant: "destructive",
      });
      return;
    }
    if (overall < 1 || overall > 5) {
      toast({
        title: "Overall rating required",
        description: "Please rate your overall experience.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const payload = {
      eventId,
      email,
      token,
      name: name || undefined,
      overallRating: overall,
      programRatings: Object.entries(programRatings)
        .filter(([, v]) => v >= 1 && v <= 5)
        .map(([label, rating]) => ({ label, rating })),
      comments: comments || undefined,
    };
    const { data, error } = await supabase.functions.invoke(
      "submit-event-feedback",
      { body: payload },
    );
    setSubmitting(false);
    if (error || !data?.success) {
      toast({
        title: "Couldn't save feedback",
        description: "Please try again later or contact us.",
        variant: "destructive",
      });
      return;
    }
    setDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/events")}>Browse events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Thanks for your feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We appreciate you taking the time to share. Stay in the loop with
              the latest news, discussions and vibecoding insights by joining
              &lt;Good Vibes Café/&gt;.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/membership")}>
                Join the community
              </Button>
              <Button variant="outline" onClick={() => navigate("/events")}>
                See upcoming events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Feedback: {event.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Your input helps us improve future sessions. It takes under a
              minute.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <section>
                <h2 className="text-base font-semibold mb-2">
                  Overall experience
                </h2>
                <StarRow
                  value={overall}
                  onChange={setOverall}
                  label="How would you rate the event overall?"
                />
              </section>

              {programItems.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold mb-2">
                    Program highlights
                  </h2>
                  <div className="divide-y divide-border">
                    {programItems.map((item) => (
                      <StarRow
                        key={item}
                        value={programRatings[item] ?? 0}
                        onChange={(n) =>
                          setProgramRatings((prev) => ({ ...prev, [item]: n }))
                        }
                        label={item}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Your name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Anonymous"
                />
              </section>

              <section className="space-y-2">
                <label className="text-sm font-medium" htmlFor="comments">
                  Anything else you'd like to share?
                </label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={5}
                  placeholder="What worked well? What could we improve?"
                />
              </section>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? "Sending..." : "Submit feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

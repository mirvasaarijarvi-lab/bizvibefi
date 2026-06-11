import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import robotPeek from "@/assets/robot-peek.png.asset.json";
import robotHeart from "@/assets/robot-heart.png.asset.json";
import robotWave from "@/assets/robot-wave.png.asset.json";

interface EventRow {
  id: string;
  title: string;
  agenda: string | null;
  starts_at: string;
}

type YesNoMaybe = "yes" | "no" | "maybe" | "";

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

function ChoiceRow({
  value,
  onChange,
  label,
  options,
}: {
  value: YesNoMaybe;
  onChange: (v: YesNoMaybe) => void;
  label: string;
  options: { value: YesNoMaybe; label: string }[];
}) {
  return (
    <div className="space-y-2 py-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const YNM_OPTIONS: { value: YesNoMaybe; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export default function EventFeedback() {
  const { id: eventId } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const emailParam = params.get("email") ?? "";
  const share = params.get("s") ?? "";
  const initialOverall = Number(params.get("r")) || 0;

  const [event, setEvent] = useState<EventRow | null>(null);
  const [mode, setMode] = useState<"personal" | "share">("personal");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [overall, setOverall] = useState<number>(initialOverall);
  const [programRatings, setProgramRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailParam);


  const [attendAgain, setAttendAgain] = useState<YesNoMaybe>("");
  const [wantPresent, setWantPresent] = useState<YesNoMaybe>("");
  const [bringDemo, setBringDemo] = useState<YesNoMaybe>("");


  const programItems = useMemo(() => parseAgenda(event?.agenda ?? null), [event]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!eventId || (!share && (!token || !emailParam))) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.functions.invoke(
        "verify-event-feedback-token",
        {
          body: share
            ? { eventId, share }
            : { eventId, email: emailParam, token },
        },
      );
      if (cancelled) return;
      if (data?.valid && data.event) {
        setEvent({
          id: data.event.id,
          title: data.event.title,
          agenda: data.event.agenda ?? null,
          starts_at: "",
        });
        setMode(data.mode === "share" ? "share" : "personal");
      }
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [eventId, token, emailParam, share]);


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
      responses: {
        attend_again: attendAgain || null,
        want_to_present: wantPresent || null,
        bring_demo_to_end_customer_event: bringDemo || null,
      },
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
            <CardTitle>Feedback link not available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This feedback form is only accessible through the personal link
              sent by email to event attendees. If you attended and didn't
              receive the email, please contact us.
            </p>
            <Button onClick={() => navigate("/events")}>Browse events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full overflow-hidden">
          <CardHeader className="text-center">
            <img
              src={robotHeart.url}
              alt=""
              className="mx-auto h-32 w-32 object-contain"
            />
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
        <Card className="relative overflow-hidden">
          <img
            src={robotPeek.url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 right-0 h-32 w-32 object-contain opacity-95 sm:h-40 sm:w-40"
          />
          <CardHeader className="pr-32 sm:pr-40">
            <CardTitle className="text-2xl">Feedback: {event.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Your input helps us shape future sessions. It takes under a minute.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <section className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  1. Your name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional, leave blank to stay anonymous"
                />
              </section>

              <section>
                <h2 className="text-base font-semibold mb-2">
                  2. How would you rate the event overall?
                </h2>
                <StarRow
                  value={overall}
                  onChange={setOverall}
                  label="Overall experience"
                />
              </section>

              {programItems.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold mb-2">
                    3. How would you rate the presentations?
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

              <section>
                <ChoiceRow
                  label="4. Would you attend another event like this?"
                  value={attendAgain}
                  onChange={setAttendAgain}
                  options={YNM_OPTIONS}
                />
              </section>

              <section>
                <ChoiceRow
                  label="5. Would you like to present your own solutions?"
                  value={wantPresent}
                  onChange={setWantPresent}
                  options={YNM_OPTIONS}
                />
              </section>

              <section className="relative">
                <ChoiceRow
                  label="6. If we build an end-customer event, could you bring your solutions as a demo to the event?"
                  value={bringDemo}
                  onChange={setBringDemo}
                  options={YNM_OPTIONS}
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

              <div className="flex items-end gap-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? "Sending..." : "Submit feedback"}
                </Button>
                <img
                  src={robotWave.url}
                  alt=""
                  aria-hidden="true"
                  className="hidden sm:block h-20 w-20 object-contain"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

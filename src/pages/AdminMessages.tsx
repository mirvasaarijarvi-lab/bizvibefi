import { useState } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SentMessagesList from "@/components/SentMessagesList";

const emailListSchema = z
  .string()
  .trim()
  .transform((v) =>
    v
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  );

const formSchema = z.object({
  to: emailListSchema.pipe(
    z.array(z.string().email("Invalid email in To")).min(1, "At least one recipient required").max(100)
  ),
  cc: emailListSchema.pipe(z.array(z.string().email("Invalid email in Cc")).max(100)),
  bcc: emailListSchema.pipe(z.array(z.string().email("Invalid email in Bcc")).max(100)),
  subject: z.string().trim().min(1, "Subject required").max(200),
  body: z.string().trim().min(1, "Message required").max(10000),
});

const AdminMessages = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleSend = async () => {
    const parsed = formSchema.safeParse({ to, cc, bcc, subject, body });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const { to: toList, cc: ccList, bcc: bccList, subject: subj, body: msg } = parsed.data;
    const visibleRecipients = [...toList, ...ccList].join(", ");
    const allRecipients = [
      ...toList.map((e) => ({ email: e, role: "to" as const })),
      ...ccList.map((e) => ({ email: e, role: "cc" as const })),
      ...bccList.map((e) => ({ email: e, role: "bcc" as const })),
    ];
    // Deduplicate by lowercased email; prefer To > Cc > Bcc role
    const seen = new Map<string, { email: string; role: "to" | "cc" | "bcc" }>();
    for (const r of allRecipients) {
      const key = r.email.toLowerCase();
      if (!seen.has(key)) seen.set(key, r);
    }

    setSending(true);
    const batchId = crypto.randomUUID();
    let okCount = 0;
    let failCount = 0;

    for (const r of seen.values()) {
      try {
        const { data, error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "admin-message",
            recipientEmail: r.email,
            idempotencyKey: `${batchId}-${r.email.toLowerCase()}`,
            batchId,
            templateData: {
              subject: subj,
              bodyText: msg,
              senderName: "Good Vibes Café",
              visibleRecipients: r.role === "bcc" ? "" : visibleRecipients,
            },
          },
        });
        if (error) throw error;
        if (data?.success === false && data?.reason === "email_suppressed") {
          failCount++;
        } else {
          okCount++;
        }
      } catch (e) {
        console.error("send failed", r.email, e);
        failCount++;
      }
    }

    setSending(false);
    if (failCount === 0) {
      toast.success(`Queued ${okCount} email${okCount === 1 ? "" : "s"}.`);
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBody("");
    } else {
      toast.warning(`Queued ${okCount}, failed/suppressed ${failCount}.`);
    }
  };

  return (
    <Layout>
      <PageMeta title="Send Messages" description="Send messages to members" />
      <div className="container max-w-3xl py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-teal uppercase tracking-wider mb-2">Admin Panel</p>
          <h1 className="font-display text-4xl font-bold mb-2">Send Messages</h1>
          <p className="text-muted-foreground">
            Compose an email and send it from notify@goodvibescafe.org. Separate multiple
            addresses with commas, semicolons, or new lines.
          </p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Textarea
              id="to"
              placeholder="alice@example.com, bob@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc">Cc</Label>
            <Textarea
              id="cc"
              placeholder="Optional"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bcc">Bcc</Label>
            <Textarea
              id="bcc"
              placeholder="Optional"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground">
              Plain text. Blank lines start a new paragraph.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send message"}
            </Button>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground mt-4">
          Each recipient receives an individual email. Bcc recipients are hidden from the
          visible recipient list shown in the message footer.
        </p>

        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold mb-1">Sent messages</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Recent admin messages and event-related emails. Click the recipient count to
            expand the full list.
          </p>
          <SentMessagesList />
        </div>
      </div>
    </Layout>
  );
};

export default AdminMessages;

import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, X, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";

type CheckResult = {
  domain: string;
  checked_at: string;
  records: {
    mx: any[];
    txt: any[];
    dmarc: any[];
    improvmxDkim: any[];
  };
  spfRecords: { data: string }[];
  checks: Record<string, { ok: boolean; label: string; expected: string }>;
};

const AdminEmailHealth = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [domain, setDomain] = useState("goodvibescafe.org");
  const [data, setData] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data: res, error: invokeErr } = await supabase.functions.invoke<CheckResult>(
        "check-email-dns",
        { method: "GET" as any, body: undefined, headers: undefined } as any
      );
      // fallback: use fetch since invoke doesn't do query params well
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const r = await fetch(
        `https://${projectId}.functions.supabase.co/check-email-dns?domain=${encodeURIComponent(domain)}`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      const json = (await r.json()) as CheckResult;
      if (!r.ok) throw new Error((json as any).error || "Request failed");
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const allOk = data && Object.entries(data.checks)
    .filter(([k]) => k !== "dkim_improvmx") // DKIM optional
    .every(([, v]) => v.ok);

  return (
    <Layout>
      <PageMeta title="Email Health — Admin" description="Check SPF, DKIM, DMARC, and MX records." />
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <Link to="/admin/notifications" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 font-body">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to admin
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-7 w-7 text-electric" />
            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Email deliverability</h1>
          </div>
          <p className="text-muted-foreground font-body mb-8">
            Verify SPF, DKIM, DMARC, and MX records for incoming mail forwarding via ImprovMX.
          </p>

          <Card className="p-6 mb-6">
            <div className="flex gap-3">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="goodvibescafe.org"
                className="font-body"
              />
              <Button onClick={run} disabled={busy} variant="hero">
                {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Check"}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive mt-3 font-body">{error}</p>}
          </Card>

          {data && (
            <>
              <Card className={`p-4 mb-6 border-2 ${allOk ? "border-turquoise" : "border-amber-500"}`}>
                <div className="flex items-center gap-3">
                  {allOk ? (
                    <Check className="h-6 w-6 text-turquoise" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  )}
                  <div>
                    <p className="font-display font-semibold">
                      {allOk ? "All required checks passed" : "Action required"}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      Checked {new Date(data.checked_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3 mb-8">
                {Object.entries(data.checks).map(([key, c]) => (
                  <Card key={key} className="p-4 flex items-start gap-4">
                    {c.ok ? (
                      <Check className="h-5 w-5 text-turquoise mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-body font-medium">{c.label}</p>
                        {key === "dkim_improvmx" && !c.ok && (
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-body mt-1 break-words">{c.expected}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <details className="bg-card border border-border rounded-xl p-4">
                <summary className="cursor-pointer font-display font-semibold">Raw DNS records</summary>
                <pre className="text-xs mt-4 overflow-x-auto font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(data.records, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminEmailHealth;

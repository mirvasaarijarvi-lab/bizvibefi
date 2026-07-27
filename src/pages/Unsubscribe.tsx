import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "invalid" | "already" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const json = await res.json();
        if (!res.ok) {
          setState("invalid");
          return;
        }
        if (json.valid === false && json.reason === "already_unsubscribed") {
          setState("already");
        } else if (json.valid === true) {
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState("success");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageMeta title="Unsubscribe — <Good Vibes Café/>" description="Unsubscribe from <Good Vibes Café/> newsletters and event emails. Confirm your preferences and stop future messages to your inbox." />
      <div className="container max-w-md py-16">
        <Card className="p-8 text-center space-y-4">
          {state === "loading" && (
            <>
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Validating your link...</p>
            </>
          )}
          {state === "valid" && (
            <>
              <h1 className="font-display text-2xl font-bold">Unsubscribe</h1>
              <p className="text-muted-foreground">
                Confirm to stop receiving emails from Good Vibes Café.
              </p>
              <Button onClick={confirm} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm unsubscribe
              </Button>
            </>
          )}
          {state === "success" && (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto text-teal" />
              <h1 className="font-display text-2xl font-bold">You're unsubscribed</h1>
              <p className="text-muted-foreground">
                You will no longer receive emails from Good Vibes Café.
              </p>
            </>
          )}
          {state === "already" && (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto text-teal" />
              <h1 className="font-display text-2xl font-bold">Already unsubscribed</h1>
              <p className="text-muted-foreground">This email is no longer on our list.</p>
            </>
          )}
          {state === "invalid" && (
            <>
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <h1 className="font-display text-2xl font-bold">Invalid link</h1>
              <p className="text-muted-foreground">
                This unsubscribe link is invalid or has expired.
              </p>
            </>
          )}
          {state === "error" && (
            <>
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
              <p className="text-muted-foreground">Please try again later.</p>
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Unsubscribe;

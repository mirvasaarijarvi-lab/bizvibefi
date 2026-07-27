import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/auth");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <Layout>
        <PageMeta title="Reset Password — <Good Vibes Café/>" description="Reset your <Good Vibes Café/> account password using the secure recovery link sent to your email inbox." />
        <section className="py-20 px-4 text-center">
          <p className="text-muted-foreground font-body">Invalid or expired reset link.</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageMeta title="Reset Password — <Good Vibes Café/>" description="Set a new password for your <Good Vibes Café/> account and sign back in to the collective for builders." />
      <section className="py-20 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="font-display text-3xl font-bold text-foreground mb-6 text-center">Set New Password</h1>
          <form onSubmit={handleReset} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-body">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="font-body"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-storm" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default ResetPassword;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle } from "lucide-react";

interface NewsletterSignupProps {
  variant?: "inline" | "card";
}

const NewsletterSignup = ({ variant = "inline" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: trimmed });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already subscribed!", description: "You're already on our list." });
          setSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast({ title: "Subscribed!", description: "Welcome to the <Good Vibes Café/> newsletter." });
      }
      setEmail("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-accent font-body">
        <CheckCircle className="h-4 w-4" />
        <span>You're in! Stay tuned.</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          Stay in the loop
        </h3>
        <p className="text-sm text-muted-foreground font-body mb-5 max-w-sm mx-auto">
          Get updates on events, tools, and community wins. No spam, just signal.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="font-body"
            aria-label="Email address"
          />
          <Button
            type="submit"
            className="bg-gradient-storm hover:opacity-90 font-body shrink-0"
            disabled={loading}
          >
            {loading ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="font-body text-sm h-9 max-w-[200px]"
        aria-label="Email address for newsletter"
      />
      <Button
        type="submit"
        size="sm"
        className="bg-gradient-storm hover:opacity-90 font-body text-xs shrink-0"
        disabled={loading}
      >
        {loading ? "..." : "Subscribe"}
      </Button>
    </form>
  );
};

export default NewsletterSignup;

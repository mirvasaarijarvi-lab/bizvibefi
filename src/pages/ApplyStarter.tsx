import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  company_name: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const ApplyStarter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { full_name: "", email: "", phone: "", company_name: "", notes: "" },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to join Starter.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("starter_applications").insert({
      user_id: user.id,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || null,
      company_name: values.company_name || null,
      notes: values.notes || null,
    });

    if (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      return;
    }

    setSubmitted(true);
    toast({ title: "Welcome to Starter!", description: "You're in. Check your inbox for next steps." });
  };

  if (!user) {
    return (
      <Layout>
        <PageMeta title="Join Starter — <Good Vibes Café/>" description="Join <Good Vibes Café/> Starter for free." />
        <section className="py-24 md:py-36">
          <div className="container max-w-lg text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Sign in to continue</h1>
            <p className="text-muted-foreground font-body mb-6">Create a free account, then complete your Starter profile.</p>
            <Button asChild variant="hero" size="lg"><Link to="/auth">Sign in or sign up</Link></Button>
          </div>
        </section>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <PageMeta title="Welcome — <Good Vibes Café/>" description="You're in." />
        <section className="py-24 md:py-36">
          <div className="container max-w-lg text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">You're in!</h1>
              <p className="text-muted-foreground font-body text-lg">
                Welcome to <Good Vibes Café/> Starter. When you're ready for leads, courses, and the inner circle, upgrade to Viber.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="hero" size="lg"><Link to="/community">Explore the community</Link></Button>
                <Button asChild variant="heroOutline" size="lg">
                  <Link to="/apply-viber"><Sparkles className="mr-2 h-4 w-4" /> Upgrade to Viber</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageMeta title="Join Starter — <Good Vibes Café/>" description="Join <Good Vibes Café/> Starter for free. WhatsApp community, free events, and #ShipHappens hackathons." />
      <section className="py-20 md:py-28">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="w-14 h-14 rounded-xl bg-gradient-storm flex items-center justify-center mx-auto mb-6">
              <Rocket className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em]">
              Join <span className="text-primary">Starter</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-lg mx-auto">
              Free forever. Tell us a bit about yourself and you're in. No invoice, no commitment.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="full_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl><Input placeholder="+358 ..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company or project (optional)</FormLabel>
                    <FormControl><Input placeholder="What you're building" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything else? (optional)</FormLabel>
                    <FormControl><Textarea placeholder="What brings you to <Good Vibes Café/>?" rows={4} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting…" : "Join Starter"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground text-center font-body">
                  Want leads, courses, and the inner circle? <Link to="/apply-viber" className="text-primary hover:underline">Upgrade to Viber</Link> any time.
                </p>
              </form>
            </Form>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ApplyStarter;

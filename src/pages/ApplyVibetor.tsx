import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Gem, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  vibetor_type: z.union([z.literal("innovator"), z.literal("investor"), z.literal("partner")], { message: "Please select a type" }),
  is_company: z.boolean().default(false),
  company_name: z.string().trim().max(200).optional(),
  representative_name: z.string().trim().max(100).optional(),
  linkedin_url: z.string().trim().url("Please enter a valid URL").optional().or(z.literal("")),
  motivation: z.string().trim().min(20, "Please tell us a bit more (at least 20 characters)").max(2000),
}).refine(
  (data) => {
    if (data.vibetor_type === "partner" && data.is_company) {
      return !!data.representative_name && data.representative_name.length >= 2;
    }
    return true;
  },
  { message: "Company partners must provide a representative name", path: ["representative_name"] }
);

type FormValues = z.infer<typeof formSchema>;

const ApplyVibetor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      vibetor_type: undefined,
      is_company: false,
      company_name: "",
      representative_name: "",
      linkedin_url: "",
      motivation: "",
    },
  });

  const vibetorType = form.watch("vibetor_type");
  const isCompany = form.watch("is_company");

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase
      .from("vibetor_applications")
      .insert({
        user_id: user?.id ?? null,
        full_name: values.full_name,
        email: values.email,
        vibetor_type: values.vibetor_type,
        is_company: values.is_company,
        company_name: values.company_name || null,
        representative_name: values.representative_name || null,
        linkedin_url: values.linkedin_url || null,
        motivation: values.motivation,
      });

    if (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      return;
    }

    setSubmitted(true);
    toast({ title: "Application submitted!", description: "We'll review your application and get back to you." });
  };

  if (submitted) {
    return (
      <Layout>
        <PageMeta title="Application Submitted — BizVibe" description="Your Vibetor application has been submitted." />
        <section className="py-24 md:py-36">
          <div className="container max-w-lg text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <CheckCircle className="h-16 w-16 text-vibetor mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Application Received!</h1>
              <p className="text-muted-foreground font-body text-lg">
                Thank you for your interest in becoming a Vibetor. Our team will review your application and reach out to you soon.
              </p>
              {vibetorType === "partner" && isCompany && (
                <p className="mt-4 text-sm text-muted-foreground font-body">
                  As a company partner, a partnership fee will apply. We'll discuss the details during the review process.
                </p>
              )}
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageMeta title="Apply as Vibetor — BizVibe" description="Apply to join BizVibe as a Vibetor — investors, innovators, and partners." />
      <section className="py-20 md:py-28">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="w-14 h-14 rounded-xl bg-vibetor/90 flex items-center justify-center mx-auto mb-6">
              <Gem className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em]">
              Apply as <span className="text-vibetor">Vibetor</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-lg mx-auto">
              Vibetors are the investors, advisory innovators, and strategic partners who fuel the collective. Tell us about yourself.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="full_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="vibetor_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a…</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {[
                          { value: "innovator", label: "Advisory Innovator", desc: "Mentor & guide builders" },
                          { value: "investor", label: "Investor", desc: "Fund promising ventures" },
                          { value: "partner", label: "Partner", desc: "Strategic collaboration" },
                        ].map((opt) => (
                          <label key={opt.value}
                            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all text-center ${field.value === opt.value ? "border-vibetor bg-vibetor/5" : "border-border hover:border-vibetor/40"}`}
                          >
                            <RadioGroupItem value={opt.value} className="sr-only" />
                            <span className="font-display font-semibold text-sm">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.desc}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {vibetorType === "partner" && (
                  <FormField control={form.control} name="is_company" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>I'm applying on behalf of a company</FormLabel>
                        <FormDescription>Company partners are subject to a partnership fee.</FormDescription>
                      </div>
                    </FormItem>
                  )} />
                )}

                {vibetorType === "partner" && isCompany && (
                  <>
                    <FormField control={form.control} name="company_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl><Input placeholder="Your company name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="representative_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Representative</FormLabel>
                        <FormControl><Input placeholder="Name of the representative" {...field} /></FormControl>
                        <FormDescription>The person who will be the main point of contact.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                <FormField control={form.control} name="linkedin_url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile (optional)</FormLabel>
                    <FormControl><Input placeholder="https://linkedin.com/in/yourname" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="motivation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why do you want to become a Vibetor?</FormLabel>
                    <FormControl><Textarea placeholder="Tell us about yourself, your experience, and what you'd bring to the collective…" rows={5} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting…" : "Submit Application"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ApplyVibetor;

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import BillingFields, { billingSchema } from "@/components/BillingFields";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  is_company: z.boolean().default(false),
  company_name: z.string().trim().max(200).optional().or(z.literal("")),
  representative_name: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  ...billingSchema,
}).refine(
  (data) => !data.is_company || (!!data.company_name && data.company_name.length >= 2),
  { message: "Company name is required", path: ["company_name"] }
).refine(
  (data) => !data.is_company || (!!data.representative_name && data.representative_name.length >= 2),
  { message: "Representative name is required", path: ["representative_name"] }
).refine(
  (data) => !data.is_company || (!!data.billing_business_id && data.billing_business_id.length >= 2),
  { message: "Business ID is required for companies", path: ["billing_business_id"] }
);

type FormValues = z.infer<typeof formSchema>;

const ApplyViber = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      is_company: false,
      company_name: "",
      representative_name: "",
      notes: "",
      billing_name: "",
      billing_business_id: "",
      billing_vat_id: "",
      billing_email: "",
      billing_address: "",
      billing_postal_code: "",
      billing_city: "",
      billing_country: "Finland",
      billing_reference: "",
      einvoice_address: "",
      einvoice_operator: "",
    },
  });

  const isCompany = form.watch("is_company");
  const price = isCompany ? "€599 / year" : "€199 / year";

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to apply for Viber membership.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("viber_applications").insert({
      user_id: user.id,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || null,
      is_company: values.is_company,
      company_name: values.company_name || null,
      representative_name: values.representative_name || null,
      notes: values.notes || null,
      billing_name: values.billing_name,
      billing_business_id: values.billing_business_id || null,
      billing_vat_id: values.billing_vat_id || null,
      billing_email: values.billing_email,
      billing_address: values.billing_address,
      billing_postal_code: values.billing_postal_code,
      billing_city: values.billing_city,
      billing_country: values.billing_country,
      billing_reference: values.billing_reference || null,
      einvoice_address: values.einvoice_address || null,
      einvoice_operator: values.einvoice_operator || null,
    });

    if (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      return;
    }

    setSubmitted(true);
    toast({ title: "Application submitted!", description: "We'll send your invoice shortly." });
  };

  if (!user) {
    return (
      <Layout>
        <PageMeta title="Apply for Viber — GoodVibesCafe" description="Become a Viber member of GoodVibesCafe." />
        <section className="py-24 md:py-36">
          <div className="container max-w-lg text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Sign in required</h1>
            <p className="text-muted-foreground font-body mb-6">Please sign in to apply for Viber membership.</p>
            <Button asChild variant="hero" size="lg"><Link to="/auth">Sign in</Link></Button>
          </div>
        </section>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <PageMeta title="Application Submitted — GoodVibesCafe" description="Your Viber application has been submitted." />
        <section className="py-24 md:py-36">
          <div className="container max-w-lg text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Application Received!</h1>
              <p className="text-muted-foreground font-body text-lg">
                Thanks for joining as a Viber. We'll send your invoice to the email you provided. Your Viber access activates once payment is received.
              </p>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageMeta title="Become a Viber — GoodVibesCafe" description="Apply for Viber membership and get invoiced for €199/year (or €599/year for company partners)." />
      <section className="py-20 md:py-28">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="w-14 h-14 rounded-xl bg-primary/90 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em]">
              Become a <span className="text-primary">Viber</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-lg mx-auto">
              Lead generation, courses, investor events, and the inner circle. €199/year for individuals, €599/year for company partners. We'll send you an invoice after you submit.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm font-display">
                  Total to be invoiced: <span className="font-semibold text-primary">{price}</span>
                </div>

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

                <FormField control={form.control} name="is_company" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I'm joining as a company partner</FormLabel>
                      <FormDescription>Company partners are invoiced €599/year.</FormDescription>
                    </div>
                  </FormItem>
                )} />

                {isCompany && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="company_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company name</FormLabel>
                        <FormControl><Input placeholder="Your company" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="representative_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Representative</FormLabel>
                        <FormControl><Input placeholder="Main contact person" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                <BillingFields
                  control={form.control}
                  isCompany={isCompany}
                  description="We'll use these details to send your membership invoice."
                />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything else? (optional)</FormLabel>
                    <FormControl><Textarea placeholder="Notes for the team…" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting…" : "Submit & request invoice"}
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

export default ApplyViber;

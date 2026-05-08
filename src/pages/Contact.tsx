import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import mascotPeek from "@/assets/mascot-peek.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/useTranslation";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters")
    .regex(/^[^<>{}]*$/, "Name contains invalid characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .max(255, "Email must be under 255 characters"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message must be under 2000 characters")
    .regex(/^[^<>{}]*$/, "Message contains invalid characters"),
});

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check — bots fill this hidden field, humans don't
    if (honeypot) return;

    const result = contactSchema.safeParse({ name, email, message });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // Detect Vibetor-related requests
    const lowerMsg = message.toLowerCase();
    const isVibetorRequest = lowerMsg.includes("vibetor") || lowerMsg.includes("investor") || lowerMsg.includes("viber status") || lowerMsg.includes("viber membership");

    // Create admin notification
    const notificationType = isVibetorRequest ? "vibetor_request" : "contact";
    const notificationTitle = isVibetorRequest ? "Vibetor Status Request" : "New Contact Message";
    
    await supabase.from("admin_notifications").insert({
      type: notificationType,
      title: notificationTitle,
      message: message.slice(0, 500),
      sender_name: name,
      sender_email: email,
    } as never);

    toast({ title: t("contact.toast.title"), description: t("contact.toast.desc") });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <Layout>
      <PageMeta title="Contact — BizVibe" description="Got an idea, question, or just want to say hi? Reach out to the BizVibe collective." />
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <HeroAvatar src={mascotPeek} alt="BizVibe peeking mascot" />
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">{t("contact.tag")}</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              {t("contact.title")} <span className="text-gradient-surge">{t("contact.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">{t("contact.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
            >
              {/* Honeypot — hidden from humans, traps bots */}
              <div className="absolute opacity-0 -z-10 h-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">{t("contact.form.name")}</label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                  placeholder={t("contact.form.namePlaceholder")}
                  maxLength={100}
                  className={`bg-card border-border font-body ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && <p className="text-xs text-destructive mt-1 font-body">{errors.name}</p>}
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">{t("contact.form.email")}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder={t("contact.form.emailPlaceholder")}
                  maxLength={255}
                  className={`bg-card border-border font-body ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1 font-body">{errors.email}</p>}
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">{t("contact.form.message")}</label>
                <Textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: undefined })); }}
                  placeholder={t("contact.form.messagePlaceholder")}
                  rows={5}
                  maxLength={2000}
                  className={`bg-card border-border font-body ${errors.message ? "border-destructive" : ""}`}
                />
                {errors.message && <p className="text-xs text-destructive mt-1 font-body">{errors.message}</p>}
              </div>
              <Button variant="hero" size="lg" type="submit" className="w-full">{t("contact.form.submit")}</Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-card border border-border rounded-xl p-6">
                <Mail className="h-6 w-6 text-electric mb-3" />
                <h3 className="font-display text-lg font-semibold">{t("contact.emailTitle")}</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">{t("contact.emailAddr")}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <MessageCircle className="h-6 w-6 text-turquoise mb-3" />
                <h3 className="font-display text-lg font-semibold">{t("contact.whatsappTitle")}</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">{t("contact.whatsappDesc")}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <MessageCircle className="h-6 w-6 text-electric mb-3" />
                <h3 className="font-display text-lg font-semibold">Quick Chat</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">
                  Need a quick answer? Try our{" "}
                  <button
                    type="button"
                    onClick={() => {
                      const chatBtn = document.querySelector('[aria-label="Open support chat"]') as HTMLButtonElement;
                      chatBtn?.click();
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    AI support chat
                  </button>
                  .
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

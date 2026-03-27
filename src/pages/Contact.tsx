import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/TranslationContext";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t("contact.toast.title"), description: t("contact.toast.desc") });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <Layout>
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
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
            >
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">{t("contact.form.name")}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("contact.form.namePlaceholder")} required className="bg-card border-border font-body" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">{t("contact.form.email")}</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("contact.form.emailPlaceholder")} required className="bg-card border-border font-body" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">{t("contact.form.message")}</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("contact.form.messagePlaceholder")} rows={5} required className="bg-card border-border font-body" />
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
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Linkedin } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";

const About = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">{t("about.tag")}</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              {t("about.title")} <span className="text-gradient-prism">{t("about.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto leading-relaxed">{t("about.desc")}</p>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="pb-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-storm mx-auto mb-6 flex items-center justify-center">
                  <span className="font-display text-3xl font-extrabold text-primary-foreground">
                    {t(`about.founders.${i}.name`).split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold tracking-[-0.01em]">{t(`about.founders.${i}.name`)}</h3>
                <p className="text-turquoise font-body font-semibold text-sm mt-1">{t(`about.founders.${i}.role`)}</p>
                <p className="mt-3 text-sm text-muted-foreground font-body">{t(`about.founders.${i}.bio`)}</p>
                <a
                  href={t(`about.founders.${i}.linkedin`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-body font-medium text-electric hover:text-electric-light transition-colors"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="pb-20 md:pb-28">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em] text-center mb-12">
            {t("about.valuesTitle")} <span className="text-gradient-storm">{t("about.valuesTitleHighlight")}</span>
          </h2>
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start bg-card border border-border rounded-xl p-6"
              >
                <span className="font-display text-3xl font-extrabold text-gradient-prism">{i + 1}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{t(`about.values.${i}.title`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground font-body">{t(`about.values.${i}.desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/community">{t("about.cta")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;

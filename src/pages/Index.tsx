import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Rocket, Users, Zap, ArrowRight, Wrench, Search, Handshake, TrendingUp } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";

const Index = () => {
  const { t } = useTranslation();
  const freeBenefits = JSON.parse(t("tiers.free.benefits") === "tiers.free.benefits" ? "[]" : JSON.stringify([]));

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-vivid/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-electric/10 blur-[100px] pointer-events-none" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="font-display text-6xl md:text-8xl lg:text-[96px] font-extrabold tracking-[-0.03em] leading-[1.05] text-gradient-storm">
              BizVibe
            </h1>
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mt-3 mb-6">
              {t("hero.tag")}
            </p>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-[1.1]">
              <span className="text-gradient-prism">{t("hero.line1")}</span>
              <br />
              <span className="text-foreground">{t("hero.line2")}</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">
              {t("hero.desc")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/community">{t("hero.ctaJoin")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <Link to="/get-going">{t("hero.ctaGo")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Market Benefits */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em]">
              {t("market.title")} <span className="text-gradient-surge">{t("market.titleHighlight")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-2xl mx-auto">
              {t("market.subtitle")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const iconMap: Record<string, React.ElementType> = { Zap, Wrench, Search, Handshake, Rocket, TrendingUp };
              const iconName = t(`market.benefits.${i}.icon`);
              const IconComponent = iconMap[iconName] || Zap;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-xl p-6 hover:border-turquoise/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-surge flex items-center justify-center mb-4">
                    <IconComponent className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{t(`market.benefits.${i}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body">{t(`market.benefits.${i}.desc`)}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">{t("market.cta")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em]">
              {t("tiers.title")} <span className="text-gradient-storm">{t("tiers.titleHighlight")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-xl mx-auto">
              {t("tiers.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FreeTierCard />
            <ProTierCard />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="bg-gradient-storm rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(173_100%_45%/0.15),transparent_60%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em] text-primary-foreground">
                {t("ctaSection.title")}
              </h2>
              <p className="mt-4 text-primary-foreground/80 font-body text-lg max-w-lg mx-auto">
                {t("ctaSection.desc")}
              </p>
              <Button variant="accent" size="lg" className="mt-8" asChild>
                <Link to="/community">{t("ctaSection.cta")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const FreeTierCard = () => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-2xl p-8 hover:border-purple-vivid/40 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-surge flex items-center justify-center mb-6">
        <Users className="h-6 w-6 text-accent-foreground" />
      </div>
      <h3 className="font-display text-2xl font-bold tracking-[-0.01em]">{t("tiers.free.name")}</h3>
      <p className="text-turquoise font-display text-lg font-semibold mt-1">{t("tiers.free.price")}</p>
      <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-turquoise mt-0.5 shrink-0" />
            {t(`tiers.free.benefits.${i}`)}
          </li>
        ))}
      </ul>
      <Button variant="heroOutline" className="mt-8 w-full" asChild>
        <Link to="/community">{t("tiers.free.cta")}</Link>
      </Button>
    </motion.div>
  );
};

const ProTierCard = () => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-card border-2 border-purple-vivid rounded-2xl p-8 relative overflow-hidden glow-purple"
    >
      <div className="absolute top-0 right-0 bg-gradient-storm text-primary-foreground text-xs font-display font-semibold px-4 py-1.5 rounded-bl-xl">
        {t("tiers.pro.label")}
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-storm flex items-center justify-center mb-6">
        <Rocket className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="font-display text-2xl font-bold tracking-[-0.01em]">{t("tiers.pro.name")}</h3>
      <p className="text-purple-soft font-display text-lg font-semibold mt-1">{t("tiers.pro.price")}</p>
      <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-purple-soft mt-0.5 shrink-0" />
            {t(`tiers.pro.benefits.${i}`)}
          </li>
        ))}
      </ul>
      <Button variant="hero" className="mt-8 w-full" asChild>
        <Link to="/community">{t("tiers.pro.cta")}</Link>
      </Button>
    </motion.div>
  );
};

export default Index;

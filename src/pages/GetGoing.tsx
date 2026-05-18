import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import mascotRunning from "@/assets/mascot-running.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Wrench, MessageCircle, BookOpen, Headphones,
  ExternalLink, TrendingUp, Users, Lock, ArrowRight, Rocket, CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const toolDefs = [
  { icon: Wrench, tier: "starter" as const, href: "/showcase", external: false },
  { icon: BookOpen, tier: "viber" as const, href: "/community", external: false },
  { icon: MessageCircle, tier: "starter" as const, href: "https://chat.whatsapp.com/STARTER_PLACEHOLDER", external: true },
  { icon: Users, tier: "viber" as const, href: "https://chat.whatsapp.com/VIBER_PLACEHOLDER", external: true },
  { icon: Headphones, tier: "viber" as const, href: "/contact", external: false },
  { icon: TrendingUp, tier: "viber" as const, href: "/community", external: false },
];

const GetGoing = () => {
  const { t, lang } = useTranslation();

  return (
    <Layout>
      <PageMeta title="Get Going — <Good Vibes Café/>" description="Tools, templates, and resources to start building and never stop. From no-code to full-stack." />
      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <HeroAvatar src={mascotRunning} alt="<Good Vibes Café/> running mascot" />
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">{t("getGoing.tag")}</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              <span className="text-gradient-surge">{t("getGoing.title")}</span> {t("getGoing.titleEnd")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">{t("getGoing.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="pb-20">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {toolDefs.map(({ icon: Icon, tier, href, external }, i) => {
              const isViber = tier === "viber";
              const cardContent = (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`bg-card border rounded-xl p-8 transition-colors group relative ${
                    isViber
                      ? "border-primary/20 hover:border-primary/50"
                      : "border-border hover:border-electric/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-6 w-6 ${isViber ? "text-primary" : "text-electric"}`} />
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isViber ? "default" : "secondary"}
                        className="text-xs font-body"
                      >
                        {isViber && <Lock className="mr-1 h-3 w-3" />}
                        {t(`getGoing.tools.${i}.tier`)}
                      </Badge>
                      <span className={`text-xs font-body font-semibold px-3 py-1 rounded-full ${
                        isViber
                          ? "text-primary bg-primary/10"
                          : "text-electric bg-electric/10"
                      }`}>
                        {t(`getGoing.tools.${i}.tag`)}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-[-0.01em]">{t(`getGoing.tools.${i}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body">{t(`getGoing.tools.${i}.desc`)}</p>
                  <span className={`mt-4 inline-flex items-center font-body text-sm ${isViber ? "text-primary group-hover:text-primary/80" : "text-electric group-hover:text-electric-light"}`}>
                    {t("getGoing.explore")} {external ? <ExternalLink className="ml-1 h-3 w-3" /> : <ArrowRight className="ml-1 h-3 w-3" />}
                  </span>
                </motion.div>
              );

              return external ? (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="block">
                  {cardContent}
                </a>
              ) : (
                <Link key={i} to={href} className="block">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Case Examples — links to Showcase */}
      <section className="pb-20 md:pb-28">
        <div className="container">
          <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em] text-center mb-12">
            {t("getGoing.casesTitle")} <span className="text-gradient-prism">{t("getGoing.casesTitleHighlight")}</span> {lang === "fi" ? "tapahtumat" : ""}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:glow-purple transition-all duration-300"
              >
                <span className="text-xs font-body font-semibold text-purple-soft bg-purple-vivid/10 px-3 py-1 rounded-full">
                  {t(`getGoing.cases.${i}.category`)}
                </span>
                <h3 className="font-display text-lg font-semibold tracking-[-0.01em] mt-4">{t(`getGoing.cases.${i}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-body">{t(`getGoing.cases.${i}.desc`)}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="heroOutline" asChild>
              <Link to="/showcase">
                {t("getGoing.viewShowcase")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground font-body">{t("getGoing.blogSoon")}</p>
          </div>
        </div>
      </section>

      {/* Viber Upgrade CTA */}
      <section className="pb-20 md:pb-28">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border-2 border-primary/30 rounded-2xl p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-display font-semibold px-4 py-1.5 rounded-bl-xl">
              VIBER
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">
                {t("getGoing.upgradeCta.title")}{" "}
                <span className="text-gradient-storm">{t("getGoing.upgradeCta.titleHighlight")}</span>
              </h2>
            </div>

            <p className="text-muted-foreground font-body max-w-2xl mb-8">
              {t("getGoing.upgradeCta.desc")}
            </p>

            <div className="bg-muted/50 rounded-xl p-6 mb-8">
              <h3 className="font-display font-semibold text-lg mb-4">{t("getGoing.upgradeCta.howTitle")}</h3>
              <ol className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3 font-body text-sm text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    {t(`getGoing.upgradeCta.howSteps.${i}`)}
                  </li>
                ))}
              </ol>
            </div>

            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">
                {t("getGoing.upgradeCta.cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default GetGoing;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import NewsletterSignup from "@/components/NewsletterSignup";
import { motion, useInView } from "framer-motion";
import { Rocket, Users, Zap, ArrowRight, Wrench, Search, Handshake, TrendingUp, CalendarCheck, Code2, Lightbulb, MessageSquare } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { t } = useTranslation();
  const freeBenefits = JSON.parse(t("tiers.free.benefits") === "tiers.free.benefits" ? "[]" : JSON.stringify([]));

  return (
    <Layout>
      <PageMeta title="BizVibe — The Collective for Builders" description="A collective of builders, strategists and connectors. Shoot first, fail spectacularly, ship solid." />
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
            <h1 className="font-display text-5xl md:text-8xl lg:text-[96px] font-extrabold tracking-[-0.03em] leading-[1.05] text-gradient-storm">
              BizVibe
            </h1>
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mt-3 mb-6">
              {t("hero.tag")}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-[1.15]">
              <span className="text-gradient-prism">{t("hero.line1")}</span>
              <br />
              <span className="text-foreground">{t("hero.line2")}</span>
              <br />
              <span className="text-gradient-surge">{t("hero.line3")}</span>
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

      {/* Success Metrics */}
      <MetricsCounter />

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
                  className="bg-card border border-border rounded-xl p-6 hover:border-turquoise/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-surge flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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

      {/* Showcase Preview */}
      <ShowcasePreview />

      {/* Newsletter */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container max-w-2xl">
          <NewsletterSignup variant="card" />
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
      className="group bg-card border border-border rounded-2xl p-8 hover:border-purple-vivid/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-surge flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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
      className="group bg-card border-2 border-purple-vivid rounded-2xl p-8 relative overflow-hidden glow-purple hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 bg-gradient-storm text-primary-foreground text-xs font-display font-semibold px-4 py-1.5 rounded-bl-xl">
        {t("tiers.pro.label")}
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-storm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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


const useCountUp = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView || target === 0) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return { count, ref };
};

const MetricCard = ({ metric, index }: { metric: { label: string; value: number; icon: React.ElementType; color: string }; index: number }) => {
  const { count, ref } = useCountUp(metric.value);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      className="text-center"
    >
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border mb-4 ${metric.color}`}>
        <metric.icon className="h-7 w-7" />
      </div>
      <p className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
        {count}+
      </p>
      <p className="mt-1 text-sm text-muted-foreground font-body font-medium">
        {metric.label}
      </p>
    </motion.div>
  );
};

const MetricsCounter = () => {
  const { data: memberCount } = useQuery({
    queryKey: ["metrics-members"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const { data: eventCount } = useQuery({
    queryKey: ["metrics-events"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const { data: topicCount } = useQuery({
    queryKey: ["metrics-topics"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("forum_topics")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const metrics = [
    { label: "Members", value: memberCount ?? 0, icon: Users, color: "text-turquoise" },
    { label: "Events Hosted", value: eventCount ?? 0, icon: CalendarCheck, color: "text-purple-soft" },
    { label: "Forum Topics", value: topicCount ?? 0, icon: Code2, color: "text-electric" },
  ];

  return (
    <section className="py-16 md:py-20 border-t border-border">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {metrics.map((m, i) => (
            <MetricCard key={m.label} metric={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const showcaseTypeIcons: Record<string, React.ElementType> = {
  case_study: Lightbulb,
  testimonial: MessageSquare,
  tool: Wrench,
};

const ShowcasePreview = () => {
  const { t } = useTranslation();
  const { data: items } = useQuery({
    queryKey: ["showcase-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_items")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <section className="py-20 md:py-28 border-t border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">
            {t("showcase.tag")}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em]">
            {t("showcase.sectionTitle")} <span className="text-gradient-storm">{t("showcase.sectionHighlight")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            {t("showcase.subtitle")}
          </p>
        </motion.div>

        {items && items.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {items.map((item, i) => {
              const Icon = showcaseTypeIcons[item.type] || Lightbulb;
              return (
                <Link to={`/showcase/${item.id}`} key={item.id} className="block">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    {item.image_url && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-xs">{item.type.replace("_", " ")}</Badge>
                      </div>
                      <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground font-body line-clamp-2">{item.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.category_tags?.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground font-body">{t("showcase.empty")}</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/showcase">{t("showcase.sectionCta")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Index;

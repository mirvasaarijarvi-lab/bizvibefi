import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, Rocket, Zap, MessageCircle, Calendar, TrendingUp, GraduationCap, Handshake, ArrowRight, Quote, Gem } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Badge } from "@/components/ui/badge";

const freeIcons = [MessageCircle, Calendar, Rocket, Users];
const proIcons = [TrendingUp, GraduationCap, Handshake, MessageCircle, Calendar];
const vibetorIcons = [Gem, Users, TrendingUp, Calendar];

const Community = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <PageMeta title="Community — BizVibe" description="Join the BizVibe community. Free and Pro tiers for builders who want to connect, learn, and ship together." />
      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">{t("community.tag")}</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              {t("community.title")} <span className="text-gradient-storm">{t("community.titleHighlight")}</span> {t("community.titleEnd")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">{t("community.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      {/* Free Tier */}
      <section className="pb-20">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-gradient-surge flex items-center justify-center">
                <Users className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">{t("community.free.name")}</h2>
                <p className="text-turquoise font-body font-semibold">{t("community.free.price")}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {freeIcons.map((Icon, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-turquoise/40 transition-colors">
                  <Icon className="h-6 w-6 text-turquoise mb-4" />
                  <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{t(`community.free.benefits.${i}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body">{t(`community.free.benefits.${i}.desc`)}</p>
                </div>
              ))}
            </div>
            <Button variant="heroOutline" size="lg" className="mt-8">
              {t("community.free.cta")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pro Tier */}
      <section className="pb-20 md:pb-28">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-gradient-storm flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">{t("community.pro.name")}</h2>
                <p className="text-purple-soft font-body font-semibold">{t("community.pro.price")}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {proIcons.map((Icon, i) => (
                <div key={i} className="bg-card border-2 border-purple-vivid/30 rounded-xl p-6 hover:border-purple-vivid/60 transition-colors">
                  <Icon className="h-6 w-6 text-purple-soft mb-4" />
                  <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{t(`community.pro.benefits.${i}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body">{t(`community.pro.benefits.${i}.desc`)}</p>
                </div>
              ))}
            </div>
            <Button variant="hero" size="lg" className="mt-8">
              {t("community.pro.cta")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Vibetor Tier */}
      <section className="pb-20 md:pb-28">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-amber-500/90 flex items-center justify-center">
                <Gem className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">{t("community.vibetor.name")}</h2>
                <p className="text-amber-500 font-body font-semibold">{t("community.vibetor.price")}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vibetorIcons.map((Icon, i) => (
                <div key={i} className="bg-card border-2 border-amber-500/30 rounded-xl p-6 hover:border-amber-500/60 transition-colors">
                  <Icon className="h-6 w-6 text-amber-500 mb-4" />
                  <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{t(`community.vibetor.benefits.${i}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body">{t(`community.vibetor.benefits.${i}.desc`)}</p>
                </div>
              ))}
            </div>
            <Button variant="hero" size="lg" className="mt-8">
              {t("community.vibetor.cta")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Showcase CTA */}
      <section className="pb-20">
        <div className="container">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">
              {t("showcase.sectionTitle")} <span className="text-gradient-storm">{t("showcase.sectionHighlight")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground font-body max-w-lg mx-auto">{t("showcase.subtitle")}</p>
            <Button variant="hero" size="lg" className="mt-6" asChild>
              <Link to="/showcase">{t("showcase.sectionCta")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="pb-24 md:pb-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-[-0.03em]">
              {t("community.testimonials.title")}{" "}
              <span className="text-gradient-storm">{t("community.testimonials.titleHighlight")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground font-body">{t("community.testimonials.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:border-purple-vivid/30 transition-colors"
              >
                <div>
                  <Quote className="h-5 w-5 text-purple-soft mb-3 opacity-60" />
                  <p className="font-body text-sm text-foreground/90 leading-relaxed italic">
                    "{t(`community.testimonials.items.${i}.quote`)}"
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">
                      {t(`community.testimonials.items.${i}.name`)}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {t(`community.testimonials.items.${i}.role`)}
                    </p>
                  </div>
                  <Badge
                    variant={t(`community.testimonials.items.${i}.tier`) === "Viber" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {t(`community.testimonials.items.${i}.tier`)}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Community;

import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Linkedin, Gem, Sparkles, Star } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const FOUNDER_NAMES = ["Minna Blomster", "Mirva Saarijärvi", "Vesa Mattila"];
// Aliases / alternate display names some founders may use on their member profile
const FOUNDER_ALIASES: Record<string, string[]> = {
  "Mirva Saarijärvi": ["Mimmi Saarijärvi"],
};
const ALL_FOUNDER_NAMES = [
  ...FOUNDER_NAMES,
  ...Object.values(FOUNDER_ALIASES).flat(),
];

const About = () => {
  const { t } = useTranslation();

  const { data: founderProfiles } = useQuery({
    queryKey: ["founder-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, user_id, membership_tier, vibetor_type")
        .in("display_name", ALL_FOUNDER_NAMES);
      return data ?? [];
    },
    staleTime: 300_000,
  });

  const { data: vibetors } = useQuery({
    queryKey: ["vibetors-about"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, user_id, company, vibetor_type")
        .eq("membership_tier", "vibetor");
      return (data ?? []) as { display_name: string | null; avatar_url: string | null; user_id: string; company: string | null; vibetor_type: string | null }[];
    },
    staleTime: 300_000,
  });

  // Exclude founders (and their aliases) from the public Vibetors list
  const filteredVibetors = (vibetors ?? []).filter(
    (v) => !v.display_name || !ALL_FOUNDER_NAMES.includes(v.display_name)
  );

  const findFounderProfile = (name: string) => {
    const aliases = [name, ...(FOUNDER_ALIASES[name] ?? [])];
    return founderProfiles?.find((p) => p.display_name && aliases.includes(p.display_name)) ?? null;
  };

  const getFounderAvatar = (name: string) => findFounderProfile(name)?.avatar_url ?? null;
  const getFounderUserId = (name: string) => findFounderProfile(name)?.user_id ?? null;
  // All three founders are Vibetors by virtue of founding the collective
  const getFounderVibetorStatus = (_name: string) => true;

  return (
    <Layout>
      <PageMeta title="About — BizVibe" description="Three builders, one collective. Meet the founders behind BizVibe and our values." />
      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <HeroAvatar />
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
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em]">
              {t("about.foundersHeading")} <span className="text-gradient-prism">{t("about.foundersHeadingHighlight")}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[0, 1, 2].map((i) => {
              const name = t(`about.founders.${i}.name`);
              const avatarUrl = getFounderAvatar(name);
              const userId = getFounderUserId(name);
              const isVibetor = getFounderVibetorStatus(name);
              const linkedinUrl = t(`about.founders.${i}.linkedin`);

              const cardContent = (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center bg-card border border-border rounded-2xl p-8 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
                >
                  <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-storm flex items-center justify-center">
                        <span className="font-display text-3xl font-extrabold text-primary-foreground">
                          {name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-[-0.01em] group-hover:text-primary transition-colors">{name}</h3>
                  <p className="text-turquoise font-body font-semibold text-sm mt-1">{t(`about.founders.${i}.role`)}</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <Badge className="text-[10px] px-2 py-0.5 bg-gradient-prism text-primary-foreground inline-flex items-center gap-1 border-0">
                      <Star className="h-3 w-3" /> FOUNDER
                    </Badge>
                    {isVibetor && (
                      <Badge className="text-[10px] px-2 py-0.5 bg-vibetor/90 hover:bg-vibetor text-primary-foreground inline-flex items-center gap-1">
                        <Gem className="h-3 w-3" /> VIBETOR
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground font-body">{t(`about.founders.${i}.bio`)}</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm font-body font-medium text-electric group-hover:text-electric-light transition-colors">
                      <Linkedin className="h-4 w-4" /> LinkedIn <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  {userId && (
                    <Link
                      to={`/members/${userId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-body font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      View Profile <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </motion.div>
              );

              return (
                <a
                  key={i}
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  {cardContent}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vibetors */}
      <section className="pb-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gem className="h-6 w-6 text-vibetor" />
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em]">
              {t("about.vibetorsTitle")} <span className="text-vibetor">{t("about.vibetorsTitleHighlight")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground font-body max-w-xl mx-auto">{t("about.vibetorsSubtitle")}</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredVibetors.map((v) => {
              const initials = v.display_name
                ? v.display_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                : "?";
              const typeLabel = v.vibetor_type ? t(`about.vibetorTypes.${v.vibetor_type}`) : null;
              return (
                <motion.div
                  key={v.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={`/members/${v.user_id}`}
                    className="block text-center bg-card border-2 border-vibetor/30 rounded-2xl p-6 hover:border-vibetor/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarImage src={v.avatar_url ?? undefined} alt={v.display_name ?? "Vibetor"} />
                      <AvatarFallback className="text-lg font-semibold bg-vibetor/20 text-vibetor">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-display text-lg font-bold tracking-[-0.01em] group-hover:text-vibetor transition-colors">
                      {v.display_name || "Vibetor"}
                    </h3>
                    {v.company && (
                      <p className="text-sm text-muted-foreground font-body mt-1">{v.company}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Badge className="text-[10px] px-2 py-0.5 bg-vibetor/90 hover:bg-vibetor text-primary-foreground">
                        VIBETOR
                      </Badge>
                      {typeLabel && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-vibetor/40 text-vibetor">
                          {typeLabel}
                        </Badge>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {/* Join CTA placeholder card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sm:col-span-2 md:col-span-1"
            >
              <Link
                to="/get-going"
                className="flex flex-col items-center justify-center text-center h-full bg-card border-2 border-dashed border-vibetor/40 rounded-2xl p-6 hover:border-vibetor hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-vibetor/10 flex items-center justify-center group-hover:bg-vibetor/20 transition-colors">
                  <Sparkles className="h-8 w-8 text-vibetor" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-vibetor">
                  {t("about.vibetorJoinTitle")}
                </h3>
                <p className="text-sm text-muted-foreground font-body mt-2">
                  {t("about.vibetorJoinDesc")}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-body font-semibold text-vibetor">
                  {t("about.vibetorJoinCta")} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
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
            {[0, 1, 2].map((i) => {
              const valueLinks = ["/community", "/showcase", "/get-going"];
              return (
                <Link to={valueLinks[i]} key={i} className="block">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 items-start bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <span className="font-display text-3xl font-extrabold text-gradient-prism">{i + 1}</span>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-semibold tracking-[-0.01em] group-hover:text-primary transition-colors">{t(`about.values.${i}.title`)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground font-body">{t(`about.values.${i}.desc`)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 mt-1 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.div>
                </Link>
              );
            })}
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

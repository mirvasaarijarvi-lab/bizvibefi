import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import HeroAvatar from "@/components/HeroAvatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Linkedin, Gem, Sparkles, Star, Target, Eye, Compass, Rocket, Heart, Feather, HelpCircle } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ABOUT_FAQS = [
  {
    q: "How do I join the collective?",
    a: "Start with a free Starter account from the Get Going page. From there you can apply for Viber (full membership, invoiced manually) or Vibetor (curated tier via application). Pick the tier that matches where you are as a builder.",
  },
  {
    q: "What is the difference between Starter, Viber, and Vibetor?",
    a: "Starter is free and gives you the community basics. Viber unlocks the full member experience, the Vault, events, Showcase file uploads, and deeper forum access. Vibetor is for connectors, investors, and expert builders accepted through a short application.",
  },
  {
    q: "Do I have to be based in Finland or the Nordics?",
    a: "We are a Nordic collective by gravity, not by gate. Most members are in Finland and the Nordics, but builders from anywhere are welcome as long as you ship and bring good vibes.",
  },
  {
    q: "What support and resources do members get?",
    a: "Members get the Vault (curated knowledge and templates), a Forum with peer feedback and structured Leads, the Showcase to publish tools and tests, events with RSVP, badges and a leaderboard, plus direct access to other builders, Vibetors, and the founders.",
  },
  {
    q: "Can I share a tool or product to get feedback?",
    a: "Yes. Post it in the Showcase under Tools to test. Tick the boxes for what you want (comments, beta testers, adoption) and the community will engage. Showcase file uploads are available from Viber and up.",
  },
  {
    q: "How do events and pregames work?",
    a: "Events are listed on the Events page with RSVP limits and maps. Some events include presentations and short discussions for members. Watch the events page or subscribe to the newsletter to catch them early.",
  },
  {
    q: "What does it cost?",
    a: "Starter is free. Viber is a paid membership invoiced manually after you apply. Vibetor is application-based. Exact pricing and benefits are shown on the Get Going page.",
  },
  {
    q: "How do I get in touch before joining?",
    a: "Use the Contact page or email shipping@goodvibescafe.fi. You can also drop into the Forum once you have a Starter account.",
  },
];


const FOUNDER_NAMES = ["Minna Blomster", "Mirva Saarijärvi"];
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
      const { data } = await supabase.rpc("list_public_profiles");
      const all = (data ?? []) as unknown as { display_name: string | null; avatar_url: string | null; user_id: string; membership_tier: string | null; vibetor_type: string | null; company: string | null }[];
      return all.filter((p) => p.display_name && ALL_FOUNDER_NAMES.includes(p.display_name));
    },
    staleTime: 300_000,
  });

  const { data: vibetors } = useQuery({
    queryKey: ["vibetors-about"],
    queryFn: async () => {
      const { data } = await supabase.rpc("list_public_profiles");
      const all = (data ?? []) as unknown as { display_name: string | null; avatar_url: string | null; user_id: string; company: string | null; vibetor_type: string | null; membership_tier: string | null }[];
      return all.filter((p) => p.membership_tier === "vibetor");
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
  // Both founders are Vibetors by virtue of founding the collective
  const getFounderVibetorStatus = (_name: string) => true;

  return (
    <Layout>
      <PageMeta title="About — <Good Vibes Café/>" description="Two builders, one collective. Meet the founders behind <Good Vibes Café/> and our values." />
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
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[0, 1].map((i) => {
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

      {/* Two builders, one collective */}
      <section className="pb-20">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-8 md:p-12"
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em] text-center">
              Two builders. <span className="text-gradient-prism">One collective.</span>
            </h2>
            <div className="mt-8 space-y-5 text-muted-foreground font-body leading-relaxed">
              <p>
                We started {"<Good Vibes Café/>"} because we were tired of building alone. The best things happen when you combine complementary chaos, so we built a collective around it.
                <br />
                Good vibes. Real work. No corners cut.
              </p>
              <p>
                We believe smart speed and deep care aren't opposites. The best builders move fast because they have the right knowledge, the right people, and a community that fills the gaps they haven't filled yet. Not because they cut corners.
              </p>
              <p>
                Our goal is simple: a Nordic ecosystem where builders grow through shared knowledge and honest practice, and ship products that are user-first, legally sound, and built around a pain point worth solving.
              </p>
              <p className="font-semibold text-foreground">
                {"<Good Vibes Café/>"} is where that starts.
              </p>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              <div className="bg-background/60 border border-border rounded-xl p-5">
                <p className="font-display text-sm font-semibold text-turquoise tracking-widest uppercase mb-2">The problem</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  The best builders are still building alone. Not because they want to, because the right collective doesn't exist yet.
                </p>
              </div>
              <div className="bg-background/60 border border-border rounded-xl p-5">
                <p className="font-display text-sm font-semibold text-electric tracking-widest uppercase mb-2">The opportunity</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  A generation of vibecoders has the tools to build anything. What they're missing is the knowledge infrastructure, the network, and the community to ship it properly, and to market before the window closes.
                </p>
              </div>
            </div>

            <p className="mt-8 text-base text-foreground font-body leading-relaxed">
              {"<Good Vibes Café/>"} gives vibecoders the tools, community, and knowledge to build the next big thing. And ship it while the window is open, without cutting corners.
            </p>
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 border-l-4 border-primary pl-6 text-muted-foreground font-body italic leading-relaxed"
          >
            {"<Good Vibes Café/>"} is a Nordic builder collective for vibecoders, people who build fast, think in systems, and use AI as a co-founder. We exist to prove that smart speed and deep care aren't opposites. Through community membership, expert knowledge, and a high-trust network of connectors and investors, we give builders the infrastructure to find their leads, grow their skills, and ship products that are user-first, compliant, and built around a real pain point. We are not a startup accelerator, a job board, or a mentorship programme. We are the collective the next generation of Nordic builders builds through.
          </motion.blockquote>
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

          {/* Purpose, Vision, Mission, Values */}
          <div className="mt-16 grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                label: "Our purpose",
                text: "Prove that smart speed and deep care aren't opposites, and that the best builders never have to choose between moving fast and doing it right.",
                accent: "text-primary",
              },
              {
                icon: Eye,
                label: "Our vision",
                text: "A Nordic ecosystem where builders grow through shared knowledge, honest practice, and a collective that holds the skills you haven't developed yet.",
                accent: "text-turquoise",
              },
              {
                icon: Rocket,
                label: "Our mission",
                text: "We give vibecoders the tools, community, and knowledge to build the next big thing. And ship it while the window is open, without cutting corners.",
                accent: "text-electric",
              },
              {
                icon: Compass,
                label: "Our values",
                text: "Courage, Kindness, Curiosity, Authenticity. Not aspirational, just how we already behave.",
                accent: "text-vibetor",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={`h-6 w-6 ${item.accent}`} />
                    <h3 className="font-display text-lg font-bold tracking-[-0.01em]">{item.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{item.text}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Values anchor */}
          <div className="mt-12 bg-card border border-border rounded-2xl p-6 md:p-8">
            <p className="font-display text-sm font-semibold text-turquoise tracking-widest uppercase mb-2 text-center">Values anchor</p>
            <p className="text-sm text-muted-foreground font-body text-center mb-6">
              These four values are not aspirational. They describe how we already behave.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Sparkles, name: "Courage", desc: "We test, try, learn, and resolve. Publicly when we can." },
                { icon: Heart, name: "Kindness", desc: "We help first. We critique when it matters, and we do it with care." },
                { icon: Compass, name: "Curiosity", desc: "We chase what's next. We are interested in the future before it arrives." },
                { icon: Feather, name: "Authenticity", desc: "We let everyone be themselves. No performance required." },
              ].map((v) => {
                const Icon = v.icon;
                return (
                  <div key={v.name} className="flex gap-3 items-start bg-background/60 border border-border rounded-xl p-4">
                    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-display font-semibold tracking-[-0.01em]">{v.name}</p>
                      <p className="text-sm text-muted-foreground font-body mt-1 leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em]">
                Frequently asked <span className="text-gradient-prism">questions</span>
              </h2>
              <p className="mt-3 text-muted-foreground font-body max-w-xl mx-auto">
                How people join the collective, and what support you get once you are in.
              </p>
            </div>
            <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl px-2 md:px-4">
              {ABOUT_FAQS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="text-left font-display font-semibold tracking-[-0.01em] hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground font-body leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-12 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/community">{t("about.cta")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: ABOUT_FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
    </Layout>
  );
};

export default About;


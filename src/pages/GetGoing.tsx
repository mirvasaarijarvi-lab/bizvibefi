import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wrench, MessageCircle, BookOpen, Headphones, ExternalLink } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";

const toolIcons = [Wrench, MessageCircle, BookOpen, Headphones];

const GetGoing = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
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
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {toolIcons.map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-8 hover:border-electric/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-6 w-6 text-electric" />
                  <span className="text-xs font-body font-semibold text-electric bg-electric/10 px-3 py-1 rounded-full">{t(`getGoing.tools.${i}.tag`)}</span>
                </div>
                <h3 className="font-display text-xl font-bold tracking-[-0.01em]">{t(`getGoing.tools.${i}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-body">{t(`getGoing.tools.${i}.desc`)}</p>
                <Button variant="ghost" className="mt-4 p-0 text-electric hover:text-electric-light font-body text-sm">
                  {t("getGoing.explore")} <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Examples */}
      <section className="pb-20 md:pb-28">
        <div className="container">
          <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em] text-center mb-12">
            {t("getGoing.casesTitle")} <span className="text-gradient-prism">{t("getGoing.casesTitleHighlight")}</span>
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

          <div className="mt-16 text-center">
            <p className="text-muted-foreground font-body">{t("getGoing.blogSoon")}</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GetGoing;

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, Rocket, Zap, MessageCircle, Calendar, TrendingUp, GraduationCap, Handshake, ArrowRight } from "lucide-react";

const freeBenefits = [
  { icon: MessageCircle, title: "WhatsApp Community", desc: "Get guidance from experienced builders whenever you're stuck." },
  { icon: Calendar, title: "Free Events & Meetups", desc: "Meet likeminded people IRL and online. Network, learn, build." },
  { icon: Rocket, title: "#ShipHappens Hackathons", desc: "Build something real in 48 hours. No talk, just ship." },
  { icon: Users, title: "Builder Network", desc: "Connect with people who think like you — founders, devs, creators." },
];

const proBenefits = [
  { icon: TrendingUp, title: "Lead Generation", desc: "Access qualified leads and business opportunities from the network." },
  { icon: GraduationCap, title: "Courses & Workshops", desc: "Deep-dive sessions on building, selling, and scaling your ideas." },
  { icon: Handshake, title: "Investor Access", desc: "Events with investors and market players. Pitch, connect, fund." },
  { icon: MessageCircle, title: "Pro WhatsApp Group", desc: "Inner circle with leads, investors, and high-signal conversations." },
  { icon: Calendar, title: "Exclusive Events", desc: "Market-facing events, demo days, and investor meetups." },
];

const Community = () => (
  <Layout>
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">Community</p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
            Your <span className="text-gradient-storm">tribe</span> is here
          </h1>
          <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">
            Two levels. One mission. Build things that matter, together.
          </p>
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
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">Free Tier</h2>
              <p className="text-turquoise font-body font-semibold">€0 — jump right in</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {freeBenefits.map((b) => (
              <div key={b.title} className="bg-card border border-border rounded-xl p-6 hover:border-turquoise/40 transition-colors">
                <b.icon className="h-6 w-6 text-turquoise mb-4" />
                <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-body">{b.desc}</p>
              </div>
            ))}
          </div>
          <Button variant="heroOutline" size="lg" className="mt-8">
            Join Free <ArrowRight className="ml-2 h-4 w-4" />
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
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">Pro Tier</h2>
              <p className="text-purple-soft font-body font-semibold">Paid membership — everything in Free, plus:</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {proBenefits.map((b) => (
              <div key={b.title} className="bg-card border-2 border-purple-vivid/30 rounded-xl p-6 hover:border-purple-vivid/60 transition-colors">
                <b.icon className="h-6 w-6 text-purple-soft mb-4" />
                <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-body">{b.desc}</p>
              </div>
            ))}
          </div>
          <Button variant="hero" size="lg" className="mt-8">
            Go Pro <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  </Layout>
);

export default Community;

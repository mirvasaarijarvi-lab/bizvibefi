import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wrench, MessageCircle, BookOpen, Headphones, ArrowRight, ExternalLink } from "lucide-react";

const tools = [
  { icon: Wrench, title: "Builder Toolkit", desc: "Curated tools and templates to launch faster. From no-code to full-stack.", tag: "Tools" },
  { icon: MessageCircle, title: "WhatsApp Groups", desc: "Jump into the conversation. Get help, share wins, find collaborators.", tag: "Community" },
  { icon: BookOpen, title: "Case Examples", desc: "Real stories from collective members who shipped and grew.", tag: "Learn" },
  { icon: Headphones, title: "Support Channels", desc: "Need help? We've got channels for that. Coming soon.", tag: "Support" },
];

const caseExamples = [
  { title: "From idea to 1K users in 30 days", category: "SaaS", desc: "How a collective member used the toolkit and community to validate and launch." },
  { title: "Landing a €50K contract through the network", category: "Consulting", desc: "Lead gen + investor events turned a side project into a funded startup." },
  { title: "Building in public: a hackathon story", category: "#ShipHappens", desc: "48 hours, 3 builders, 1 shipped product. The power of the collective." },
];

const GetGoing = () => (
  <Layout>
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">Get Going</p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
            <span className="text-gradient-surge">Tools, help,</span> and momentum
          </h1>
          <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">
            Everything you need to start building and never stop.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Resources Grid */}
    <section className="pb-20">
      <div className="container">
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-8 hover:border-electric/40 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <t.icon className="h-6 w-6 text-electric" />
                <span className="text-xs font-body font-semibold text-electric bg-electric/10 px-3 py-1 rounded-full">{t.tag}</span>
              </div>
              <h3 className="font-display text-xl font-bold tracking-[-0.01em]">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground font-body">{t.desc}</p>
              <Button variant="ghost" className="mt-4 p-0 text-electric hover:text-electric-light font-body text-sm">
                Explore <ExternalLink className="ml-1 h-3 w-3" />
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
          From the <span className="text-gradient-prism">collective</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {caseExamples.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:glow-purple transition-all duration-300"
            >
              <span className="text-xs font-body font-semibold text-purple-soft bg-purple-vivid/10 px-3 py-1 rounded-full">
                {c.category}
              </span>
              <h3 className="font-display text-lg font-semibold tracking-[-0.01em] mt-4">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground font-body">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Blog placeholder */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground font-body">Blog & more resources coming soon.</p>
        </div>
      </div>
    </section>
  </Layout>
);

export default GetGoing;

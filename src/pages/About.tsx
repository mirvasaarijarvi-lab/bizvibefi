import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const founders = [
  { name: "Founder 1", role: "Builder", bio: "Shoots first, asks questions later. Full-stack chaos engine." },
  { name: "Founder 2", role: "Connector", bio: "Knows everyone. Builds bridges between ideas and people." },
  { name: "Founder 3", role: "Strategist", bio: "Turns vibes into pipelines. The one who makes it all stick." },
];

const About = () => (
  <Layout>
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">About</p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
            Three builders. <span className="text-gradient-prism">One collective.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto leading-relaxed">
            We started BizVibe because we were tired of building alone. The best things happen when 
            you combine complementary chaos — so we built a collective around it.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Team */}
    <section className="pb-20">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {founders.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-storm mx-auto mb-6 flex items-center justify-center">
                <span className="font-display text-3xl font-extrabold text-primary-foreground">
                  {f.name.split(" ")[1]}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold tracking-[-0.01em]">{f.name}</h3>
              <p className="text-turquoise font-body font-semibold text-sm mt-1">{f.role}</p>
              <p className="mt-3 text-sm text-muted-foreground font-body">{f.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="pb-20 md:pb-28">
      <div className="container max-w-3xl">
        <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em] text-center mb-12">
          What we <span className="text-gradient-storm">believe</span>
        </h2>
        <div className="space-y-6">
          {[
            { title: "Ship > Perfect", desc: "Done beats perfect. Every time. Get it out there, then iterate." },
            { title: "Fail Spectacularly", desc: "Small failures teach nothing. Go big, learn fast, pivot hard." },
            { title: "Build Together", desc: "Solo geniuses are a myth. The collective is the multiplier." },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6 items-start bg-card border border-border rounded-xl p-6"
            >
              <span className="font-display text-3xl font-extrabold text-gradient-prism">{i + 1}</span>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground font-body">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/community">Join the Collective <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default About;

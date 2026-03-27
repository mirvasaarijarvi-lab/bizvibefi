import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent!", description: "We'll get back to you soon." });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <Layout>
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">Contact</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              Let's <span className="text-gradient-surge">talk</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">
              Got an idea, question, or just want to say hi? We're all ears.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="bg-card border-border font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-card border-border font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-2 block">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={5}
                  required
                  className="bg-card border-border font-body"
                />
              </div>
              <Button variant="hero" size="lg" type="submit" className="w-full">
                Send Message
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-card border border-border rounded-xl p-6">
                <Mail className="h-6 w-6 text-electric mb-3" />
                <h3 className="font-display text-lg font-semibold">Email us</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">hello@bizvibe.co</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <MessageCircle className="h-6 w-6 text-turquoise mb-3" />
                <h3 className="font-display text-lg font-semibold">WhatsApp</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">Join our community group for instant access.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

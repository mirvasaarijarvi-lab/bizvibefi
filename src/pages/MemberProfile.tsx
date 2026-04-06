import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Building2, Linkedin, ExternalLink, Globe, Mail, Phone, ArrowLeft, MessageSquare, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link as RouterLink } from "react-router-dom";

interface Visibility {
  bio?: boolean;
  company?: boolean;
  linkedin_url?: boolean;
  contact_email?: boolean;
  contact_phone?: boolean;
  website_links?: boolean;
}

const defaultVisibility: Visibility = {
  bio: true,
  company: true,
  linkedin_url: true,
  contact_email: true,
  contact_phone: true,
  website_links: true,
};

const MemberProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("");

  const { data: member, isLoading } = useQuery({
    queryKey: ["member-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);

      const role = roles?.[0]?.role;

      return { ...data, role } as unknown as MemberData;
    },
    enabled: !!userId && !!user,
  });

  const { data: showcaseItems } = useQuery({
    queryKey: ["member-showcase", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_items")
        .select("id, title, description, type, image_url, category_tags")
        .eq("user_id", userId!)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId && !!user,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!member) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Member not found.</p>
        </div>
      </Layout>
    );
  }

  const vis: Visibility = { ...defaultVisibility, ...(member.profile_visibility ?? {}) };
  const isOwnProfile = user.id === member.user_id;

  const sendContactRequest = useMutation({
    mutationFn: async (msg: string) => {
      const { error } = await supabase.from("contact_requests").insert({
        from_user_id: user.id,
        to_user_id: member.user_id,
        message: msg,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Message sent!", description: `Your contact request has been sent to ${member.display_name || "this member"}.` });
      setContactOpen(false);
      setMessage("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const websiteLinks = Array.isArray(member.website_links) ? member.website_links : [];

  return (
    <Layout>
      <PageMeta
        title={`${member.display_name || "Member"} — BizVibe`}
        description={member.bio ? member.bio.slice(0, 155) : "BizVibe member profile."}
      />
      <section className="py-24 md:py-32">
        <div className="container max-w-2xl">
          <Link
            to="/members"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Members
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-8">
                {/* Header */}
                <div className="flex items-center gap-6 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={member.avatar_url ?? undefined} alt={member.display_name ?? "Member"} />
                    <AvatarFallback className="text-lg font-semibold">
                      {initials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-2xl font-bold">
                        {member.display_name || "Anonymous"}
                      </h1>
                      {member.role === "superadmin" && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                          SUPERADMIN
                        </Badge>
                      )}
                      {member.role === "admin" && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">ADMIN</Badge>
                      )}
                      {member.membership_tier === "vibetor" && member.role !== "superadmin" && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-vibetor/90 hover:bg-vibetor">VIBETOR</Badge>
                      )}
                      {member.membership_tier === "viber" && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">VIBER</Badge>
                      )}
                    </div>
                    {(vis.company || isOwnProfile) && member.company && (
                      <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Building2 className="h-4 w-4 shrink-0" />
                        {member.company}
                        {!vis.company && <Badge variant="outline" className="text-[9px] ml-1">Hidden</Badge>}
                      </p>
                    )}
                    {!isOwnProfile && (
                      <Button
                        size="sm"
                        className="mt-3 font-body gap-1.5 bg-gradient-storm"
                        onClick={() => setContactOpen(true)}
                      >
                        <MessageSquare className="h-4 w-4" /> Contact
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {(vis.bio || isOwnProfile) && member.bio && (
                  <div className="mb-6">
                    <p className="text-muted-foreground font-body leading-relaxed">
                      {member.bio}
                    </p>
                    {!vis.bio && <Badge variant="outline" className="text-[9px] mt-1">Hidden from others</Badge>}
                  </div>
                )}

                {/* Contact & Links */}
                <div className="space-y-3">
                  {(vis.contact_email || isOwnProfile) && member.contact_email && (
                    <a
                      href={`mailto:${member.contact_email}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <span>{member.contact_email}</span>
                      {!vis.contact_email && <Badge variant="outline" className="text-[9px] ml-1">Hidden</Badge>}
                    </a>
                  )}
                  {(vis.contact_phone || isOwnProfile) && member.contact_phone && (
                    <a
                      href={`tel:${member.contact_phone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{member.contact_phone}</span>
                      {!vis.contact_phone && <Badge variant="outline" className="text-[9px] ml-1">Hidden</Badge>}
                    </a>
                  )}
                  {(vis.linkedin_url || isOwnProfile) && member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline font-body"
                    >
                      <Linkedin className="h-4 w-4 shrink-0" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                      {!vis.linkedin_url && <Badge variant="outline" className="text-[9px] ml-1">Hidden</Badge>}
                    </a>
                  )}
                  {(vis.website_links || isOwnProfile) && websiteLinks.length > 0 && (
                    <div className="space-y-2">
                      {websiteLinks.map((link: { url: string; label?: string }, idx: number) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline font-body"
                        >
                          <Globe className="h-4 w-4 shrink-0" />
                          <span className="truncate">{link.label || link.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                      {!vis.website_links && <Badge variant="outline" className="text-[9px]">Hidden from others</Badge>}
                    </div>
                  )}
                </div>

                {/* Showcase */}
                {showcaseItems && showcaseItems.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h2 className="font-display text-lg font-bold mb-4">Showcase</h2>
                    <div className="grid gap-3">
                      {showcaseItems.map((item) => (
                        <Link
                          key={item.id}
                          to={`/showcase/${item.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors bg-muted/30"
                        >
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="h-12 w-20 object-cover rounded shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-display font-semibold text-sm truncate">{item.title}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize shrink-0">
                                {item.type?.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-body line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Joined */}
                <p className="text-xs text-muted-foreground font-body mt-8 pt-4 border-t border-border">
                  Member since {new Date(member.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Contact Request Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Contact {member.display_name || "Member"}</DialogTitle>
            <DialogDescription className="font-body">
              Send a message to introduce yourself or start a conversation. They'll see your name and profile.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! I'd love to connect about..."
            className="font-body min-h-[100px]"
            maxLength={1000}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setContactOpen(false)} className="font-body">Cancel</Button>
            <Button
              onClick={() => sendContactRequest.mutate(message.trim())}
              disabled={!message.trim() || sendContactRequest.isPending}
              className="font-body gap-1.5 bg-gradient-storm"
            >
              <Send className="h-4 w-4" /> {sendContactRequest.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MemberProfile;

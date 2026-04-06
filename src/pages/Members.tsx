import { useState } from "react";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, Linkedin, Building2, ExternalLink, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemberProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  linkedin_url: string | null;
  membership_tier: "starter" | "viber" | "vibetor";
  created_at: string;
}

type TierFilter = "all" | "starter" | "viber" | "vibetor";
type SortOption = "newest" | "alphabetical";

const Members = () => {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const updateTierMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: "starter" | "viber" | "vibetor" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ membership_tier: tier } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Membership tier updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, bio, company, linkedin_url, membership_tier, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    },
    enabled: !!user,
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const filtered = members
    ?.filter((m) => {
      if (tierFilter !== "all" && m.membership_tier !== tierFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.display_name?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q) ||
        m.bio?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        return (a.display_name ?? "").localeCompare(b.display_name ?? "");
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <PageMeta
        title="Members Directory — BizVibe"
        description="Discover and connect with fellow BizVibe members. Browse profiles, find collaborators, and grow your network."
      />
      <section className="py-24 md:py-32">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">
              Directory
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              Meet the <span className="text-gradient-storm">Members</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">
              Discover builders, strategists, and connectors in the BizVibe collective.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or bio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as TierFilter)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="viber">Viber</SelectItem>
                <SelectItem value="vibetor">Vibetor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="alphabetical">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-12 mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={member.avatar_url ?? undefined} alt={member.display_name ?? "Member"} />
                          <AvatarFallback className="text-sm font-semibold">
                            {initials(member.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold truncate">
                              {member.display_name || "Anonymous"}
                            </h3>
                            {member.membership_tier === "viber" && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                VIBER
                              </Badge>
                            )}
                            {member.membership_tier === "vibetor" && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-amber-500/90 hover:bg-amber-500">
                                VIBETOR
                              </Badge>
                            )}
                          </div>
                          {member.company && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                              <Building2 className="h-3 w-3 shrink-0" />
                              {member.company}
                            </p>
                          )}
                        </div>
                      </div>

                      {member.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {member.bio}
                        </p>
                      )}

                      {member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search || tierFilter !== "all" ? "No members match your filters." : "No members yet."}
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Members;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import mascotForum from "@/assets/mascot-forum.png";
import { MessageSquare, Lock, Crown, Gem, Search, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  sort_order: number;
  min_tier: "starter" | "viber" | "vibetor";
  created_at: string;
}

type SortOption = "newest" | "active";

const Forum = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as ForumCategory[];
    },
  });

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["forum-all-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_topics")
        .select("id, title, content, category_id, user_id, created_at, last_reply_at, reply_count, is_pinned, is_approved")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const categoryMap = useMemo(() => {
    const m = new Map<string, ForumCategory>();
    categories?.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    const q = search.trim().toLowerCase();
    let list = topics.filter((t) => {
      if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.content?.toLowerCase().includes(q) ?? false)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "active") {
        if (b.reply_count !== a.reply_count) return b.reply_count - a.reply_count;
        const aT = a.last_reply_at ?? a.created_at;
        const bT = b.last_reply_at ?? b.created_at;
        return new Date(bT).getTime() - new Date(aT).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [topics, search, categoryFilter, sort]);

  return (
    <Layout>
      <PageMeta
        title="Forum — BizVibe"
        description="Join the BizVibe community forum. Share ideas, ask questions, and connect with fellow builders."
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <HeroAvatar src={mascotForum} alt="BizVibe forum mascot" />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Community Forum</h1>
              <p className="text-muted-foreground font-body mt-1">
                Share, discuss, and build together
              </p>
            </div>
            {!user && (
              <Button asChild className="bg-gradient-storm hover:opacity-90 font-body">
                <Link to="/auth">Sign in to post</Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/forum/${category.slug}`}
                  className={`block bg-card border rounded-xl p-5 hover:border-primary/40 transition-colors group ${
                    category.min_tier === "vibetor"
                      ? "border-vibetor/30 hover:border-vibetor/60"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-lg transition-colors ${
                        category.min_tier === "vibetor"
                          ? "bg-vibetor/10 group-hover:bg-vibetor/20"
                          : "bg-muted group-hover:bg-primary/10"
                      }`}>
                        {category.min_tier === "vibetor" ? (
                          <Gem className="h-5 w-5 text-vibetor" />
                        ) : category.min_tier === "viber" ? (
                          <Crown className="h-5 w-5 text-primary" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        )}
                      </div>
                      <div>
                        <h2 className={`font-display font-semibold transition-colors flex items-center gap-2 ${
                          category.min_tier === "vibetor"
                            ? "text-foreground group-hover:text-vibetor"
                            : "text-foreground group-hover:text-primary"
                        }`}>
                          {category.name}
                          {category.min_tier === "viber" && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">
                              VIBER
                            </span>
                          )}
                          {category.min_tier === "vibetor" && (
                            <span className="text-xs bg-vibetor/10 text-vibetor px-2 py-0.5 rounded-full font-body">
                              VIBETOR
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-muted-foreground font-body mt-0.5">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    {!user && (category.min_tier === "viber" || category.min_tier === "vibetor") && (
                      <Lock className="h-4 w-4 text-muted-foreground mt-2" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Browse Discussions
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search threads..."
                  className="pl-9 font-body"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-48 font-body">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="sm:w-44 font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="active">Most active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {topicsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-body text-sm">
                  No discussions match your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTopics.map((topic) => {
                  const cat = categoryMap.get(topic.category_id);
                  return (
                    <Link
                      key={topic.id}
                      to={cat ? `/forum/${cat.slug}/${topic.id}` : "#"}
                      className="block bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {topic.is_pinned && (
                              <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            )}
                            <h3 className="font-display font-semibold text-foreground truncate">
                              {topic.title}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground font-body">
                            {cat && (
                              <span className="px-2 py-0.5 rounded-full bg-muted">
                                {cat.name}
                              </span>
                            )}
                            <span>
                              {formatDistanceToNow(
                                new Date(topic.last_reply_at ?? topic.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-body shrink-0">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {topic.reply_count}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Forum;

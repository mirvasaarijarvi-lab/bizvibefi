import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import mascotForum from "@/assets/mascot-forum.png";
import { MessageSquare, Lock, Crown, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  sort_order: number;
  min_tier: "starter" | "viber" | "vibetor";
  created_at: string;
}

const Forum = () => {
  const { user } = useAuth();

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

  return (
    <Layout>
      <PageMeta
        title="Forum — BizVibe"
        description="Join the BizVibe community forum. Share ideas, ask questions, and connect with fellow builders."
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
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
        </div>
      </section>
    </Layout>
  );
};

export default Forum;

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  RECRUITMENT_TYPE_LABELS,
  useMyRecruitmentPosts,
  useRecruitmentPosts,
  useDeleteRecruitmentPost,
  type RecruitmentPost,
  type RecruitmentPostType,
} from "@/hooks/useRecruitment";
import RecruitmentPostCard from "./RecruitmentPostCard";
import RecruitmentPostDialog from "./RecruitmentPostDialog";
import { Plus, Search, Pencil, Trash2, Briefcase } from "lucide-react";

const TABS: Array<{ value: RecruitmentPostType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "open_position", label: "Open positions" },
  { value: "training", label: "Training to jobs" },
  { value: "seeking_work", label: "Seeking employment" },
];

const RecruitmentSection = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<RecruitmentPostType | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecruitmentPost | null>(null);

  const { data: posts, isLoading } = useRecruitmentPosts(tab);
  const { data: myPosts } = useMyRecruitmentPosts();
  const deletePost = useDeleteRecruitmentPost();

  const { data: authors } = useQuery({
    queryKey: ["recruitment-authors", posts?.map((p) => p.user_id).join(",")],
    queryFn: async () => {
      const ids = [...new Set((posts ?? []).map((p) => p.user_id))];
      if (!ids.length) return {} as Record<string, string>;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      return Object.fromEntries(
        (data ?? []).map((p) => [p.user_id, p.display_name ?? ""])
      ) as Record<string, string>;
    },
    enabled: !!posts?.length,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts ?? [];
    return (posts ?? []).filter((p) =>
      [p.title, p.description, p.organization, p.location, ...(p.tags ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [posts, search]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <section id="recruitment" className="pb-20 md:pb-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-10"
        >
          <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">
            Recruitment
          </p>
          <h2 className="font-display text-2xl md:text-4xl font-bold tracking-[-0.02em]">
            Jobs, training and <span className="text-gradient-prism">talent</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-body">
            Open positions, recruitment training that leads to work, and members available for
            hire. Show your AI and vibecoding skills on your profile and get found.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {user ? (
              <Button variant="hero" onClick={openNew} className="font-body">
                <Plus className="mr-1 h-4 w-4" /> Create a post
              </Button>
            ) : (
              <Button variant="hero" asChild className="font-body">
                <Link to="/auth">Sign in to post</Link>
              </Button>
            )}
            <Button variant="heroOutline" asChild className="font-body">
              <Link to="/profile">Add your skills</Link>
            </Button>
          </div>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as RecruitmentPostType | "all")}>
              <TabsList className="flex flex-wrap h-auto">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recruitment posts"
                aria-label="Search recruitment posts"
                className="pl-9 font-body"
              />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-body">
                No recruitment posts here yet. Be the first to post one.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((post) => (
              <RecruitmentPostCard
                key={post.id}
                post={post}
                authorName={authors?.[post.user_id] || null}
              />
            ))}
          </div>

          {user && myPosts && myPosts.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <h3 className="font-display text-xl font-bold mb-4">Your posts</h3>
              <div className="space-y-3">
                {myPosts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-body font-semibold truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {RECRUITMENT_TYPE_LABELS[p.type]}
                        {p.rejection_reason ? ` — ${p.rejection_reason}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        p.status === "approved"
                          ? "default"
                          : p.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className="font-body text-[11px]"
                    >
                      {p.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Edit post"
                      onClick={() => {
                        setEditing(p);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete post"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deletePost.mutate(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <RecruitmentPostDialog open={dialogOpen} onOpenChange={setDialogOpen} post={editing} />
    </section>
  );
};

export default RecruitmentSection;

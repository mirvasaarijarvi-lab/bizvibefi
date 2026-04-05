import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pin, Lock, MessageSquare, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface TopicWithAuthor {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ForumCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: category } = useQuery({
    queryKey: ["forum-category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: topics, isLoading } = useQuery({
    queryKey: ["forum-topics", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_topics")
        .select("*, profiles(display_name, avatar_url)")
        .eq("category_id", category!.id)
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TopicWithAuthor[];
    },
    enabled: !!category?.id,
  });

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("forum_topics").insert({
        category_id: category.id,
        user_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
      });
      if (error) throw error;
      setNewTitle("");
      setNewContent("");
      setShowNewTopic(false);
      queryClient.invalidateQueries({ queryKey: ["forum-topics", category.id] });
      toast({ title: "Topic created!" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create topic";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageMeta
        title={`${category?.name ?? "Forum"} — BizVibe`}
        description={category?.description ?? "BizVibe community forum"}
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Forum
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">{category?.name}</h1>
            {user && (
              <Button
                onClick={() => setShowNewTopic(!showNewTopic)}
                className="bg-gradient-storm hover:opacity-90 font-body"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> New Topic
              </Button>
            )}
          </div>

          {showNewTopic && (
            <form onSubmit={handleCreateTopic} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
              <Input
                placeholder="Topic title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                maxLength={200}
                className="font-body"
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
                maxLength={5000}
                rows={4}
                className="font-body"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="bg-gradient-storm font-body" disabled={submitting}>
                  {submitting ? "Posting..." : "Post Topic"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewTopic(false)} className="font-body">
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : topics?.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body">No topics yet. Be the first to start a discussion!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topics?.map((topic) => (
                <Link
                  key={topic.id}
                  to={`/forum/${slug}/${topic.id}`}
                  className="block bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 mt-0.5">
                      <AvatarImage src={topic.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-muted text-xs font-display">
                        {topic.profiles?.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {topic.is_pinned && <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                        {topic.is_locked && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                        <h3 className="font-display font-semibold text-foreground truncate">{topic.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                        <span>{topic.profiles?.display_name || "Anonymous"}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {topic.reply_count}
                        </span>
                      </div>
                    </div>
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

export default ForumCategory;

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Profile } from "@/hooks/useProfile";

interface ReplyWithProfile {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: Pick<Profile, "display_name" | "avatar_url">;
}

const ForumTopic = () => {
  const { slug, topicId } = useParams<{ slug: string; topicId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: topic } = useQuery({
    queryKey: ["forum-topic", topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_topics")
        .select("*")
        .eq("id", topicId!)
        .single();
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", data.user_id)
        .single();

      return { ...data, profile };
    },
    enabled: !!topicId,
  });

  const { data: replies, isLoading } = useQuery({
    queryKey: ["forum-replies", topicId],
    queryFn: async () => {
      const { data: repliesData, error } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("topic_id", topicId!)
        .order("created_at");
      if (error) throw error;

      const userIds = [...new Set(repliesData.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return repliesData.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id),
      })) as ReplyWithProfile[];
    },
    enabled: !!topicId,
  });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topicId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("forum_replies").insert({
        topic_id: topicId,
        user_id: user.id,
        content: replyContent.trim(),
      });
      if (error) throw error;
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["forum-replies", topicId] });
      queryClient.invalidateQueries({ queryKey: ["forum-topic", topicId] });
      toast({ title: "Reply posted!" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to post reply";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageMeta
        title={`${topic?.title ?? "Topic"} — BizVibe Forum`}
        description={topic?.content?.slice(0, 160) ?? "BizVibe community discussion"}
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={`/forum/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to topics
          </Link>

          {topic && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground mb-4">{topic.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={topic.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-muted text-xs font-display">
                    {topic.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-body">
                  <span className="font-medium text-foreground">{topic.profile?.display_name || "Anonymous"}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <p className="text-foreground font-body whitespace-pre-wrap">{topic.content}</p>
            </div>
          )}

          {/* Replies */}
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {replies?.length ?? 0} {(replies?.length ?? 0) === 1 ? "Reply" : "Replies"}
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {replies?.map((reply) => (
                  <div key={reply.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={reply.profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-muted text-xs font-display">
                          {reply.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-body">
                        <span className="font-medium text-foreground">{reply.profile?.display_name || "Anonymous"}</span>
                        <span className="text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <p className="text-foreground font-body whitespace-pre-wrap pl-10">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply form */}
          {user && !topic?.is_locked ? (
            <form onSubmit={handleReply} className="bg-card border border-border rounded-xl p-4">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
                maxLength={5000}
                rows={3}
                className="font-body mb-3"
              />
              <Button type="submit" size="sm" className="bg-gradient-storm font-body" disabled={submitting}>
                <Send className="h-4 w-4 mr-1" />
                {submitting ? "Posting..." : "Reply"}
              </Button>
            </form>
          ) : !user ? (
            <div className="text-center py-6 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground font-body mb-3">Sign in to reply</p>
              <Button asChild size="sm" className="bg-gradient-storm font-body">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
};

export default ForumTopic;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pin, Lock, MessageSquare, ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Profile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";

const LEAD_PREFIX = "<!--LEAD_JSON-->";

const isLeadCategory = (slug: string | undefined) =>
  slug === "leads" || slug === "leads-opportunities";

interface LeadFormData {
  customer_name: string;
  use_case: string;
  timeline: string;
  budget: string;
  industry: string;
  contact_person: string;
  contact_email: string;
  priority: string;
  notes: string;
}

const emptyLead: LeadFormData = {
  customer_name: "",
  use_case: "",
  timeline: "",
  budget: "",
  industry: "",
  contact_person: "",
  contact_email: "",
  priority: "medium",
  notes: "",
};

export const parseLeadContent = (content: string): LeadFormData | null => {
  if (!content.startsWith(LEAD_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(LEAD_PREFIX.length));
  } catch {
    return null;
  }
};

const serializeLeadContent = (data: LeadFormData): string =>
  LEAD_PREFIX + JSON.stringify(data);

const ForumCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormData>(emptyLead);

  const isLead = isLeadCategory(slug);

  const { data: category } = useQuery({
    queryKey: ["forum-category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const requiresApproval = (category as Record<string, unknown> | undefined)?.requires_approval === true;

  const { data: topics, isLoading } = useQuery({
    queryKey: ["forum-topics", category?.id],
    queryFn: async () => {
      const { data: topicsData, error } = await supabase
        .from("forum_topics")
        .select("*")
        .eq("category_id", category!.id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(topicsData.map((t) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return topicsData.map((t) => ({
        ...t,
        profile: profileMap.get(t.user_id) as Pick<Profile, "display_name" | "avatar_url"> | undefined,
      }));
    },
    enabled: !!category?.id,
  });

  const approveMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from("forum_topics")
        .update({ is_approved: true } as never)
        .eq("id", topicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-topics", category?.id] });
      toast({ title: "Lead approved!" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from("forum_topics")
        .delete()
        .eq("id", topicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-topics", category?.id] });
      toast({ title: "Lead rejected and removed." });
    },
  });

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category) return;
    setSubmitting(true);
    try {
      let title: string;
      let content: string;

      if (isLead) {
        title = leadForm.customer_name.trim() || "Untitled Lead";
        content = serializeLeadContent(leadForm);
      } else {
        title = newTitle.trim();
        content = newContent.trim();
      }

      const insertData: Record<string, unknown> = {
        category_id: category.id,
        user_id: user.id,
        title,
        content,
      };
      if (requiresApproval && !isAdmin) {
        insertData.is_approved = false;
      }
      const { error } = await supabase.from("forum_topics").insert(insertData as never);
      if (error) throw error;
      setNewTitle("");
      setNewContent("");
      setLeadForm(emptyLead);
      setShowNewTopic(false);
      queryClient.invalidateQueries({ queryKey: ["forum-topics", category.id] });
      toast({
        title: requiresApproval && !isAdmin
          ? "Lead submitted for approval!"
          : isLead ? "Lead created!" : "Topic created!",
        description: requiresApproval && !isAdmin
          ? "An admin will review your submission before it becomes visible."
          : undefined,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create topic";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const setLead = (field: keyof LeadFormData, value: string) =>
    setLeadForm((prev) => ({ ...prev, [field]: value }));

  const renderLeadForm = () => (
    <form onSubmit={handleCreateTopic} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-body text-sm">Customer / Company Name *</Label>
          <Input
            value={leadForm.customer_name}
            onChange={(e) => setLead("customer_name", e.target.value)}
            required
            maxLength={200}
            placeholder="Acme Corp"
            className="font-body"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-sm">Industry</Label>
          <Input
            value={leadForm.industry}
            onChange={(e) => setLead("industry", e.target.value)}
            maxLength={100}
            placeholder="e.g. SaaS, Healthcare, Retail"
            className="font-body"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-body text-sm">Use Case / Opportunity *</Label>
        <Textarea
          value={leadForm.use_case}
          onChange={(e) => setLead("use_case", e.target.value)}
          required
          maxLength={2000}
          rows={3}
          placeholder="Describe the opportunity, what they need, and how the community could help..."
          className="font-body"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="font-body text-sm">Timeline</Label>
          <Input
            value={leadForm.timeline}
            onChange={(e) => setLead("timeline", e.target.value)}
            maxLength={100}
            placeholder="e.g. Q2 2026, ASAP, 3 months"
            className="font-body"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-sm">Budget</Label>
          <Input
            value={leadForm.budget}
            onChange={(e) => setLead("budget", e.target.value)}
            maxLength={100}
            placeholder="e.g. €10k–€25k, TBD"
            className="font-body"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-sm">Priority</Label>
          <Select value={leadForm.priority} onValueChange={(v) => setLead("priority", v)}>
            <SelectTrigger className="font-body">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-body text-sm">Contact Person</Label>
          <Input
            value={leadForm.contact_person}
            onChange={(e) => setLead("contact_person", e.target.value)}
            maxLength={100}
            placeholder="Jane Doe"
            className="font-body"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-sm">Contact Email</Label>
          <Input
            type="email"
            value={leadForm.contact_email}
            onChange={(e) => setLead("contact_email", e.target.value)}
            maxLength={200}
            placeholder="jane@acme.com"
            className="font-body"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-body text-sm">Additional Notes</Label>
        <Textarea
          value={leadForm.notes}
          onChange={(e) => setLead("notes", e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Any extra context, requirements, or links..."
          className="font-body"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-gradient-storm font-body" disabled={submitting}>
          {submitting ? "Submitting..." : requiresApproval && !isAdmin ? "Submit for Approval" : "Post Lead"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewTopic(false)} className="font-body">
          Cancel
        </Button>
      </div>
    </form>
  );

  const renderTopicPreview = (topic: { content: string }) => {
    const lead = parseLeadContent(topic.content);
    if (!lead) return null;
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground font-body">
        {lead.industry && <span>🏢 {lead.industry}</span>}
        {lead.budget && <span>💰 {lead.budget}</span>}
        {lead.timeline && <span>📅 {lead.timeline}</span>}
        {lead.priority && lead.priority !== "medium" && (
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${
              lead.priority === "urgent"
                ? "border-destructive text-destructive"
                : lead.priority === "high"
                ? "border-vibetor text-vibetor"
                : "border-muted-foreground"
            }`}
          >
            {lead.priority.toUpperCase()}
          </Badge>
        )}
      </div>
    );
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
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{category?.name}</h1>
              {requiresApproval && (
                <p className="text-xs text-muted-foreground font-body mt-1">
                  Posts in this section require admin approval before becoming visible.
                </p>
              )}
            </div>
            {user && (
              <Button
                onClick={() => setShowNewTopic(!showNewTopic)}
                className="bg-gradient-storm hover:opacity-90 font-body"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> {isLead ? "Submit Lead" : requiresApproval ? "Submit Lead" : "New Topic"}
              </Button>
            )}
          </div>

          {showNewTopic && (
            isLead ? renderLeadForm() : (
              <form onSubmit={handleCreateTopic} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
                <Input
                  placeholder={requiresApproval ? "Lead title" : "Topic title"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  maxLength={200}
                  className="font-body"
                />
                <Textarea
                  placeholder={requiresApproval ? "Describe the lead..." : "What's on your mind?"}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                  maxLength={5000}
                  rows={4}
                  className="font-body"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="bg-gradient-storm font-body" disabled={submitting}>
                    {submitting ? "Posting..." : requiresApproval ? "Submit for Approval" : "Post Topic"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewTopic(false)} className="font-body">
                    Cancel
                  </Button>
                </div>
              </form>
            )
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : topics?.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body">
                {isLead || requiresApproval ? "No leads yet. Be the first to submit one!" : "No topics yet. Be the first to start a discussion!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {topics?.map((topic) => {
                const topicApproved = (topic as Record<string, unknown>).is_approved !== false;
                const isOwn = topic.user_id === user?.id;
                const pendingForUser = !topicApproved && isOwn && !isAdmin;
                const pendingForAdmin = !topicApproved && isAdmin;

                return (
                  <div key={topic.id} className={`bg-card border rounded-xl p-4 transition-colors ${
                    !topicApproved ? "border-vibetor/30" : "border-border hover:border-primary/40"
                  }`}>
                    <Link
                      to={topicApproved || isAdmin ? `/forum/${slug}/${topic.id}` : "#"}
                      className={`block ${!topicApproved && !isAdmin ? "pointer-events-none" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 mt-0.5">
                          <AvatarImage src={topic.profile?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-muted text-xs font-display">
                            {topic.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {topic.is_pinned && <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                            {topic.is_locked && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                            <h3 className="font-display font-semibold text-foreground truncate">{topic.title}</h3>
                            {pendingForUser && (
                              <Badge variant="outline" className="text-vibetor border-vibetor/30 text-xs gap-1">
                                <Clock className="h-3 w-3" /> Pending
                              </Badge>
                            )}
                            {pendingForAdmin && (
                              <Badge variant="outline" className="text-vibetor border-vibetor/30 text-xs gap-1">
                                <Clock className="h-3 w-3" /> Needs Approval
                              </Badge>
                            )}
                          </div>
                          {isLead && renderTopicPreview(topic)}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                            <span>{topic.profile?.display_name || "Anonymous"}</span>
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
                    {pendingForAdmin && (
                      <div className="flex gap-2 mt-3 ml-12">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 font-body gap-1"
                          onClick={() => approveMutation.mutate(topic.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 font-body gap-1"
                          onClick={() => rejectMutation.mutate(topic.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ForumCategory;

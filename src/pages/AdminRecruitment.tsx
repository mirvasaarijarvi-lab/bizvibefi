import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { useToast } from "@/hooks/use-toast";
import {
  RECRUITMENT_TYPE_LABELS,
  useAllRecruitmentPosts,
  useModerateRecruitmentPost,
  type RecruitmentPost,
} from "@/hooks/useRecruitment";
import { Check, X, MapPin, Globe, Mail, ExternalLink } from "lucide-react";

const AdminRecruitment = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [tab, setTab] = useState("pending");
  const [rejecting, setRejecting] = useState<RecruitmentPost | null>(null);
  const [reason, setReason] = useState("");

  const { data: posts, isLoading } = useAllRecruitmentPosts(!!user && isAdmin);
  const moderate = useModerateRecruitmentPost();

  const visible = useMemo(
    () => (tab === "all" ? posts ?? [] : (posts ?? []).filter((p) => p.status === tab)),
    [posts, tab]
  );

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const approve = async (p: RecruitmentPost) => {
    try {
      await moderate.mutateAsync({ id: p.id, status: "approved", rejection_reason: null });
      toast({ title: "Post approved" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed",
        variant: "destructive",
      });
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    try {
      await moderate.mutateAsync({
        id: rejecting.id,
        status: "rejected",
        rejection_reason: reason.trim() || null,
      });
      toast({ title: "Post rejected" });
      setRejecting(null);
      setReason("");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed",
        variant: "destructive",
      });
    }
  };

  const pendingCount = (posts ?? []).filter((p) => p.status === "pending").length;

  return (
    <Layout>
      <PageMeta
        title="Recruitment Moderation — Good Vibes Café"
        description="Review, approve, or reject recruitment board submissions: open positions, training programs, and members seeking employment."
      />
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">
              Admin
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-[-0.03em]">
              Recruitment Moderation
            </h1>
            <p className="mt-4 text-muted-foreground font-body">
              Approve or reject recruitment board submissions before they go public.
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-8 flex flex-wrap h-auto">
              <TabsTrigger value="pending">Pending {pendingCount ? `(${pendingCount})` : ""}</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {!isLoading && visible.length === 0 && (
                <p className="text-center text-muted-foreground font-body py-16">
                  Nothing here.
                </p>
              )}
              <div className="space-y-4">
                {visible.map((p) => (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="secondary" className="font-body text-xs">
                        {RECRUITMENT_TYPE_LABELS[p.type]}
                      </Badge>
                      <Badge
                        variant={
                          p.status === "approved"
                            ? "default"
                            : p.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                        className="font-body text-xs"
                      >
                        {p.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-body ml-auto">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold break-words">{p.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground font-body">
                      {p.organization && <span>{p.organization}</span>}
                      {p.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {p.location}
                        </span>
                      )}
                      {p.is_remote && (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" /> Remote
                        </span>
                      )}
                      {p.employment_type && <span>{p.employment_type}</span>}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground font-body whitespace-pre-line break-words">
                      {p.description}
                    </p>
                    {p.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="outline" className="font-body text-[11px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-body">
                      {p.apply_url && (
                        <a
                          href={p.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> {p.apply_url}
                        </a>
                      )}
                      {p.apply_email && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground break-all">
                          <Mail className="h-3.5 w-3.5" /> {p.apply_email}
                        </span>
                      )}
                    </div>
                    {p.rejection_reason && (
                      <p className="mt-3 text-sm text-destructive font-body">
                        Rejection reason: {p.rejection_reason}
                      </p>
                    )}
                    <div className="mt-5 pt-4 border-t border-border flex gap-2">
                      {p.status !== "approved" && (
                        <Button size="sm" className="font-body" onClick={() => approve(p)}>
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                      )}
                      {p.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-body"
                          onClick={() => {
                            setRejecting(p);
                            setReason("");
                          }}
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Reject post</DialogTitle>
            <DialogDescription className="font-body">
              The reason is shown to the member on their own posts list.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            className="font-body"
            placeholder="Why is this post rejected?"
          />
          <DialogFooter>
            <Button variant="outline" className="font-body" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="font-body" onClick={confirmReject}>
              Reject post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminRecruitment;

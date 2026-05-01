import { useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { useAllPendingClaims, useAdminReviewClaim } from "@/hooks/useBadges";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BadgePill from "@/components/BadgePill";
import { CheckCircle2, XCircle, ShieldCheck, Clock, Users } from "lucide-react";

const AdminBadges = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: claims, isLoading } = useAllPendingClaims();
  const review = useAdminReviewClaim();
  const [reason, setReason] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <Layout>
      <PageMeta title="Admin — Badge Claims" description="Review and approve member badge claims." />
      <section className="py-24 md:py-32">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-2 mb-8">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-[-0.02em]">Badge Claims</h1>
          </div>

          {isLoading ? (
            <div className="text-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
          ) : !claims || claims.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending claims.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4 flex-wrap">
                      {c.badge && <BadgePill badge={c.badge} size="md" />}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{c.badge?.name}</p>
                          <Badge variant="outline" className={c.status === "pending_peer" ? "text-vibetor border-vibetor/30" : "text-primary border-primary/30"}>
                            {c.status === "pending_peer" ? <><Users className="h-3 w-3 mr-1" />Awaiting peer</> : <><Clock className="h-3 w-3 mr-1" />Awaiting review</>}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          By <strong>{c.claimant?.display_name ?? c.user_id.slice(0, 8)}</strong>
                          {c.peer && <> · Peer: <strong>{c.peer.display_name ?? "?"}</strong>{c.peer_confirmed === true && <CheckCircle2 className="inline h-3 w-3 ml-1 text-primary" />}</>}
                        </p>
                        <p className="text-sm mt-2 whitespace-pre-wrap">{c.evidence}</p>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={openId === c.id} onOpenChange={(o) => { setOpenId(o ? c.id : null); if (!o) setReason(""); }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4 mr-1" />Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Reject claim</DialogTitle></DialogHeader>
                            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to claimant)" rows={3} />
                            <Button onClick={() => { review.mutate({ claimId: c.id, status: "rejected", reason }, { onSuccess: () => { setOpenId(null); setReason(""); } }); }} disabled={!reason.trim()}>
                              Confirm reject
                            </Button>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          disabled={c.status === "pending_peer" && c.peer_confirmed !== true}
                          onClick={() => review.mutate({ claimId: c.id, status: "approved" })}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminBadges;

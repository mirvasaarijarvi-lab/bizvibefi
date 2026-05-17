import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import {
  useBadgeCatalog, useMyBadges, useMyClaims, usePeerClaims,
  useCreateClaim, usePeerRespond, type BadgeDef,
} from "@/hooks/useBadges";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BadgePill from "@/components/BadgePill";
import AddToLinkedInButton from "@/components/AddToLinkedInButton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, XCircle, Clock, Users as UsersIcon, Search } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const BadgesPage = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { data: catalog } = useBadgeCatalog();
  const { data: myBadges } = useMyBadges();
  const { data: myClaims } = useMyClaims();
  const { data: peerClaims } = usePeerClaims();
  const createClaim = useCreateClaim();
  const peerRespond = usePeerRespond();

  const [search, setSearch] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);
  const [evidence, setEvidence] = useState("");
  const [peerId, setPeerId] = useState<string>("");

  const { data: members } = useQuery({
    queryKey: ["members-min"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_public_profiles");
      if (error) throw error;
      return ((data ?? []) as unknown as { user_id: string; display_name: string | null }[])
        .slice()
        .sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""));
    },
    enabled: !!user,
  });

  const ownedIds = useMemo(() => new Set((myBadges ?? []).map((b) => b.badge_id)), [myBadges]);

  const grouped = useMemo(() => {
    if (!catalog) return [];
    const filtered = catalog.filter((b) =>
      !search ? true : b.name.toLowerCase().includes(search.toLowerCase()) || b.category.includes(search.toLowerCase()),
    );
    const map = new Map<string, BadgeDef[]>();
    for (const b of filtered) {
      const key = b.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries());
  }, [catalog, search]);

  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;

  const submit = () => {
    if (!selectedBadge) return;
    createClaim.mutate(
      {
        badge_id: selectedBadge.id,
        evidence,
        peer_user_id: selectedBadge.requires_peer ? peerId || null : null,
        requires_peer: selectedBadge.requires_peer,
      },
      {
        onSuccess: () => {
          setSelectedBadge(null);
          setEvidence("");
          setPeerId("");
        },
      },
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
      pending_peer: { label: t("badges.status.pendingPeer"), className: "bg-vibetor/15 text-vibetor border-vibetor/30", Icon: UsersIcon },
      pending_review: { label: t("badges.status.pendingReview"), className: "bg-primary/10 text-primary border-primary/30", Icon: Clock },
      approved: { label: t("badges.status.approved"), className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30", Icon: CheckCircle2 },
      rejected: { label: t("badges.status.rejected"), className: "bg-destructive/15 text-destructive border-destructive/30", Icon: XCircle },
    };
    const cfg = map[status];
    if (!cfg) return null;
    const { Icon } = cfg;
    return (
      <Badge variant="outline" className={cfg.className}>
        <Icon className="h-3 w-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <PageMeta title={`${t("badges.pageTitle")} — GoodVibesCafe`} description={t("badges.pageDesc")} />
      <section className="py-24 md:py-32">
        <div className="container max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">
              {t("badges.tag")}
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              {t("badges.title")} <span className="text-gradient-storm">{t("badges.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">
              {t("badges.subtitle")}
            </p>
          </div>

          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="mb-8 flex flex-wrap h-auto">
              <TabsTrigger value="catalog">{t("badges.tabs.catalog")}</TabsTrigger>
              <TabsTrigger value="mine">{t("badges.tabs.mine")} ({myBadges?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="claims">{t("badges.tabs.claims")} ({myClaims?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="peer">
                {t("badges.tabs.peer")} {peerClaims && peerClaims.length > 0 && <span className="ml-1 text-primary">({peerClaims.length})</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalog">
              <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("badges.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="space-y-8">
                {grouped.map(([cat, badges]) => (
                  <div key={cat}>
                    <h3 className="font-display font-bold uppercase text-xs tracking-widest text-muted-foreground mb-3">
                      {cat.replace(/_/g, " ")}
                    </h3>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {badges.map((b) => (
                        <Dialog key={b.id} onOpenChange={(o) => !o && setSelectedBadge(null)}>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              onClick={() => { setSelectedBadge(b); setEvidence(""); setPeerId(""); }}
                              disabled={ownedIds.has(b.id)}
                              className={`text-left p-3 rounded-lg border transition-all ${ownedIds.has(b.id) ? "opacity-60 cursor-not-allowed bg-muted/30" : "hover:border-primary hover:shadow-sm cursor-pointer"}`}
                            >
                              <div className="flex items-center gap-3">
                                <BadgePill badge={b} size="md" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">{b.name}</p>
                                  {ownedIds.has(b.id) && <p className="text-[10px] text-green-600 dark:text-green-400">{t("badges.earned")}</p>}
                                  {b.bonus_points > 0 && <p className="text-[10px] text-primary">+{b.bonus_points} pts</p>}
                                </div>
                              </div>
                            </button>
                          </DialogTrigger>
                          {selectedBadge?.id === b.id && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                  <BadgePill badge={b} size="md" />
                                  {t("badges.claim.title")}: {b.name}
                                </DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">{b.description}</p>
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="ev">{t("badges.claim.evidence")}</Label>
                                  <Textarea id="ev" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder={b.evidence_hint ?? ""} rows={4} maxLength={2000} />
                                </div>
                                {b.requires_peer && (
                                  <div>
                                    <Label htmlFor="peer">{t("badges.claim.peer")}</Label>
                                    <Select value={peerId} onValueChange={setPeerId}>
                                      <SelectTrigger id="peer"><SelectValue placeholder={t("badges.claim.peerPlaceholder")} /></SelectTrigger>
                                      <SelectContent>
                                        {(members ?? []).filter((m) => m.user_id !== user.id).map((m) => (
                                          <SelectItem key={m.user_id} value={m.user_id}>{m.display_name ?? m.user_id.slice(0, 8)}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">{t("badges.claim.peerHelp")}</p>
                                  </div>
                                )}
                                <Button onClick={submit} disabled={!evidence.trim() || (b.requires_peer && !peerId) || createClaim.isPending} className="w-full">
                                  {t("badges.claim.submit")}
                                </Button>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mine">
              {myBadges && myBadges.length > 0 ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {myBadges.map((mb) => mb.badge && (
                    <Card key={mb.id}>
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <BadgePill badge={mb.badge} size="lg" />
                        <p className="font-medium text-sm">{mb.badge.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(mb.awarded_at).toLocaleDateString()}</p>
                        <AddToLinkedInButton
                          name={`GoodVibesCafe — ${mb.badge.name}`}
                          issueDate={mb.awarded_at}
                          certUrl={`${window.location.origin}/members/${user.id}`}
                          certId={mb.id}
                          size="sm"
                          label="LinkedIn"
                          className="mt-1"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("badges.empty")}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="claims">
              {myClaims && myClaims.length > 0 ? (
                <div className="space-y-3">
                  {myClaims.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        {c.badge && <BadgePill badge={c.badge} size="md" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{c.badge?.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{c.evidence}</p>
                          {c.rejection_reason && <p className="text-xs text-destructive mt-1">{c.rejection_reason}</p>}
                        </div>
                        {statusBadge(c.status)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("badges.noClaims")}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="peer">
              {peerClaims && peerClaims.length > 0 ? (
                <div className="space-y-3">
                  {peerClaims.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                        {c.badge && <BadgePill badge={c.badge} size="md" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{c.badge?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("badges.peerFrom")}: <strong>{c.claimant?.display_name ?? "?"}</strong>
                          </p>
                          <p className="text-sm mt-1">{c.evidence}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => peerRespond.mutate({ claimId: c.id, confirm: false })}>
                            <XCircle className="h-4 w-4 mr-1" />{t("badges.decline")}
                          </Button>
                          <Button size="sm" onClick={() => peerRespond.mutate({ claimId: c.id, confirm: true })}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />{t("badges.confirm")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("badges.noPeer")}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default BadgesPage;

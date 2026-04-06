import { useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsAdmin,
  usePendingShowcaseItems,
  useAllShowcaseItems,
  useUpdateShowcaseStatus,
} from "@/hooks/useAdminShowcase";
import type { ShowcaseItem, ApprovalStatus } from "@/hooks/useShowcase";
import { CheckCircle, XCircle, Clock, ExternalLink, Lightbulb, MessageSquare, Wrench, ImagePlus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const typeIcons: Record<string, React.ElementType> = {
  case_study: Lightbulb,
  testimonial: MessageSquare,
  tool: Wrench,
};

const statusConfig: Record<ApprovalStatus, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { icon: Clock, variant: "secondary" },
  approved: { icon: CheckCircle, variant: "default" },
  rejected: { icon: XCircle, variant: "destructive" },
};

const AdminItemCard = ({ item }: { item: ShowcaseItem }) => {
  const { t } = useTranslation();
  const updateStatus = useUpdateShowcaseStatus();
  const { toast } = useToast();
  const Icon = typeIcons[item.type] || Lightbulb;
  const statusInfo = statusConfig[item.status];
  const StatusIcon = statusInfo.icon;

  const handleStatusChange = async (status: ApprovalStatus) => {
    try {
      await updateStatus.mutateAsync({ id: item.id, status });
      toast({ title: `Item ${status}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <Card className="flex flex-col">
      {item.image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{item.title}</CardTitle>
          </div>
          <Badge variant={statusInfo.variant} className="text-xs gap-1 shrink-0">
            <StatusIcon className="h-3 w-3" /> {item.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="outline" className="text-xs">{item.type.replace("_", " ")}</Badge>
          {item.category_tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <p className="text-sm text-muted-foreground font-body">{item.description}</p>
        {item.content && (
          <p className="text-sm text-muted-foreground font-body mt-2 line-clamp-3">{item.content}</p>
        )}
        {item.pricing_info && (
          <p className="mt-2 text-sm font-semibold text-primary font-body">{item.pricing_info}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground font-body">
          {t("admin.showcase.submittedAt")}: {new Date(item.created_at).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter className="gap-2 flex-wrap pt-0">
        {item.link_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={item.link_url} target="_blank" rel="noopener noreferrer">
              {t("showcase.visitLink")} <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
        {item.status !== "approved" && (
          <Button
            size="sm"
            onClick={() => handleStatusChange("approved")}
            disabled={updateStatus.isPending}
          >
            <CheckCircle className="mr-1 h-3 w-3" /> {t("admin.showcase.approve")}
          </Button>
        )}
        {item.status !== "rejected" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleStatusChange("rejected")}
            disabled={updateStatus.isPending}
          >
            <XCircle className="mr-1 h-3 w-3" /> {t("admin.showcase.reject")}
          </Button>
        )}
        {item.status !== "pending" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("pending")}
            disabled={updateStatus.isPending}
          >
            <Clock className="mr-1 h-3 w-3" /> {t("admin.showcase.resetPending")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const AdminShowcase = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState("pending");

  const { data: pendingItems, isLoading: pendingLoading } = usePendingShowcaseItems();
  const { data: allItems, isLoading: allLoading } = useAllShowcaseItems();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredAll = tab === "all"
    ? allItems
    : allItems?.filter((i) => i.status === tab);

  const items = tab === "pending" ? pendingItems : filteredAll;
  const isLoading = tab === "pending" ? pendingLoading : allLoading;

  return (
    <Layout>
      <PageMeta title={`${t("admin.showcase.pageTitle")} — BizVibe`} description={t("admin.showcase.pageDesc")} />

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">
              {t("admin.showcase.tag")}
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-[-0.03em]">
              {t("admin.showcase.title")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground font-body">
              {t("admin.showcase.subtitle")}
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="pending">
                {t("admin.showcase.tabs.pending")} {pendingItems ? `(${pendingItems.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="approved">{t("admin.showcase.tabs.approved")}</TabsTrigger>
              <TabsTrigger value="rejected">{t("admin.showcase.tabs.rejected")}</TabsTrigger>
              <TabsTrigger value="all">{t("admin.showcase.tabs.all")}</TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {!isLoading && (!items || items.length === 0) && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground font-body">{t("admin.showcase.empty")}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items?.map((item) => (
                  <AdminItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default AdminShowcase;

import { useState, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsAdmin,
  usePendingShowcaseItems,
  useAllShowcaseItems,
} from "@/hooks/useAdminShowcase";
import AdminItemCard from "@/components/AdminItemCard";
import BulkActionBar from "@/components/BulkActionBar";
import AdminSearchFilter, { filterShowcaseItems, type SortOption } from "@/components/AdminSearchFilter";

const AdminShowcase = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");

  const { data: pendingItems, isLoading: pendingLoading } = usePendingShowcaseItems();
  const { data: allItems, isLoading: allLoading } = useAllShowcaseItems();

  const handleTabChange = useCallback((value: string) => {
    setTab(value);
    setSelectedIds([]);
  }, []);

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }, []);

  const filteredItems = useMemo(() => {
    const statusFiltered = tab === "pending"
      ? pendingItems
      : tab === "all"
        ? allItems
        : allItems?.filter((i) => i.status === tab);
    return filterShowcaseItems(statusFiltered, search, typeFilter, sortBy);
  }, [tab, pendingItems, allItems, search, typeFilter, sortBy]);

  const isLoading = tab === "pending" ? pendingLoading : allLoading;

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

          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="mb-8">
              <TabsTrigger value="pending">
                {t("admin.showcase.tabs.pending")} {pendingItems ? `(${pendingItems.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="approved">{t("admin.showcase.tabs.approved")}</TabsTrigger>
              <TabsTrigger value="rejected">{t("admin.showcase.tabs.rejected")}</TabsTrigger>
              <TabsTrigger value="all">{t("admin.showcase.tabs.all")}</TabsTrigger>
            </TabsList>

            <AdminSearchFilter
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              items={allItems}
            />

            <TabsContent value={tab}>
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {!isLoading && (!filteredItems || filteredItems.length === 0) && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground font-body">
                    {search.trim() || typeFilter !== "all"
                      ? t("admin.showcase.search.noResults")
                      : t("admin.showcase.empty")}
                  </p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems?.map((item) => (
                  <AdminItemCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    onSelectChange={(checked) => toggleSelect(item.id, checked)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <BulkActionBar selectedIds={selectedIds} onClear={() => setSelectedIds([])} />
    </Layout>
  );
};

export default AdminShowcase;

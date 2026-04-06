import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { ChevronLeft, ChevronRight, Bell, ScrollText, Users } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const AdminShowcase = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [page, setPage] = useState(1);

  const { data: pendingItems, isLoading: pendingLoading } = usePendingShowcaseItems();
  const { data: allItems, isLoading: allLoading } = useAllShowcaseItems();

  const handleTabChange = useCallback((value: string) => {
    setTab(value);
    setSelectedIds([]);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleTypeChange = useCallback((v: string) => { setTypeFilter(v); setPage(1); }, []);
  const handleSortChange = useCallback((v: SortOption) => { setSortBy(v); setPage(1); }, []);

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

  const totalItems = filteredItems?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    if (!filteredItems) return undefined;
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safePage]);

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
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link to="/admin/notifications">
                <Button variant="outline" size="sm" className="font-body gap-1.5">
                  <Bell className="h-4 w-4" /> Notifications
                </Button>
              </Link>
              <Link to="/admin/audit-log">
                <Button variant="outline" size="sm" className="font-body gap-1.5">
                  <ScrollText className="h-4 w-4" /> Audit Log
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" size="sm" className="font-body gap-1.5">
                  <Users className="h-4 w-4" /> User Management
                </Button>
              </Link>
            </div>
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
              onSearchChange={handleSearchChange}
              typeFilter={typeFilter}
              onTypeFilterChange={handleTypeChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              items={allItems}
            />

            <TabsContent value={tab}>
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {!isLoading && (!paginatedItems || paginatedItems.length === 0) && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground font-body">
                    {search.trim() || typeFilter !== "all"
                      ? t("admin.showcase.search.noResults")
                      : t("admin.showcase.empty")}
                  </p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems?.map((item) => (
                  <AdminItemCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    onSelectChange={(checked) => toggleSelect(item.id, checked)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === safePage ? "default" : "outline"}
                      size="icon"
                      onClick={() => setPage(p)}
                      className="w-9 h-9"
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(safePage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground font-body ml-2">
                    {totalItems} items
                  </span>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <BulkActionBar selectedIds={selectedIds} onClear={() => setSelectedIds([])} />
    </Layout>
  );
};

export default AdminShowcase;

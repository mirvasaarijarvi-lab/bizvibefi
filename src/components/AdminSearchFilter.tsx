import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import { Search } from "lucide-react";
import type { ShowcaseItem } from "@/hooks/useShowcase";

interface AdminSearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  items?: ShowcaseItem[];
}

const AdminSearchFilter = ({ search, onSearchChange, typeFilter, onTypeFilterChange, items }: AdminSearchFilterProps) => {
  const { t } = useTranslation();

  const availableTags = useMemo(() => {
    if (!items) return [];
    const tags = new Set<string>();
    items.forEach((item) => item.category_tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [items]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("admin.showcase.search.placeholder")}
          className="pl-9"
        />
      </div>
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={t("admin.showcase.search.typeAll")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.showcase.search.typeAll")}</SelectItem>
          <SelectItem value="case_study">{t("admin.showcase.search.casestudy")}</SelectItem>
          <SelectItem value="testimonial">{t("admin.showcase.search.testimonial")}</SelectItem>
          <SelectItem value="tool">{t("admin.showcase.search.tool")}</SelectItem>
        </SelectContent>
      </Select>
      {availableTags.length > 0 && (
        <Select value="all" onValueChange={(v) => onSearchChange(v === "all" ? search : v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t("admin.showcase.search.tagAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.showcase.search.tagAll")}</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default AdminSearchFilter;

export function filterShowcaseItems(
  items: ShowcaseItem[] | undefined,
  search: string,
  typeFilter: string,
): ShowcaseItem[] | undefined {
  if (!items) return undefined;
  let filtered = items;
  if (typeFilter && typeFilter !== "all") {
    filtered = filtered.filter((i) => i.type === typeFilter);
  }
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category_tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  return filtered;
}

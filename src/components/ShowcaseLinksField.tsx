import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

export interface ShowcaseLink {
  label?: string;
  url: string;
}

interface Props {
  links: ShowcaseLink[];
  onChange: (links: ShowcaseLink[]) => void;
}

const ShowcaseLinksField = ({ links, onChange }: Props) => {
  const { t } = useTranslation();

  const update = (i: number, field: "label" | "url", value: string) => {
    const u = [...links];
    u[i] = { ...u[i], [field]: value };
    onChange(u);
  };

  return (
    <div>
      <Label>{t("showcase.linksLabel")}</Label>
      {links.map((l, i) => (
        <div key={i} className="flex gap-2 items-center mt-1">
          <Input
            value={l.label ?? ""}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder={t("showcase.linkLabelPlaceholder")}
            className="w-1/3"
          />
          <Input
            type="url"
            value={l.url}
            onChange={(e) => update(i, "url", e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(links.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => onChange([...links, { label: "", url: "" }])}
      >
        <Plus className="mr-1 h-3 w-3" /> {t("showcase.addLink")}
      </Button>
    </div>
  );
};

export default ShowcaseLinksField;

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useUpdateShowcaseFields } from "@/hooks/useAdminShowcase";
import type { ShowcaseItem, ShowcaseType } from "@/hooks/useShowcase";
import { Loader2 } from "lucide-react";

interface AdminEditDialogProps {
  item: ShowcaseItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminEditDialog = ({ item, open, onOpenChange }: AdminEditDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const updateFields = useUpdateShowcaseFields();

  const [type, setType] = useState<ShowcaseType>(item.type);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [content, setContent] = useState(item.content ?? "");
  const [linkUrl, setLinkUrl] = useState(item.link_url ?? "");
  const [tags, setTags] = useState((item.category_tags ?? []).join(", "));
  const [pricingInfo, setPricingInfo] = useState(item.pricing_info ?? "");

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: t("admin.showcase.edit.requiredFields"), variant: "destructive" });
      return;
    }
    if (title.trim().length > 200) {
      toast({ title: t("admin.showcase.edit.titleTooLong"), variant: "destructive" });
      return;
    }

    try {
      await updateFields.mutateAsync({
        id: item.id,
        fields: {
          type,
          title: title.trim(),
          description: description.trim(),
          content: content.trim() || null,
          link_url: linkUrl.trim() || null,
          category_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          pricing_info: pricingInfo.trim() || null,
        },
      });
      toast({ title: t("admin.showcase.edit.saved") });
      onOpenChange(false);
    } catch {
      toast({ title: t("admin.showcase.edit.saveFailed"), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.showcase.edit.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>{t("showcase.type")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as ShowcaseType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="case_study">{t("showcase.tabs.caseStudies")}</SelectItem>
                <SelectItem value="testimonial">{t("showcase.tabs.testimonials")}</SelectItem>
                <SelectItem value="tool">{t("showcase.tabs.tools")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("showcase.titleLabel")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>{t("showcase.descriptionLabel")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>{t("showcase.contentLabel")}</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>{t("showcase.linkLabel")}</Label>
            <Input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>{t("showcase.tagsLabel")}</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("showcase.tagsPlaceholder")} />
          </div>
          {type === "tool" && (
            <div>
              <Label>{t("showcase.pricingLabel")}</Label>
              <Input value={pricingInfo} onChange={(e) => setPricingInfo(e.target.value)} />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("admin.showcase.edit.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={updateFields.isPending}>
              {updateFields.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {t("admin.showcase.edit.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditDialog;

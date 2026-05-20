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
import ShowcaseFileField from "@/components/ShowcaseFileField";
import ShowcaseLinksField from "@/components/ShowcaseLinksField";
import ShowcaseImagesField from "@/components/ShowcaseImagesField";
import type { ShowcaseItem, ShowcaseType, KeyFigure } from "@/hooks/useShowcase";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
  const [challenge, setChallenge] = useState(item.challenge ?? "");
  const [solution, setSolution] = useState(item.solution ?? "");
  const [benefits, setBenefits] = useState<string[]>(item.benefits ?? []);
  const [keyFigures, setKeyFigures] = useState<KeyFigure[]>(
    Array.isArray(item.key_figures) ? item.key_figures : []
  );
  const [linkUrl, setLinkUrl] = useState(item.link_url ?? "");
  const [links, setLinks] = useState<{ label?: string; url: string }[]>(
    Array.isArray(item.link_urls) ? item.link_urls : []
  );
  const [tags, setTags] = useState((item.category_tags ?? []).join(", "));
  const [pricingInfo, setPricingInfo] = useState(item.pricing_info ?? "");
  const [files, setFiles] = useState<{ url: string; name: string }[]>(
    item.file_urls && item.file_urls.length > 0
      ? item.file_urls
      : item.file_url ? [{ url: item.file_url, name: item.file_name ?? "" }] : []
  );
  const [images, setImages] = useState<string[]>(
    item.image_urls && item.image_urls.length > 0
      ? item.image_urls
      : item.image_url ? [item.image_url] : []
  );

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: t("admin.showcase.edit.requiredFields"), variant: "destructive" });
      return;
    }
    if (title.trim().length > 200) {
      toast({ title: t("admin.showcase.edit.titleTooLong"), variant: "destructive" });
      return;
    }

    const cleanBenefits = benefits.filter((b) => b.trim());
    const cleanFigures = keyFigures.filter((f) => f.label.trim() && f.value.trim());

    try {
      await updateFields.mutateAsync({
        id: item.id,
        fields: {
          type: type as "case_study" | "guidebook" | "sample_code" | "testimonial" | "tool" | "infographic" | "tool_to_test",
          title: title.trim(),
          description: description.trim(),
          content: content.trim() || null,
          challenge: challenge.trim() || null,
          solution: solution.trim() || null,
          benefits: cleanBenefits.length > 0 ? cleanBenefits : null,
          key_figures: cleanFigures.length > 0 ? cleanFigures as unknown as Record<string, unknown>[] : null,
          link_url: linkUrl.trim() || null,
          link_urls: links.filter((l) => l.url.trim()).map((l) => ({ label: l.label?.trim() || undefined, url: l.url.trim() })),
          category_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          pricing_info: pricingInfo.trim() || null,
          file_url: files[0]?.url ?? null,
          file_name: files[0]?.name ?? null,
          file_urls: files,
          image_url: images[0] ?? null,
          image_urls: images,
        },
      });
      toast({ title: t("admin.showcase.edit.saved") });
      onOpenChange(false);
    } catch {
      toast({ title: t("admin.showcase.edit.saveFailed"), variant: "destructive" });
    }
  };

  const showStructuredFields = type === "case_study" || type === "testimonial";

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
               <SelectItem value="guidebook">{t("showcase.tabs.guidebooks")}</SelectItem>
              <SelectItem value="sample_code">{t("showcase.tabs.sampleCode")}</SelectItem>
              <SelectItem value="infographic">{t("showcase.tabs.infographics")}</SelectItem>
              <SelectItem value="tool_to_test">{t("showcase.tabs.toolsToTest")}</SelectItem>
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

          {showStructuredFields && (
            <>
              <div>
                <Label>{t("showcase.challengeLabel")}</Label>
                <Textarea value={challenge} onChange={(e) => setChallenge(e.target.value)} rows={3} />
              </div>
              <div>
                <Label>{t("showcase.solutionLabel")}</Label>
                <Textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} />
              </div>
              <div>
                <Label>{t("showcase.benefitsLabel")}</Label>
                {benefits.map((b, i) => (
                  <div key={i} className="flex gap-2 items-center mt-1">
                    <Input
                      value={b}
                      onChange={(e) => {
                        const u = [...benefits];
                        u[i] = e.target.value;
                        setBenefits(u);
                      }}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setBenefits([...benefits, ""])}>
                  <Plus className="mr-1 h-3 w-3" /> {t("showcase.addBenefit")}
                </Button>
              </div>
              <div>
                <Label>{t("showcase.keyFiguresLabel")}</Label>
                {keyFigures.map((fig, i) => (
                  <div key={i} className="flex gap-2 items-center mt-1">
                    <Input
                      value={fig.value}
                      onChange={(e) => {
                        const u = [...keyFigures];
                        u[i] = { ...u[i], value: e.target.value };
                        setKeyFigures(u);
                      }}
                      placeholder={t("showcase.keyFigureValuePlaceholder")}
                      className="w-1/3"
                    />
                    <Input
                      value={fig.label}
                      onChange={(e) => {
                        const u = [...keyFigures];
                        u[i] = { ...u[i], label: e.target.value };
                        setKeyFigures(u);
                      }}
                      placeholder={t("showcase.keyFigureLabelPlaceholder")}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setKeyFigures(keyFigures.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setKeyFigures([...keyFigures, { label: "", value: "" }])}>
                  <Plus className="mr-1 h-3 w-3" /> {t("showcase.addKeyFigure")}
                </Button>
              </div>
            </>
          )}

          <div>
            <Label>{t("showcase.contentLabel")}</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>{t("showcase.linkLabel")} ({t("showcase.legacyLink")})</Label>
            <Input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
          </div>
          <ShowcaseLinksField links={links} onChange={setLinks} />
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
          <ShowcaseImagesField
            images={images}
            onChange={setImages}
            pathPrefix={`admin/${item.id}`}
          />
          <ShowcaseFileField
            files={files}
            pathPrefix={`admin/${item.id}`}
            onChange={(next) => setFiles(next)}
          />
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

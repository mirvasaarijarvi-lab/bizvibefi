import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import mascotShowcase from "@/assets/mascot-showcase.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useShowcaseItems, useCreateShowcaseItem, type ShowcaseType, type ShowcaseItem, type KeyFigure, TOOL_TEST_REASONS, type ToolTestReason } from "@/hooks/useShowcase";
import { Plus, ExternalLink, ArrowRight, Lightbulb, MessageSquare, Wrench, Trash2, BookOpen, Code, BarChart3, FlaskConical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import FilePreview from "@/components/FilePreview";
import ShowcaseLinksField from "@/components/ShowcaseLinksField";
import ShowcaseImagesField from "@/components/ShowcaseImagesField";
import ShowcaseFileField from "@/components/ShowcaseFileField";
import { useToast } from "@/hooks/use-toast";
import { safeUrl } from "@/lib/safeUrl";

const typeIcons: Record<ShowcaseType, React.ElementType> = {
  case_study: Lightbulb,
  testimonial: MessageSquare,
  tool: Wrench,
  guidebook: BookOpen,
  sample_code: Code,
  infographic: BarChart3,
  tool_to_test: FlaskConical,
};

const TEST_REASON_LABELS: Record<ToolTestReason, string> = {
  feedback: "Looking for feedback",
  comments: "Want comments / opinions",
  beta_test: "Recruiting beta testers",
  early_adoption: "Looking for early adopters",
  code_review: "Code review wanted",
  ux_review: "UX / design review",
  bug_hunting: "Help me find bugs",
};

const ShowcaseCard = ({ item }: { item: ShowcaseItem }) => {
  const { t } = useTranslation();
  const Icon = typeIcons[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Link to={`/showcase/${item.id}`} className="block">
        <Card className="h-full flex flex-col hover:border-primary/40 transition-colors group">
          {item.image_url ? (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
            </div>
          ) : (item.file_urls?.[0] || item.file_url) ? (
            <div className="rounded-t-lg overflow-hidden">
              <FilePreview
                url={item.file_urls?.[0]?.url ?? (item.file_url as string)}
                name={item.file_urls?.[0]?.name ?? item.file_name}
              />
            </div>
          ) : null}
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.category_tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground font-body line-clamp-3">{item.description}</p>
            {item.pricing_info && (
              <p className="mt-2 text-sm font-semibold text-primary font-body">{item.pricing_info}</p>
            )}
          </CardContent>
          <CardFooter className="gap-2 flex-wrap">
            {(() => {
              const all = [...(item.link_urls ?? []), ...(item.link_url ? [{ url: item.link_url }] : [])];
              const safe = all[0] ? safeUrl(all[0].url) : null;
              return safe ? (
                <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                  <a href={safe} target="_blank" rel="noopener noreferrer">
                    {all[0].label || t("showcase.visitLink")} <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              ) : null;
            })()}
            <Button variant="ghost" size="sm" className="ml-auto">
              {t("showcase.detail.readMore")} <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
};

const KeyFigureInput = ({ figures, onChange }: { figures: KeyFigure[]; onChange: (f: KeyFigure[]) => void }) => {
  const { t } = useTranslation();

  const addFigure = () => onChange([...figures, { label: "", value: "" }]);
  const removeFigure = (i: number) => onChange(figures.filter((_, idx) => idx !== i));
  const updateFigure = (i: number, field: "label" | "value", val: string) => {
    const updated = [...figures];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label>{t("showcase.keyFiguresLabel")}</Label>
      {figures.map((fig, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={fig.value}
            onChange={(e) => updateFigure(i, "value", e.target.value)}
            placeholder={t("showcase.keyFigureValuePlaceholder")}
            className="w-1/3"
          />
          <Input
            value={fig.label}
            onChange={(e) => updateFigure(i, "label", e.target.value)}
            placeholder={t("showcase.keyFigureLabelPlaceholder")}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeFigure(i)} className="shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addFigure}>
        <Plus className="mr-1 h-3 w-3" /> {t("showcase.addKeyFigure")}
      </Button>
    </div>
  );
};

const BenefitsInput = ({ benefits, onChange }: { benefits: string[]; onChange: (b: string[]) => void }) => {
  const { t } = useTranslation();

  const addBenefit = () => onChange([...benefits, ""]);
  const removeBenefit = (i: number) => onChange(benefits.filter((_, idx) => idx !== i));
  const updateBenefit = (i: number, val: string) => {
    const updated = [...benefits];
    updated[i] = val;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label>{t("showcase.benefitsLabel")}</Label>
      {benefits.map((b, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={b}
            onChange={(e) => updateBenefit(i, e.target.value)}
            placeholder={t("showcase.benefitPlaceholder")}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeBenefit(i)} className="shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
        <Plus className="mr-1 h-3 w-3" /> {t("showcase.addBenefit")}
      </Button>
    </div>
  );
};

const SubmitForm = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const createItem = useCreateShowcaseItem();
  const { toast } = useToast();
  const [type, setType] = useState<ShowcaseType>("case_study");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);
  const [links, setLinks] = useState<{ label?: string; url: string }[]>([]);
  const [tags, setTags] = useState("");
  const [pricingInfo, setPricingInfo] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [testReasons, setTestReasons] = useState<string[]>([]);
  const [testReasonsOther, setTestReasonsOther] = useState("");
  const [includeOther, setIncludeOther] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const cleanBenefits = benefits.filter((b) => b.trim());
      const cleanFigures = keyFigures.filter((f) => f.label.trim() && f.value.trim());

      await createItem.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim(),
        content: content.trim() || undefined,
        challenge: challenge.trim() || undefined,
        solution: solution.trim() || undefined,
        benefits: cleanBenefits.length > 0 ? cleanBenefits : undefined,
        key_figures: cleanFigures.length > 0 ? cleanFigures : undefined,
        link_urls: links.filter((l) => l.url.trim()).map((l) => ({ label: l.label?.trim() || undefined, url: l.url.trim() })),
        image_url: images[0],
        image_urls: images,
        file_url: files[0]?.url,
        file_name: files[0]?.name,
        file_urls: files,
        category_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        pricing_info: pricingInfo.trim() || undefined,
        test_reasons: type === "tool_to_test" ? testReasons : undefined,
        test_reasons_other: type === "tool_to_test" && includeOther ? testReasonsOther.trim() || undefined : undefined,
      });
      toast({ title: t("showcase.submitted"), description: t("showcase.submittedDesc") });
      onClose();
    } catch {
      toast({ title: t("showcase.submitError"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const showStructuredFields = type === "case_study" || type === "testimonial";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label>{t("showcase.descriptionLabel")}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      {showStructuredFields && (
        <>
          <div>
            <Label>{t("showcase.challengeLabel")}</Label>
            <Textarea value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder={t("showcase.challengePlaceholder")} rows={3} />
          </div>
          <div>
            <Label>{t("showcase.solutionLabel")}</Label>
            <Textarea value={solution} onChange={(e) => setSolution(e.target.value)} placeholder={t("showcase.solutionPlaceholder")} rows={3} />
          </div>
          <BenefitsInput benefits={benefits} onChange={setBenefits} />
          <KeyFigureInput figures={keyFigures} onChange={setKeyFigures} />
        </>
      )}

      <div>
        <Label>{t("showcase.contentLabel")}</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("showcase.contentPlaceholder")} />
      </div>
      <ShowcaseLinksField links={links} onChange={setLinks} />
      <ShowcaseImagesField images={images} onChange={setImages} />
      {user && (
        <ShowcaseFileField files={files} onChange={setFiles} pathPrefix={user.id} />
      )}
      <div>
        <Label>{t("showcase.tagsLabel")}</Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("showcase.tagsPlaceholder")} />
      </div>
      {type === "tool" && (
        <div>
          <Label>{t("showcase.pricingLabel")}</Label>
          <Input value={pricingInfo} onChange={(e) => setPricingInfo(e.target.value)} placeholder={t("showcase.pricingPlaceholder")} />
        </div>
      )}
      {type === "tool_to_test" && (
        <div className="space-y-3 rounded-lg border p-4">
          <Label className="text-sm font-semibold">Why are you sharing this tool?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOOL_TEST_REASONS.map((r) => {
              const checked = testReasons.includes(r);
              return (
                <label key={r} className="flex items-center gap-2 text-sm font-body cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) =>
                      setTestReasons((prev) => (c ? [...prev, r] : prev.filter((x) => x !== r)))
                    }
                  />
                  <span>{TEST_REASON_LABELS[r]}</span>
                </label>
              );
            })}
            <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
              <Checkbox checked={includeOther} onCheckedChange={(c) => setIncludeOther(!!c)} />
              <span>Other</span>
            </label>
          </div>
          {includeOther && (
            <Input
              value={testReasonsOther}
              onChange={(e) => setTestReasonsOther(e.target.value)}
              placeholder="Tell us why…"
            />
          )}
        </div>
      )}
      <Button type="submit" disabled={createItem.isPending || submitting} className="w-full">
        {submitting ? t("showcase.uploading") : t("showcase.submitBtn")}
      </Button>
      
    </form>
  );
};

const Showcase = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const typeFilter = activeTab === "all" ? undefined : activeTab as ShowcaseType;
  const { data: items, isLoading } = useShowcaseItems(typeFilter);

  return (
    <Layout>
      <PageMeta
        title={`${t("showcase.pageTitle")} — <Good Vibes Café/>`}
        description={t("showcase.pageDesc")}
      />

      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <HeroAvatar src={mascotShowcase} alt="<Good Vibes Café/> showcase mascot" />
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">{t("showcase.tag")}</p>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[-0.03em]">
              {t("showcase.title")} <span className="text-gradient-storm">{t("showcase.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground font-body max-w-xl mx-auto">{t("showcase.subtitle")}</p>
            {user && (
              <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="lg" className="mt-8">
                    <Plus className="mr-2 h-4 w-4" /> {t("showcase.submitCta")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("showcase.submitTitle")}</DialogTitle>
                  </DialogHeader>
                  <SubmitForm onClose={() => setSubmitOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
            {!user && (
              <Button variant="heroOutline" size="lg" className="mt-8" asChild>
                <Link to="/auth">{t("showcase.signInToSubmit")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="flex w-full flex-wrap h-auto gap-1 justify-start sm:justify-center">
                <TabsTrigger value="all" className="text-xs sm:text-sm">{t("showcase.tabs.all")}</TabsTrigger>
                <TabsTrigger value="case_study" className="text-xs sm:text-sm">{t("showcase.tabs.caseStudies")}</TabsTrigger>
                <TabsTrigger value="testimonial" className="text-xs sm:text-sm">{t("showcase.tabs.testimonials")}</TabsTrigger>
                <TabsTrigger value="tool" className="text-xs sm:text-sm">{t("showcase.tabs.tools")}</TabsTrigger>
                <TabsTrigger value="guidebook" className="text-xs sm:text-sm">{t("showcase.tabs.guidebooks")}</TabsTrigger>
                <TabsTrigger value="sample_code" className="text-xs sm:text-sm">{t("showcase.tabs.sampleCode")}</TabsTrigger>
                <TabsTrigger value="infographic" className="text-xs sm:text-sm">{t("showcase.tabs.infographics")}</TabsTrigger>
                <TabsTrigger value="tool_to_test" className="text-xs sm:text-sm">{t("showcase.tabs.toolsToTest")}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab}>
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {!isLoading && items && items.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground font-body">{t("showcase.empty")}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items?.map((item) => (
                  <ShowcaseCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Showcase;

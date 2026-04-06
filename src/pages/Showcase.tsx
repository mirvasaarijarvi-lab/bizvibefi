import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
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
import { useShowcaseItems, useCreateShowcaseItem, useShowcaseReviews, useCreateReview, type ShowcaseType, type ShowcaseItem } from "@/hooks/useShowcase";
import { Plus, Star, ExternalLink, Clock, CheckCircle, XCircle, ArrowRight, Lightbulb, MessageSquare, Wrench, Upload, X as XIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ImageDropZone from "@/components/ImageDropZone";
import { useToast } from "@/hooks/use-toast";

const typeIcons: Record<ShowcaseType, React.ElementType> = {
  case_study: Lightbulb,
  testimonial: MessageSquare,
  tool: Wrench,
};

const ShowcaseCard = ({ item }: { item: ShowcaseItem }) => {
  const [reviewOpen, setReviewOpen] = useState(false);
  const { t } = useTranslation();
  const Icon = typeIcons[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card className="h-full flex flex-col hover:border-primary/40 transition-colors">
        {item.image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
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
          <p className="text-sm text-muted-foreground font-body">{item.description}</p>
          {item.pricing_info && (
            <p className="mt-2 text-sm font-semibold text-primary font-body">{item.pricing_info}</p>
          )}
          {item.profiles?.display_name && (
            <p className="mt-3 text-xs text-muted-foreground font-body">
              {t("showcase.by")} {item.profiles.display_name}
            </p>
          )}
        </CardContent>
        <CardFooter className="gap-2 flex-wrap">
          {item.link_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                {t("showcase.visitLink")} <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
          {item.type === "tool" && (
            <ReviewDialog item={item} open={reviewOpen} onOpenChange={setReviewOpen} />
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
        <Star className={`h-5 w-5 ${star <= value ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
      </button>
    ))}
  </div>
);

const ReviewDialog = ({ item, open, onOpenChange }: { item: ShowcaseItem; open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: reviews } = useShowcaseReviews(item.id);
  const createReview = useCreateReview();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async () => {
    if (!rating) return;
    try {
      await createReview.mutateAsync({ showcase_item_id: item.id, rating, comment: comment || undefined });
      toast({ title: t("showcase.reviewSubmitted") });
      setRating(0);
      setComment("");
    } catch {
      toast({ title: t("showcase.reviewError"), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Star className="mr-1 h-3 w-3" /> {avgRating ?? "—"} ({reviews?.length ?? 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("showcase.reviews")} — {item.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {reviews?.map((r) => (
            <div key={r.id} className="border-b pb-3">
              <div className="flex items-center gap-2">
                <StarRating value={r.rating} onChange={() => {}} />
                <span className="text-xs text-muted-foreground">{r.profiles?.display_name ?? "Anonymous"}</span>
              </div>
              {r.comment && <p className="text-sm mt-1 font-body">{r.comment}</p>}
            </div>
          ))}
          {(!reviews || reviews.length === 0) && (
            <p className="text-sm text-muted-foreground">{t("showcase.noReviews")}</p>
          )}
        </div>
        {user && (
          <div className="space-y-3 pt-4 border-t">
            <Label>{t("showcase.yourRating")}</Label>
            <StarRating value={rating} onChange={setRating} />
            <Textarea placeholder={t("showcase.commentPlaceholder")} value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button onClick={handleSubmit} disabled={!rating || createReview.isPending} className="w-full">
              {t("showcase.submitReview")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  const [linkUrl, setLinkUrl] = useState("");
  const [tags, setTags] = useState("");
  const [pricingInfo, setPricingInfo] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setUploading(true);
    let image_url: string | undefined;

    try {
      if (imageFile && user) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("showcase-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("showcase-images")
          .getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      await createItem.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim(),
        content: content.trim() || undefined,
        link_url: linkUrl.trim() || undefined,
        image_url,
        category_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        pricing_info: pricingInfo.trim() || undefined,
      });
      toast({ title: t("showcase.submitted"), description: t("showcase.submittedDesc") });
      onClose();
    } catch {
      toast({ title: t("showcase.submitError"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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
      <div>
        <Label>{t("showcase.contentLabel")}</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("showcase.contentPlaceholder")} />
      </div>
      <div>
        <Label>{t("showcase.linkLabel")}</Label>
        <Input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <Label>{t("showcase.imageLabel")}</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {imagePreview ? (
          <div className="relative mt-2">
            <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-border" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm font-body">{t("showcase.uploadImage")}</span>
          </button>
        )}
      </div>
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
      <Button type="submit" disabled={createItem.isPending || uploading} className="w-full">
        {uploading ? t("showcase.uploading") : t("showcase.submitBtn")}
      </Button>
    </form>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const icons: Record<string, React.ElementType> = { pending: Clock, approved: CheckCircle, rejected: XCircle };
  const Icon = icons[status] || Clock;
  const variant = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary";
  return (
    <Badge variant={variant} className="text-xs gap-1">
      <Icon className="h-3 w-3" /> {status}
    </Badge>
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
        title={`${t("showcase.pageTitle")} — BizVibe`}
        description={t("showcase.pageDesc")}
      />

      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
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
            <TabsList className="mb-8">
              <TabsTrigger value="all">{t("showcase.tabs.all")}</TabsTrigger>
              <TabsTrigger value="case_study">{t("showcase.tabs.caseStudies")}</TabsTrigger>
              <TabsTrigger value="testimonial">{t("showcase.tabs.testimonials")}</TabsTrigger>
              <TabsTrigger value="tool">{t("showcase.tabs.tools")}</TabsTrigger>
            </TabsList>

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

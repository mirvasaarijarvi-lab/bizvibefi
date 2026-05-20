import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useShowcaseItem, useShowcaseReviews, useCreateReview, type KeyFigure } from "@/hooks/useShowcase";
import FilePreview from "@/components/FilePreview";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ExternalLink, Lightbulb, MessageSquare, Wrench, Star,
  Target, Zap, CheckCircle2, BarChart3, FileText, Download, Lock, BookOpen, Code, FlaskConical,
} from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  case_study: Lightbulb,
  testimonial: MessageSquare,
  tool: Wrench,
  guidebook: BookOpen,
  sample_code: Code,
  infographic: BarChart3,
  tool_to_test: FlaskConical,
};

const TEST_REASON_LABELS: Record<string, string> = {
  feedback: "Looking for feedback",
  comments: "Want comments / opinions",
  beta_test: "Recruiting beta testers",
  early_adoption: "Looking for early adopters",
  code_review: "Code review wanted",
  ux_review: "UX / design review",
  bug_hunting: "Help me find bugs",
};

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange?.(star)}
        className={onChange ? "focus:outline-none cursor-pointer" : "cursor-default"}
        disabled={!onChange}
      >
        <Star className={`h-5 w-5 ${star <= value ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
      </button>
    ))}
  </div>
);

const KeyFigureCard = ({ figure }: { figure: KeyFigure }) => (
  <Card className="text-center">
    <CardContent className="pt-6 pb-4">
      <p className="text-2xl md:text-3xl font-extrabold font-display text-primary">{figure.value}</p>
      <p className="text-sm text-muted-foreground font-body mt-1">{figure.label}</p>
    </CardContent>
  </Card>
);

const ShowcaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const hasViber = profile?.membership_tier === "viber" || profile?.membership_tier === "vibetor";
  const { toast } = useToast();
  const { data: item, isLoading, error } = useShowcaseItem(id ?? "");
  const { data: reviews } = useShowcaseReviews(id ?? "");
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!id) return <Navigate to="/showcase" replace />;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground font-body">{t("showcase.detail.notFound")}</p>
          <Button variant="outline" asChild>
            <Link to="/showcase"><ArrowLeft className="mr-2 h-4 w-4" /> {t("showcase.detail.backToShowcase")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const Icon = typeIcons[item.type] || Lightbulb;
  const keyFigures: KeyFigure[] = Array.isArray(item.key_figures) ? item.key_figures : [];
  const benefits: string[] = Array.isArray(item.benefits) ? item.benefits : [];
  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmitReview = async () => {
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
    <Layout>
      <PageMeta
        title={`${item.title} — Showcase`.slice(0, 60)}
        description={(item.description ?? "Member project featured in the Good Vibes Café showcase.").slice(0, 160)}
        ogType="article"
      />
      <JsonLd
        id="showcase-item"
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.description,
          image: item.image_urls?.length ? item.image_urls : item.image_url ? [item.image_url] : undefined,
          url: `https://goodvibescafe.org/showcase/${item.id}`,
          datePublished: item.created_at,
          dateModified: item.updated_at ?? item.created_at,
          author: { "@type": "Organization", name: "Good Vibes Café" },
          aggregateRating: avgRating && reviews?.length
            ? {
                "@type": "AggregateRating",
                ratingValue: avgRating,
                reviewCount: reviews.length,
              }
            : undefined,
        }}
      />

      {/* Hero */}
      <section className="py-12 md:py-20">
        <div className="container">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/showcase"><ArrowLeft className="mr-2 h-4 w-4" /> {t("showcase.detail.backToShowcase")}</Link>
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline">{item.type.replace("_", " ")}</Badge>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-4">{item.title}</h1>
            <p className="text-lg text-muted-foreground font-body mb-6">{item.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {item.category_tags?.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>

            {item.profiles?.display_name && (
              <Link to={`/members/${item.user_id}`} className="inline-flex items-center gap-2 mb-6 group">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.profiles.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-muted text-[10px] font-display">
                    {item.profiles.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground font-body group-hover:text-primary">
                  {t("showcase.by")} <span className="font-medium">{item.profiles.display_name}</span>
                </span>
              </Link>
            )}

            {item.pricing_info && (
              <p className="text-lg font-semibold text-primary font-body mb-6">{item.pricing_info}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {(() => {
                const allFiles = item.file_urls && item.file_urls.length > 0
                  ? item.file_urls
                  : item.file_url ? [{ url: item.file_url, name: item.file_name ?? "" }] : [];
                return allFiles.map((f, i) => (
                  hasViber ? (
                    <Button key={i} size="lg" asChild className="shadow-lg">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" download={f.name || undefined}>
                        <Download className="mr-2 h-5 w-5" />
                        {f.name || t("showcase.file.download")}
                      </a>
                    </Button>
                  ) : (
                    <Button key={i} size="lg" asChild variant="outline" className="shadow-sm">
                      <Link to="/apply-viber">
                        <Lock className="mr-2 h-5 w-5" />
                        {t("showcase.lockedViber")}
                      </Link>
                    </Button>
                  )
                ));
              })()}
              {[...(item.link_urls ?? []), ...(item.link_url ? [{ url: item.link_url }] : [])].map((l, i) => (
                <Button key={i} asChild variant="outline">
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label || t("showcase.visitLink")} <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ))}
              {item.type === "tool" && avgRating && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{avgRating}</span>
                  <span className="text-sm text-muted-foreground">({reviews?.length})</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Figures */}
      {keyFigures.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">{t("showcase.detail.keyFigures")}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {keyFigures.map((fig, i) => (
                <KeyFigureCard key={i} figure={fig} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Challenge / Solution / Benefits */}
      {(item.challenge || item.solution || benefits.length > 0) && (
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {item.challenge && (
              <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-lg font-bold">{t("showcase.detail.challenge")}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-body whitespace-pre-line">{item.challenge}</p>
                  </CardContent>
                </Card>
              )}

              {item.solution && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-lg font-bold">{t("showcase.detail.solution")}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-body whitespace-pre-line">{item.solution}</p>
                  </CardContent>
                </Card>
              )}

              {benefits.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-lg font-bold">{t("showcase.detail.benefits")}</h3>
                    </div>
                    <ul className="space-y-2">
                      {benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Full Content / Media */}
      {(() => {
        const imgs = item.image_urls && item.image_urls.length > 0
          ? item.image_urls
          : item.image_url ? [item.image_url] : [];
        const fileList = item.file_urls && item.file_urls.length > 0
          ? item.file_urls
          : item.file_url ? [{ url: item.file_url, name: item.file_name ?? "" }] : [];
        const hasMedia = imgs.length > 0 || fileList.length > 0;
        if (!item.content && !hasMedia) return null;
        return (
          <section className="py-12 md:py-16 border-t">
            <div className="container">
              <div className={`grid gap-10 items-start ${hasMedia && item.content ? "lg:grid-cols-2" : ""}`}>
                {item.content && (
                  <div className="max-w-3xl">
                    <h2 className="font-display text-2xl font-bold mb-6">{t("showcase.detail.fullStory")}</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground font-body whitespace-pre-line">
                      {item.content}
                    </div>
                  </div>
                )}
                {hasMedia && (
                  <div className="lg:sticky lg:top-24 space-y-3">
                    {imgs.length > 0 ? (
                      <>
                        <FilePreview url={imgs[0]} name={item.title} />
                        {imgs.length > 1 && (
                          <div className="grid grid-cols-4 gap-2">
                            {imgs.slice(1).map((url, i) => (
                              <FilePreview key={i} url={url} name={`${item.title} ${i + 2}`} variant="thumbnail" />
                            ))}
                          </div>
                        )}
                      </>
                    ) : fileList[0] ? (
                      <FilePreview url={fileList[0].url} name={fileList[0].name} />
                    ) : null}
                    {fileList.length > 1 && imgs.length === 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {fileList.slice(1).map((f, i) => (
                          <FilePreview key={i} url={f.url} name={f.name} variant="thumbnail" />
                        ))}
                      </div>
                    )}
                    {fileList.map((f, i) => (
                      hasViber ? (
                        <Button key={i} asChild size="lg" className="w-full shadow-lg">
                          <a href={f.url} target="_blank" rel="noopener noreferrer" download={f.name || undefined}>
                            <Download className="mr-2 h-5 w-5" />
                            {f.name || t("showcase.file.download")}
                          </a>
                        </Button>
                      ) : (
                        <Button key={i} asChild size="lg" variant="outline" className="w-full">
                          <Link to="/apply-viber">
                            <Lock className="mr-2 h-5 w-5" />
                            {t("showcase.lockedViber")}
                          </Link>
                        </Button>
                      )
                    ))}
                    {fileList.length === 0 && imgs[0] && (
                      <Button asChild size="lg" className="w-full shadow-lg">
                        <a href={imgs[0]} target="_blank" rel="noopener noreferrer" download>
                          <Download className="mr-2 h-5 w-5" />
                          {t("showcase.file.download")}
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Reviews (tools only) */}
      {item.type === "tool" && (
        <section className="py-12 md:py-16 border-t">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold mb-6">
              {t("showcase.reviews")} ({reviews?.length ?? 0})
            </h2>

            <div className="space-y-4 mb-8">
              {reviews?.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating value={r.rating} />
                      <span className="text-sm text-muted-foreground font-body">
                        {r.profiles?.display_name ?? "Anonymous"}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm font-body">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
              {(!reviews || reviews.length === 0) && (
                <p className="text-sm text-muted-foreground font-body">{t("showcase.noReviews")}</p>
              )}
            </div>

            {user && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-display font-bold">{t("showcase.detail.leaveReview")}</h3>
                  <div>
                    <Label className="mb-2 block">{t("showcase.yourRating")}</Label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  <Textarea
                    placeholder={t("showcase.commentPlaceholder")}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button onClick={handleSubmitReview} disabled={!rating || createReview.isPending}>
                    {t("showcase.submitReview")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ShowcaseDetail;

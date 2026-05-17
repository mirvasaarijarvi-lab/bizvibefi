import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useCertificate } from "@/hooks/useCourses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, ShieldCheck, Calendar, Sparkles } from "lucide-react";
import AddToLinkedInButton from "@/components/AddToLinkedInButton";

const methodLabels: Record<string, string> = {
  face_to_face: "Face to face",
  seminar: "Seminar",
  webinar: "Webinar",
  customized: "Customized",
  other: "Other",
};

const CertificateVerify = () => {
  const { id } = useParams<{ id: string }>();
  const { data: cert, isLoading } = useCertificate(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!cert) {
    return (
      <Layout>
        <PageMeta title="Certificate not found — <Good Vibes Café/>" description="This certificate could not be verified." />
        <section className="py-24 md:py-32">
          <div className="container max-w-2xl text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] mb-4">Not found</h1>
            <p className="text-muted-foreground font-body mb-6">No certificate matches this ID.</p>
            <Button asChild variant="outline"><Link to="/">Go home</Link></Button>
          </div>
        </section>
      </Layout>
    );
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const methodLabel = cert.method === "other" && cert.method_details ? `Other: ${cert.method_details}` : methodLabels[cert.method] ?? cert.method;
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/certificates/${cert.id}` : "";

  return (
    <Layout>
      <PageMeta
        title={`${cert.participant_name} — ${cert.course_title} | <Good Vibes Café/>`}
        description={`${cert.participant_name} completed ${cert.course_title} with <Good Vibes Café/> on ${formatDate(cert.completion_date)}.`}
      />
      <section className="py-24 md:py-32">
        <div className="container max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-body font-semibold uppercase tracking-widest mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified certificate
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-[-0.03em]">
              {cert.participant_name}
            </h1>
            <p className="mt-3 text-muted-foreground font-body">has completed</p>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold text-gradient-storm">
              {cert.course_title}
            </h2>
          </div>

          <Card className="border-primary/20 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-vivid via-electric to-turquoise" />
            <CardContent className="p-6 md:p-8 space-y-5">
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground mb-1">Course content</p>
                <p className="font-body">{cert.course_content}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground">Completion date</p>
                    <p className="font-body font-medium">{formatDate(cert.completion_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground">Method</p>
                    <p className="font-body font-medium">{methodLabel}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground">Issued by</p>
                    <p className="font-body font-medium">{cert.issued_by_name}</p>
                    <p className="text-xs text-muted-foreground"><Good Vibes Café/> Founder</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground">Certificate ID</p>
                    <p className="font-body font-mono text-xs break-all">{cert.id}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-2 border-t border-border">
                {cert.pdf_url && (
                  <Button asChild variant="hero" size="sm">
                    <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  </Button>
                )}
                <AddToLinkedInButton
                  name={cert.course_title}
                  issueDate={cert.completion_date}
                  certUrl={verifyUrl}
                  certId={cert.id}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default CertificateVerify;

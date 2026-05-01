import { useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { useProfile } from "@/hooks/useProfile";
import { useCourses, useIssueCertificate, useUpdateCertificatePdfUrl, type CourseMethod } from "@/hooks/useCourses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateCertificatePdf } from "@/lib/certificate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, ExternalLink } from "lucide-react";
import AddToLinkedInButton from "@/components/AddToLinkedInButton";
import { toast } from "sonner";

const methodOptions: { value: CourseMethod; label: string }[] = [
  { value: "face_to_face", label: "Face to face" },
  { value: "seminar", label: "Seminar" },
  { value: "webinar", label: "Webinar" },
  { value: "customized", label: "Customized" },
  { value: "other", label: "Other" },
];

const AdminCertificates = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const isAdmin = useIsAdmin();
  const { data: courses } = useCourses();
  const issueCert = useIssueCertificate();
  const updatePdf = useUpdateCertificatePdfUrl();

  const [courseId, setCourseId] = useState<string>("");
  const [participantUserId, setParticipantUserId] = useState<string>("");
  const [participantName, setParticipantName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseContent, setCourseContent] = useState("");
  const [method, setMethod] = useState<CourseMethod>("webinar");
  const [methodDetails, setMethodDetails] = useState("");
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 10));
  const [issuing, setIssuing] = useState(false);
  const [lastCertificate, setLastCertificate] = useState<{ id: string; pdfUrl: string; participant: string; date: string } | null>(null);

  const { data: members } = useQuery({
    queryKey: ["members-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .order("display_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const onCourseChange = (id: string) => {
    setCourseId(id);
    const c = (courses ?? []).find((x) => x.id === id);
    if (c) {
      setCourseTitle(c.title);
      setCourseContent(c.summary);
      setMethod(c.default_method);
    }
  };

  const onParticipantChange = (id: string) => {
    setParticipantUserId(id);
    const m = (members ?? []).find((x) => x.user_id === id);
    if (m?.display_name) setParticipantName(m.display_name);
  };

  const handleIssue = async () => {
    if (!courseId || !participantName.trim() || !courseTitle.trim() || !courseContent.trim() || !completionDate) {
      toast.error("Fill in all required fields");
      return;
    }
    setIssuing(true);
    try {
      const cert = await issueCert.mutateAsync({
        course_id: courseId,
        participant_user_id: participantUserId || null,
        participant_name: participantName.trim(),
        course_title: courseTitle.trim(),
        course_content: courseContent.trim(),
        method,
        method_details: method === "other" ? methodDetails.trim() || null : null,
        completion_date: completionDate,
        issued_by: user.id,
        issued_by_name: profile?.display_name ?? "BizVibe Founder",
      });

      const verifyUrl = `${window.location.origin}/certificates/${cert.id}`;
      const pdfBlob = generateCertificatePdf({
        id: cert.id,
        participant_name: cert.participant_name,
        course_title: cert.course_title,
        course_content: cert.course_content,
        method: cert.method,
        method_details: cert.method_details,
        completion_date: cert.completion_date,
        issued_by_name: cert.issued_by_name,
        verify_url: verifyUrl,
      });

      const path = `${cert.id}.pdf`;
      const { error: uploadErr } = await supabase.storage.from("certificates").upload(path, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(path);
      await updatePdf.mutateAsync({ id: cert.id, pdf_url: urlData.publicUrl });

      setLastCertificate({ id: cert.id, pdfUrl: urlData.publicUrl, participant: cert.participant_name, date: cert.completion_date });
      toast.success("Certificate issued and PDF generated");

      setParticipantUserId("");
      setParticipantName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to issue certificate");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <Layout>
      <PageMeta title="Issue Certificate — BizVibe" description="Founder tool for issuing course completion certificates." />
      <section className="py-24 md:py-32">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-4">Founders</p>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-[-0.03em]">
              Issue a <span className="text-gradient-storm">Certificate</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body">Generate a branded BizVibe certificate, auto-award the linked badge, and share it on LinkedIn.</p>
          </div>

          <Card>
            <CardHeader><CardTitle>Certificate details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Course *</Label>
                <Select value={courseId} onValueChange={onCourseChange}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {(courses ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Participant member (optional)</Label>
                  <Select value={participantUserId} onValueChange={onParticipantChange}>
                    <SelectTrigger><SelectValue placeholder="Pick a member" /></SelectTrigger>
                    <SelectContent>
                      {(members ?? []).map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>{m.display_name ?? m.user_id.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Linking awards the course badge automatically.</p>
                </div>
                <div>
                  <Label>Participant name *</Label>
                  <Input value={participantName} onChange={(e) => setParticipantName(e.target.value)} maxLength={120} required />
                </div>
              </div>

              <div>
                <Label>Course title (shown on certificate) *</Label>
                <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} maxLength={150} required />
              </div>

              <div>
                <Label>Content summary *</Label>
                <Textarea value={courseContent} onChange={(e) => setCourseContent(e.target.value)} rows={3} maxLength={400} required />
                <p className="text-xs text-muted-foreground mt-1">Short description (max 400 chars).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Method *</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as CourseMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {methodOptions.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Completion date *</Label>
                  <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} required />
                </div>
              </div>

              {method === "other" && (
                <div>
                  <Label>Specify method *</Label>
                  <Input value={methodDetails} onChange={(e) => setMethodDetails(e.target.value)} maxLength={80} placeholder="e.g. On-site bootcamp" />
                </div>
              )}

              <Button onClick={handleIssue} disabled={issuing} className="w-full" variant="hero">
                <Award className="h-4 w-4" />
                {issuing ? "Generating…" : "Issue & generate PDF"}
              </Button>
            </CardContent>
          </Card>

          {lastCertificate && (
            <Card className="mt-6 border-primary/40">
              <CardHeader><CardTitle className="text-lg">Last certificate</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="font-body text-sm">
                  Issued to <strong>{lastCertificate.participant}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={lastCertificate.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/certificates/${lastCertificate.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Verify page
                    </a>
                  </Button>
                  <AddToLinkedInButton
                    name={courseTitle || "BizVibe Course"}
                    issueDate={lastCertificate.date}
                    certUrl={`${window.location.origin}/certificates/${lastCertificate.id}`}
                    certId={lastCertificate.id}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminCertificates;

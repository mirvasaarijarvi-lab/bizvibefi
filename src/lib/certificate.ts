import jsPDF from "jspdf";

export interface CertificateData {
  id: string;
  participant_name: string;
  course_title: string;
  course_content: string;
  method: string;
  method_details: string | null;
  completion_date: string; // ISO date
  issued_by_name: string;
  verify_url: string;
}

const methodLabels: Record<string, string> = {
  face_to_face: "Face to face",
  seminar: "Seminar",
  webinar: "Webinar",
  customized: "Customized",
  other: "Other",
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

/**
 * Generate a branded GoodVibesCafe certificate PDF (A4 landscape).
 * Uses HSL brand tokens converted to RGB:
 *   - purple-vivid 270 95% 58%  -> #7B2CF5
 *   - electric    225 100% 57%  -> #2461FF
 *   - turquoise   173 100% 45%  -> #00E6CC
 */
export const generateCertificatePdf = (data: CertificateData): Blob => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  // Outer border
  doc.setDrawColor(123, 44, 245);
  doc.setLineWidth(1.5);
  doc.rect(8, 8, W - 16, H - 16);

  // Inner accent border
  doc.setDrawColor(36, 97, 255);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, W - 24, H - 24);

  // Top gradient bar (faux gradient via three rectangles)
  doc.setFillColor(123, 44, 245);
  doc.rect(12, 12, (W - 24) / 3, 6, "F");
  doc.setFillColor(36, 97, 255);
  doc.rect(12 + (W - 24) / 3, 12, (W - 24) / 3, 6, "F");
  doc.setFillColor(0, 230, 204);
  doc.rect(12 + (2 * (W - 24)) / 3, 12, (W - 24) / 3, 6, "F");

  // Brand wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(123, 44, 245);
  doc.text("GoodVibesCafe", W / 2, 38, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(110, 110, 120);
  doc.text("CERTIFICATE OF COMPLETION", W / 2, 46, { align: "center" });

  // Decorative line
  doc.setDrawColor(0, 230, 204);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 30, 50, W / 2 + 30, 50);

  // Awarded to
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 90);
  doc.text("This certifies that", W / 2, 65, { align: "center" });

  // Participant name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(20, 20, 30);
  doc.text(data.participant_name, W / 2, 82, { align: "center" });

  // Has completed
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 90);
  doc.text("has successfully completed the course", W / 2, 95, { align: "center" });

  // Course title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(36, 97, 255);
  doc.text(data.course_title, W / 2, 110, { align: "center", maxWidth: W - 60 });

  // Course content (wrap)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 70);
  const contentLines = doc.splitTextToSize(data.course_content, W - 80);
  doc.text(contentLines, W / 2, 122, { align: "center" });

  // Footer details (left: date + method, right: issuer + verify)
  const footerY = H - 40;
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.3);
  doc.line(30, footerY - 4, W - 30, footerY - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 130);
  doc.text("DATE", 30, footerY);
  doc.text("METHOD", 30, footerY + 12);
  doc.text("ISSUED BY", W - 30, footerY, { align: "right" });
  doc.text("VERIFY", W - 30, footerY + 12, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 30);
  doc.text(formatDate(data.completion_date), 30, footerY + 5);
  const methodLabel = data.method === "other" && data.method_details
    ? `Other: ${data.method_details}`
    : methodLabels[data.method] ?? data.method;
  doc.text(methodLabel, 30, footerY + 17);
  doc.text(data.issued_by_name, W - 30, footerY + 5, { align: "right" });

  // Verify URL (clickable)
  doc.setTextColor(36, 97, 255);
  doc.setFontSize(9);
  doc.textWithLink(data.verify_url, W - 30, footerY + 17, { align: "right", url: data.verify_url });

  // Certificate ID footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 170);
  doc.text(`Certificate ID: ${data.id}`, W / 2, H - 16, { align: "center" });

  return doc.output("blob");
};

/**
 * Build a LinkedIn 'Add to Profile' deep link for a certification.
 * https://www.linkedin.com/help/linkedin/answer/a567169
 */
export const linkedInAddToProfileUrl = (params: {
  name: string;
  organizationName?: string;
  organizationId?: string;
  issueYear: number;
  issueMonth: number; // 1-12
  certUrl?: string;
  certId?: string;
}): string => {
  const u = new URL("https://www.linkedin.com/profile/add");
  u.searchParams.set("startTask", "CERTIFICATION_NAME");
  u.searchParams.set("name", params.name);
  if (params.organizationName) u.searchParams.set("organizationName", params.organizationName);
  if (params.organizationId) u.searchParams.set("organizationId", params.organizationId);
  u.searchParams.set("issueYear", String(params.issueYear));
  u.searchParams.set("issueMonth", String(params.issueMonth));
  if (params.certUrl) u.searchParams.set("certUrl", params.certUrl);
  if (params.certId) u.searchParams.set("certId", params.certId);
  return u.toString();
};

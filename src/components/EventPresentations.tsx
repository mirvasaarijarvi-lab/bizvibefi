import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Trash2, Download, Eye, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { EventPresentationDownloadStats } from "@/components/DownloadStatsBadge";

type Presentation = Tables<"event_presentations">;

const labels = (lang: string) => ({
  section: lang === "fi" ? "Esitykset (PDF)" : lang === "sv" ? "Presentationer (PDF)" : "Presentations (PDF)",
  helper:
    lang === "fi"
      ? "Lataa PDF-esityksiä. Vain ilmoittautuneet osallistujat näkevät ne tapahtuman jälkeen."
      : lang === "sv"
        ? "Ladda upp PDF-presentationer. Endast anmälda deltagare ser dem efter evenemanget."
        : "Upload PDF presentations. Only signed-up attendees can see them after the event.",
  upload: lang === "fi" ? "Lataa PDF" : lang === "sv" ? "Ladda upp PDF" : "Upload PDF",
  uploading: lang === "fi" ? "Lataa..." : lang === "sv" ? "Laddar..." : "Uploading...",
  delete: lang === "fi" ? "Poista" : lang === "sv" ? "Ta bort" : "Delete",
  none: lang === "fi" ? "Ei vielä esityksiä." : lang === "sv" ? "Inga presentationer ännu." : "No presentations yet.",
  view: lang === "fi" ? "Avaa" : lang === "sv" ? "Öppna" : "View",
  download: lang === "fi" ? "Lataa" : lang === "sv" ? "Ladda ner" : "Download",
  attendeesOnly:
    lang === "fi"
      ? "Esitykset ovat saatavilla vain ilmoittautuneille osallistujille."
      : lang === "sv"
        ? "Presentationer är endast tillgängliga för anmälda deltagare."
        : "Presentations are available only to signed-up attendees.",
  confirmDelete:
    lang === "fi" ? "Poistetaanko tämä esitys?" : lang === "sv" ? "Ta bort denna presentation?" : "Delete this presentation?",
});

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export function usePresentations(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-presentations", eventId],
    queryFn: async (): Promise<Presentation[]> => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_presentations")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!eventId,
  });
}

/** Admin/creator upload + delete UI used inside the event form. */
export function EventPresentationsManager({
  eventId,
  lang,
}: {
  eventId: string | undefined;
  lang: string;
}) {
  const l = labels(lang);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: presentations = [] } = usePresentations(eventId);
  const [uploading, setUploading] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (p: Presentation) => {
      const { error: storageErr } = await supabase.storage
        .from("event-presentations")
        .remove([p.file_path]);
      if (storageErr) throw storageErr;
      const { error } = await supabase
        .from("event_presentations")
        .delete()
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-presentations", eventId] });
      toast({ title: l.delete + " ✓" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !eventId) return;
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast({ title: "Too large", description: "Maximum 25 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const path = `${eventId}/${crypto.randomUUID()}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("event-presentations")
        .upload(path, file, { upsert: false, contentType: "application/pdf" });
      if (uploadErr) throw uploadErr;
      const title = file.name.replace(/\.pdf$/i, "").slice(0, 200) || "Presentation";
      const { data: userData } = await supabase.auth.getUser();
      const { error: insertErr } = await supabase.from("event_presentations").insert({
        event_id: eventId,
        title,
        file_path: path,
        file_size: file.size,
        mime_type: "application/pdf",
        uploaded_by: userData.user?.id ?? null,
      });
      if (insertErr) {
        await supabase.storage.from("event-presentations").remove([path]);
        throw insertErr;
      }
      queryClient.invalidateQueries({ queryKey: ["event-presentations", eventId] });
      toast({ title: "Uploaded ✓" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!eventId) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground font-body">
        {lang === "fi"
          ? "Tallenna tapahtuma ensin, sitten voit lisätä esityksiä."
          : lang === "sv"
            ? "Spara evenemanget först, sedan kan du lägga till presentationer."
            : "Save the event first to attach presentations."}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-display text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-turquoise" /> {l.section}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-1">{l.helper}</p>
        </div>
        <label>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button type="button" size="sm" variant="outline" className="font-body h-8" asChild>
            <span>
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 mr-1" />
              )}
              {uploading ? l.uploading : l.upload}
            </span>
          </Button>
        </label>
      </div>

      {presentations.length === 0 ? (
        <p className="text-xs text-muted-foreground font-body italic">{l.none}</p>
      ) : (
        <ul className="space-y-1.5">
          {presentations.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-foreground truncate">{p.title}</p>
                {p.file_size && (
                  <p className="text-xs text-muted-foreground font-body">{formatSize(p.file_size)}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive"
                onClick={() => {
                  if (confirm(l.confirmDelete)) deleteMutation.mutate(p);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function fetchSignedUrl(presentationId: string, download: boolean) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Sign in to access this presentation");
  }
  const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-event-presentation`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ presentation_id: presentationId, download }),
  });
  const text = await res.text();
  let parsed: { url?: string; error?: string } = {};
  try { parsed = JSON.parse(text); } catch { /* ignore */ }
  if (!res.ok || !parsed.url) {
    throw new Error(parsed.error || `HTTP ${res.status}`);
  }
  return parsed.url;
}

/** Viewer + download buttons shown on past event cards. */
export function EventPresentationsViewer({
  eventId,
  lang,
  hasAccess,
}: {
  eventId: string;
  lang: string;
  /** Whether current viewer is a signed-up attendee (or admin/creator). */
  hasAccess: boolean;
}) {
  const l = labels(lang);
  const { toast } = useToast();
  const { data: presentations = [], isLoading } = usePresentations(eventId);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (isLoading || presentations.length === 0) return null;

  const handleAction = async (p: Presentation, mode: "view" | "download") => {
    if (!hasAccess) {
      toast({ title: l.attendeesOnly, variant: "destructive" });
      return;
    }
    setLoadingId(p.id + mode);
    try {
      const url = await fetchSignedUrl(p.id, mode === "download");
      if (mode === "view") {
        setViewerTitle(p.title);
        setViewerUrl(url);
      } else {
        // Trigger download via hidden anchor
        const a = document.createElement("a");
        a.href = url;
        a.rel = "noopener noreferrer";
        a.click();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-xs font-display font-semibold uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5 text-turquoise" /> {l.section}
      </p>
      {!hasAccess && (
        <p className="text-xs text-muted-foreground font-body italic mb-2">{l.attendeesOnly}</p>
      )}
      <ul className="space-y-1.5">
        {presentations.map((p) => {
          const viewBusy = loadingId === p.id + "view";
          const dlBusy = loadingId === p.id + "download";
          return (
            <li
              key={p.id}
              className="flex items-center gap-2 bg-muted/30 border border-border rounded-md px-3 py-2"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-foreground truncate">{p.title}</p>
                {p.file_size && (
                  <p className="text-xs text-muted-foreground font-body">{formatSize(p.file_size)}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-body h-8"
                disabled={!hasAccess || viewBusy}
                onClick={() => handleAction(p, "view")}
              >
                {viewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                {!viewBusy && l.view}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-body h-8"
                disabled={!hasAccess || dlBusy}
                onClick={() => handleAction(p, "download")}
              >
                {dlBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                {!dlBusy && l.download}
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!viewerUrl} onOpenChange={(o) => { if (!o) setViewerUrl(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
            <DialogTitle className="font-display text-base truncate">{viewerTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted">
            {viewerUrl && (
              <iframe
                title={viewerTitle}
                src={viewerUrl}
                className="w-full h-full border-0"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

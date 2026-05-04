import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X as XIcon, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/json",
];

interface Props {
  fileUrl: string | null | undefined;
  fileName: string | null | undefined;
  /** subfolder under bucket, e.g. user.id or `admin/<itemId>` */
  pathPrefix: string;
  onChange: (next: { file_url: string | null; file_name: string | null }) => void | Promise<void>;
  label?: string;
}

const ShowcaseFileField = ({ fileUrl, fileName, pathPrefix, onChange, label }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast({ title: t("showcase.file.tooLarge"), variant: "destructive" });
      return;
    }
    if (ALLOWED.length && !ALLOWED.includes(file.type) && file.type !== "") {
      toast({ title: t("showcase.file.invalidType"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${pathPrefix}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("showcase-files").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("showcase-files").getPublicUrl(path);
      await onChange({ file_url: urlData.publicUrl, file_name: file.name });
      toast({ title: t("showcase.file.uploaded") });
    } catch {
      toast({ title: t("showcase.file.uploadFailed"), variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await onChange({ file_url: null, file_name: null });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Label>{label ?? t("showcase.file.label")}</Label>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.json"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {fileUrl ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border p-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-body truncate hover:underline flex-1">
            {fileName ?? t("showcase.file.download")}
          </a>
          <Button type="button" variant="ghost" size="sm" onClick={handlePick} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("showcase.file.replace")}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={handleRemove} disabled={busy}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          className="mt-1 w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-sm font-body">{t("showcase.file.upload")}</span>
        </button>
      )}
    </div>
  );
};

export default ShowcaseFileField;

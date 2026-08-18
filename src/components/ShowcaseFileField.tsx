import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X as XIcon, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 50 * 1024 * 1024; // 50MB to allow large infographics
const ALLOWED_PREFIXES = ["image/"]; // any image type
const ALLOWED_EXACT = [
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

const isAllowed = (type: string) =>
  type === "" ||
  ALLOWED_PREFIXES.some((p) => type.startsWith(p)) ||
  ALLOWED_EXACT.includes(type);

export interface ShowcaseFileItem {
  url: string;
  name: string;
}

interface Props {
  files: ShowcaseFileItem[];
  /** subfolder under bucket, e.g. user.id or `admin/<itemId>` */
  pathPrefix: string;
  onChange: (next: ShowcaseFileItem[]) => void | Promise<void>;
  label?: string;
  max?: number;
}

const ShowcaseFileField = ({ files, pathPrefix, onChange, label, max = 20 }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const uploadFiles = async (list: File[]) => {
    if (list.length === 0) return;
    setBusy(true);
    try {
      const uploaded: ShowcaseFileItem[] = [];
      for (const file of list) {
        if (file.size > MAX_BYTES) {
          toast({ title: t("showcase.file.tooLarge"), description: file.name, variant: "destructive" });
          continue;
        }
        if (!isAllowed(file.type)) {
          toast({ title: t("showcase.file.invalidType"), description: file.name, variant: "destructive" });
          continue;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("showcase-files")
          .upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("showcase-files").getPublicUrl(path);
        uploaded.push({ url: urlData.publicUrl, name: file.name });
      }
      if (uploaded.length > 0) {
        await onChange([...files, ...uploaded]);
        toast({ title: t("showcase.file.uploaded") });
      }
    } catch (err) {
      toast({
        title: t("showcase.file.uploadFailed"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (idx: number) => {
    await onChange(files.filter((_, i) => i !== idx));
  };

  const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name);

  const remaining = max - files.length;

  return (
    <div>
      <Label>{label ?? t("showcase.file.label")}</Label>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.json"
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? []).slice(0, remaining);
          if (fs.length > 0) uploadFiles(fs);
        }}
      />

      {files.length > 0 && (
        <ul className="mt-2 space-y-2">
          {files.map((f, i) => {
            const Icon = isImage(f.name) ? ImageIcon : FileText;
            return (
              <li key={`${f.url}-${i}`} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-body truncate hover:underline flex-1"
                >
                  {f.name}
                </a>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(i)} disabled={busy}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {files.length < max && (
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          className="mt-2 w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-sm font-body">
            {files.length === 0 ? t("showcase.file.upload") : t("showcase.file.addMore")}
          </span>
        </button>
      )}
    </div>
  );
};

export default ShowcaseFileField;

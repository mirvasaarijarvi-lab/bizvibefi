import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X as XIcon } from "lucide-react";

interface ShowcaseImagesFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  pathPrefix?: string;
  /** maximum images allowed */
  max?: number;
}

const ShowcaseImagesField = ({ images, onChange, pathPrefix, max = 10 }: ShowcaseImagesFieldProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = max - images.length;
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        if (!file.type.startsWith("image/")) {
          toast({ title: t("showcase.invalidFileType"), variant: "destructive" });
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: t("showcase.fileTooLarge"), variant: "destructive" });
          continue;
        }
        const ext = file.name.split(".").pop();
        const folder = pathPrefix ?? user.id;
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("showcase-images").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("showcase-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      onChange([...images, ...uploaded]);
    } catch {
      toast({ title: t("showcase.submitError"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div>
      <Label>{t("showcase.imagesLabel")}</Label>
      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-lg border border-border overflow-hidden bg-muted">
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                aria-label="Remove image"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < max && (
        <label className="mt-2 w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-sm font-body">{t("showcase.addImages")}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
};

export default ShowcaseImagesField;

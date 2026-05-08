import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  url: string;
  name?: string | null;
  /** show as compact thumbnail vs full aspect-video */
  variant?: "thumbnail" | "full";
}

const isImage = (url: string) => /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url);
const isPdf = (url: string) => /\.pdf(\?|$)/i.test(url);

const FilePreview = ({ url, name, variant = "full" }: FilePreviewProps) => {
  const [open, setOpen] = useState(false);
  const image = isImage(url);
  const pdf = isPdf(url);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const thumb = (
    <button
      type="button"
      onClick={handleOpen}
      className={`group relative block w-full overflow-hidden rounded-lg border border-border bg-muted ${
        variant === "thumbnail" ? "h-24" : "aspect-video"
      }`}
      aria-label={name ?? "Preview file"}
    >
      {image ? (
        <img
          src={url}
          alt={name ?? "Attachment"}
          className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
        />
      ) : pdf ? (
        <object data={`${url}#toolbar=0&navpanes=0&view=FitH`} type="application/pdf" className="w-full h-full pointer-events-none">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <FileText className="h-8 w-8" />
            <span className="text-xs font-body truncate px-2">{name ?? "PDF"}</span>
          </div>
        </object>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-3">
          <FileText className="h-8 w-8" />
          <span className="text-xs font-body truncate max-w-full">{name ?? "File"}</span>
        </div>
      )}
    </button>
  );

  return (
    <>
      {thumb}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b">
            <span className="text-sm font-body truncate">{name ?? "Attachment"}</span>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-1 h-3 w-3" /> Download
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
          <div className="w-full h-full bg-muted/30 flex items-center justify-center overflow-auto">
            {image ? (
              <img src={url} alt={name ?? "Attachment"} className="max-w-full max-h-full object-contain" />
            ) : pdf ? (
              <iframe src={url} title={name ?? "PDF"} className="w-full h-full border-0" />
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
                <FileText className="h-16 w-16" />
                <p className="font-body">{name ?? "File preview not available"}</p>
                <Button asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer" download>
                    Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilePreview;

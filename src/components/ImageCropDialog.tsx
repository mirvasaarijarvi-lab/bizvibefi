import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const ASPECT_RATIO = 16 / 9;
const MIN_DIMENSION = 200;

interface ImageCropDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedFile: File) => void;
}

function getCenterCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ASPECT_RATIO, width, height),
    width,
    height
  );
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      type,
      0.9
    );
  });
}

const ImageCropDialog = ({ file, open, onOpenChange, onCropComplete }: ImageCropDialogProps) => {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState("");
  const [saving, setSaving] = useState(false);

  // Load image when file changes
  const onFileLoad = useCallback(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  // Trigger load when dialog opens with a file
  if (open && file && !imgSrc) {
    onFileLoad();
  }

  // Reset state when dialog closes
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setImgSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
    onOpenChange(value);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(getCenterCrop(naturalWidth, naturalHeight));
  };

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;

    setSaving(true);
    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const canvas = document.createElement("canvas");
      const targetWidth = Math.max(completedCrop.width * scaleX, MIN_DIMENSION);
      const targetHeight = Math.max(completedCrop.height * scaleY, MIN_DIMENSION);
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        targetWidth,
        targetHeight
      );

      const mimeType = file?.type === "image/png" ? "image/png" : "image/jpeg";
      const ext = mimeType === "image/png" ? "png" : "jpg";
      const blob = await canvasToBlob(canvas, mimeType);
      const croppedFile = new File([blob], `cropped.${ext}`, { type: mimeType });

      onCropComplete(croppedFile);
      handleOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("showcase.crop.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-body">{t("showcase.crop.description")}</p>
        {imgSrc && (
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={ASPECT_RATIO}
              minWidth={50}
              minHeight={28}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[50vh] object-contain"
              />
            </ReactCrop>
          </div>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("showcase.crop.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !completedCrop}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {t("showcase.crop.apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;

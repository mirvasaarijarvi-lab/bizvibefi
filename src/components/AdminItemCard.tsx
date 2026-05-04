import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpdateShowcaseStatus, useUpdateShowcaseImage } from "@/hooks/useAdminShowcase";
import type { ShowcaseItem, ApprovalStatus } from "@/hooks/useShowcase";
import { CheckCircle, XCircle, Clock, ExternalLink, Lightbulb, MessageSquare, Wrench, ImagePlus, Trash2, Loader2, Pencil, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageDropZone from "@/components/ImageDropZone";
import ImageCropDialog from "@/components/ImageCropDialog";
import AdminEditDialog from "@/components/AdminEditDialog";
import RejectDialog from "@/components/RejectDialog";
import FilePreview from "@/components/FilePreview";

const typeIcons: Record<string, React.ElementType> = {
  case_study: Lightbulb,
  testimonial: MessageSquare,
  tool: Wrench,
};

const statusConfig: Record<ApprovalStatus, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { icon: Clock, variant: "secondary" },
  approved: { icon: CheckCircle, variant: "default" },
  rejected: { icon: XCircle, variant: "destructive" },
};

interface AdminItemCardProps {
  item: ShowcaseItem;
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
}

const AdminItemCard = ({ item, selected, onSelectChange }: AdminItemCardProps) => {
  const { t } = useTranslation();
  const updateStatus = useUpdateShowcaseStatus();
  const updateImage = useUpdateShowcaseImage();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const Icon = typeIcons[item.type] || Lightbulb;
  const statusInfo = statusConfig[item.status];
  const StatusIcon = statusInfo.icon;

  const handleStatusChange = async (status: ApprovalStatus) => {
    try {
      await updateStatus.mutateAsync({ id: item.id, status });
      toast({ title: `Item ${status}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleFileSelected = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("showcase.fileTooLarge"), variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: t("showcase.invalidFileType"), variant: "destructive" });
      return;
    }
    setCropFile(file);
    setCropOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setUploading(true);
    try {
      const ext = croppedFile.name.split(".").pop();
      const path = `admin/${item.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("showcase-images")
        .upload(path, croppedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("showcase-images")
        .getPublicUrl(path);

      await updateImage.mutateAsync({ id: item.id, image_url: urlData.publicUrl });
      toast({ title: t("admin.showcase.imageUpdated") });
    } catch {
      toast({ title: t("admin.showcase.imageUploadFailed"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = async () => {
    try {
      await updateImage.mutateAsync({ id: item.id, image_url: null });
      toast({ title: t("admin.showcase.imageRemoved") });
    } catch {
      toast({ title: "Failed to remove image", variant: "destructive" });
    }
  };

  return (
    <Card className={cn("flex flex-col", selected && "ring-2 ring-primary")}>
      {onSelectChange && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange(!!checked)}
            aria-label={`Select ${item.title}`}
          />
        </div>
      )}
      <ImageDropZone onFileSelected={handleFileSelected} disabled={uploading}>
        {({ openPicker, isDragging }) => (
          <div className={cn("relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted", isDragging && "bg-primary/5")}>
            {item.image_url ? (
              <>
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                {isDragging && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <p className="text-sm font-medium text-primary-foreground bg-primary/80 px-3 py-1 rounded">{t("showcase.dropHere")}</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={openPicker} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="destructive" size="icon" className="h-7 w-7" onClick={handleImageRemove} disabled={updateImage.isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <button
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={openPicker}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isDragging ? (
                  <p className="text-sm font-medium text-primary">{t("showcase.dropHere")}</p>
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs font-medium">{t("admin.showcase.addImage")}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </ImageDropZone>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{item.title}</CardTitle>
          </div>
          <Badge variant={statusInfo.variant} className="text-xs gap-1 shrink-0">
            <StatusIcon className="h-3 w-3" /> {item.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="outline" className="text-xs">{item.type.replace("_", " ")}</Badge>
          {item.category_tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <p className="text-sm text-muted-foreground font-body">{item.description}</p>
        {item.content && (
          <p className="text-sm text-muted-foreground font-body mt-2 line-clamp-3">{item.content}</p>
        )}
        {item.pricing_info && (
          <p className="mt-2 text-sm font-semibold text-primary font-body">{item.pricing_info}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground font-body">
          {t("admin.showcase.submittedAt")}: {new Date(item.created_at).toLocaleDateString()}
        </p>
      </CardContent>
      {item.file_url && (
        <div className="px-6 pb-2">
          <a
            href={item.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body"
          >
            <FileText className="h-3.5 w-3.5" />
            {item.file_name ?? t("showcase.file.download")}
          </a>
        </div>
      )}
      <CardFooter className="gap-2 flex-wrap pt-0">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1 h-3 w-3" /> {t("admin.showcase.edit.editBtn")}
        </Button>
        {item.link_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={item.link_url} target="_blank" rel="noopener noreferrer">
              {t("showcase.visitLink")} <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
        {item.status !== "approved" && (
          <Button
            size="sm"
            onClick={() => handleStatusChange("approved")}
            disabled={updateStatus.isPending}
          >
            <CheckCircle className="mr-1 h-3 w-3" /> {t("admin.showcase.approve")}
          </Button>
        )}
        {item.status !== "rejected" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRejectOpen(true)}
            disabled={updateStatus.isPending}
          >
            <XCircle className="mr-1 h-3 w-3" /> {t("admin.showcase.rejectBtn")}
          </Button>
        )}
        {item.status !== "pending" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("pending")}
            disabled={updateStatus.isPending}
          >
            <Clock className="mr-1 h-3 w-3" /> {t("admin.showcase.resetPending")}
          </Button>
        )}
      </CardFooter>
      <AdminEditDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
      <RejectDialog itemId={item.id} itemTitle={item.title} open={rejectOpen} onOpenChange={setRejectOpen} />
      <ImageCropDialog file={cropFile} open={cropOpen} onOpenChange={setCropOpen} onCropComplete={handleCropComplete} />
    </Card>
  );
};

export default AdminItemCard;

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useUpdateShowcaseStatus } from "@/hooks/useAdminShowcase";
import { Loader2, XCircle } from "lucide-react";

interface RejectDialogProps {
  itemId: string;
  itemTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RejectDialog = ({ itemId, itemTitle, open, onOpenChange }: RejectDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const updateStatus = useUpdateShowcaseStatus();
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({ title: t("admin.showcase.reject.reasonRequired"), variant: "destructive" });
      return;
    }

    try {
      await updateStatus.mutateAsync({
        id: itemId,
        status: "rejected",
        rejection_reason: reason.trim(),
      });
      toast({ title: t("admin.showcase.reject.success") });
      setReason("");
      onOpenChange(false);
    } catch {
      toast({ title: t("admin.showcase.reject.failed"), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.showcase.reject.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-body">
          {t("admin.showcase.reject.description", { title: itemTitle })}
        </p>
        <div className="space-y-2">
          <Label>{t("admin.showcase.reject.reasonLabel")}</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("admin.showcase.reject.reasonPlaceholder")}
            rows={4}
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin.showcase.reject.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={updateStatus.isPending || !reason.trim()}
          >
            {updateStatus.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            <XCircle className="mr-1 h-3 w-3" />
            {t("admin.showcase.reject.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectDialog;

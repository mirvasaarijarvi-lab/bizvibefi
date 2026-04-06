import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useBulkUpdateShowcaseStatus } from "@/hooks/useAdminShowcase";
import { CheckCircle, XCircle, Clock, Loader2, X } from "lucide-react";
import RejectDialog from "@/components/RejectDialog";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
}

const BulkActionBar = ({ selectedIds, onClear }: BulkActionBarProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const bulkUpdate = useBulkUpdateShowcaseStatus();
  const [rejectOpen, setRejectOpen] = useState(false);
  const count = selectedIds.length;

  if (count === 0) return null;

  const handleBulkAction = async (status: "approved" | "pending") => {
    try {
      await bulkUpdate.mutateAsync({ ids: selectedIds, status });
      toast({ title: t("admin.showcase.bulk.success").replace("{count}", String(count)) });
      onClear();
    } catch {
      toast({ title: t("admin.showcase.bulk.failed"), variant: "destructive" });
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
        <span className="text-sm font-medium font-body">
          {t("admin.showcase.bulk.selected").replace("{count}", String(count))}
        </span>
        <Button size="sm" onClick={() => handleBulkAction("approved")} disabled={bulkUpdate.isPending}>
          {bulkUpdate.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
          {t("admin.showcase.bulk.approveAll")}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={bulkUpdate.isPending}>
          <XCircle className="mr-1 h-3 w-3" /> {t("admin.showcase.bulk.rejectAll")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleBulkAction("pending")} disabled={bulkUpdate.isPending}>
          <Clock className="mr-1 h-3 w-3" /> {t("admin.showcase.bulk.resetAll")}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 ml-1" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <RejectDialog
        itemId={selectedIds.join(",")}
        itemTitle={`${count} items`}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        bulk
        bulkIds={selectedIds}
        onBulkComplete={onClear}
      />
    </>
  );
};

export default BulkActionBar;

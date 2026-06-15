import { useQuery } from "@tanstack/react-query";
import { Download, Users, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAdminShowcase";

type ShowcaseRow = {
  file_url: string;
  file_name: string | null;
  downloads: number;
  unique_downloaders: number;
  last_download_at: string | null;
};

type PresentationRow = {
  presentation_id: string;
  presentation_title: string;
  downloads: number;
  unique_downloaders: number;
  denied: number;
  last_download_at: string | null;
};

/** Tiny pill used inside the badge. */
function Pill({
  icon: Icon,
  children,
  tone = "default",
  title,
}: {
  icon: typeof Download;
  children: React.ReactNode;
  tone?: "default" | "danger";
  title?: string;
}) {
  const cls =
    tone === "danger"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-muted text-foreground border-border";
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-body ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

/** Admin-only stats for a single Showcase file. */
export function ShowcaseFileDownloadStats({
  itemId,
  fileUrl,
}: {
  itemId: string;
  fileUrl: string;
}) {
  const isAdmin = useIsAdmin();
  const { data } = useQuery({
    queryKey: ["showcase-download-stats", itemId],
    enabled: isAdmin && !!itemId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_showcase_download_stats", {
        _item_id: itemId,
      });
      if (error) throw error;
      return (data ?? []) as ShowcaseRow[];
    },
  });

  if (!isAdmin) return null;
  const row = data?.find((r) => r.file_url === fileUrl);
  const downloads = row?.downloads ?? 0;
  const unique = row?.unique_downloaders ?? 0;
  const last = row?.last_download_at;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <Pill icon={Download} title="Total downloads">
        {downloads}
      </Pill>
      <Pill icon={Users} title="Unique downloaders">
        {unique}
      </Pill>
      {last && (
        <span
          className="text-[11px] text-muted-foreground font-body"
          title={new Date(last).toLocaleString()}
        >
          last {formatDistanceToNow(new Date(last), { addSuffix: true })}
        </span>
      )}
    </div>
  );
}

/** Admin-only stats for a single Event presentation. */
export function EventPresentationDownloadStats({
  eventId,
  presentationId,
}: {
  eventId: string;
  presentationId: string;
}) {
  const isAdmin = useIsAdmin();
  const { data } = useQuery({
    queryKey: ["event-presentation-stats", eventId],
    enabled: isAdmin && !!eventId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_event_presentation_download_stats",
        { _event_id: eventId },
      );
      if (error) throw error;
      return (data ?? []) as PresentationRow[];
    },
  });

  if (!isAdmin) return null;
  const row = data?.find((r) => r.presentation_id === presentationId);
  const downloads = row?.downloads ?? 0;
  const unique = row?.unique_downloaders ?? 0;
  const denied = row?.denied ?? 0;
  const last = row?.last_download_at;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <Pill icon={Download} title="Total downloads">
        {downloads}
      </Pill>
      <Pill icon={Users} title="Unique downloaders">
        {unique}
      </Pill>
      {denied > 0 && (
        <Pill icon={Ban} tone="danger" title="Denied attempts">
          {denied}
        </Pill>
      )}
      {last && (
        <span
          className="text-[11px] text-muted-foreground font-body"
          title={new Date(last).toLocaleString()}
        >
          last {formatDistanceToNow(new Date(last), { addSuffix: true })}
        </span>
      )}
    </div>
  );
}

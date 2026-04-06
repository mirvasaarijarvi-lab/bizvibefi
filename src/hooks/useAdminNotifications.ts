import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./useAdminShowcase";
import { useEffect } from "react";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  sender_name: string | null;
  sender_email: string | null;
  is_read: boolean;
  created_at: string;
}

export const useAdminNotifications = () => {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, queryClient]);

  return useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AdminNotification[];
    },
    enabled: isAdmin,
  });
};

export const useUnreadCount = () => {
  const { data } = useAdminNotifications();
  return data?.filter((n) => !n.is_read).length ?? 0;
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true } as any)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });
};

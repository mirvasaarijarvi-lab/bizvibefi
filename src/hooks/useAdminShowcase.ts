import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ApprovalStatus, ShowcaseItem } from "./useShowcase";

export const useUserRole = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map((r) => r.role) ?? [];
    },
    enabled: !!user,
  });
};

export const useIsAdmin = () => {
  const { data: roles } = useUserRole();
  return roles?.some((r) => r === "admin" || r === "superadmin") ?? false;
};

export const useIsSuperadmin = () => {
  const { data: roles } = useUserRole();
  return roles?.some((r) => r === "superadmin") ?? false;
};

export const usePendingShowcaseItems = () => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: ["showcase", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_items")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ShowcaseItem[];
    },
    enabled: isAdmin,
  });
};

export const useAllShowcaseItems = () => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: ["showcase", "admin-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ShowcaseItem[];
    },
    enabled: isAdmin,
  });
};

export const useUpdateShowcaseStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: ApprovalStatus; rejection_reason?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "rejected" && rejection_reason) {
        update.rejection_reason = rejection_reason;
      } else if (status !== "rejected") {
        update.rejection_reason = null;
      }
      const { error } = await supabase
        .from("showcase_items")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showcase"] });
    },
  });
};

export const useBulkUpdateShowcaseStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status, rejection_reason }: { ids: string[]; status: ApprovalStatus; rejection_reason?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "rejected" && rejection_reason) {
        update.rejection_reason = rejection_reason;
      } else if (status !== "rejected") {
        update.rejection_reason = null;
      }
      const { error } = await supabase
        .from("showcase_items")
        .update(update)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showcase"] });
    },
  });
};

export const useUpdateShowcaseImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image_url }: { id: string; image_url: string | null }) => {
      const { error } = await supabase
        .from("showcase_items")
        .update({ image_url })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showcase"] });
    },
  });
};

export const useUpdateShowcaseFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file_url, file_name }: { id: string; file_url: string | null; file_name: string | null }) => {
      const { error } = await supabase
        .from("showcase_items")
        .update({ file_url, file_name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showcase"] });
    },
  });
};

export interface ShowcaseFieldsUpdate {
  title?: string;
  description?: string;
  content?: string | null;
  challenge?: string | null;
  solution?: string | null;
  benefits?: string[] | null;
  key_figures?: Record<string, unknown>[] | null;
  link_url?: string | null;
  link_urls?: { label?: string; url: string }[] | null;
  category_tags?: string[];
  pricing_info?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  file_url?: string | null;
  file_name?: string | null;
  file_urls?: { url: string; name: string }[] | null;
  type?: "case_study" | "testimonial" | "tool" | "guidebook" | "sample_code" | "infographic";
}

export const useUpdateShowcaseFields = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: ShowcaseFieldsUpdate }) => {
      const { error } = await supabase
        .from("showcase_items")
        .update(fields as unknown as Record<string, unknown>)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showcase"] });
    },
  });
};

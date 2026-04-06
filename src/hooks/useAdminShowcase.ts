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
      return (data ?? []) as ShowcaseItem[];
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
      return (data ?? []) as ShowcaseItem[];
    },
    enabled: isAdmin,
  });
};

export const useUpdateShowcaseStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApprovalStatus }) => {
      const { error } = await supabase
        .from("showcase_items")
        .update({ status })
        .eq("id", id);
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

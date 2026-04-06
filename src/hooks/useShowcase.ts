import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ShowcaseType = "case_study" | "testimonial" | "tool";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ShowcaseItem {
  id: string;
  user_id: string;
  type: ShowcaseType;
  title: string;
  description: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  category_tags: string[];
  pricing_info: string | null;
  status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

export interface ShowcaseReview {
  id: string;
  showcase_item_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

export const useShowcaseItems = (type?: ShowcaseType) => {
  return useQuery({
    queryKey: ["showcase", type],
    queryFn: async () => {
      let query = supabase
        .from("showcase_items")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (type) query = query.eq("type", type);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ShowcaseItem[];
    },
  });
};

export const useMyShowcaseItems = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["showcase", "mine", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("showcase_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ShowcaseItem[];
    },
    enabled: !!user,
  });
};

export const useShowcaseReviews = (itemId: string) => {
  return useQuery({
    queryKey: ["showcase-reviews", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_reviews")
        .select("*, profiles!showcase_reviews_user_id_fkey(display_name, avatar_url)")
        .eq("showcase_item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ShowcaseReview[];
    },
    enabled: !!itemId,
  });
};

export const useCreateShowcaseItem = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      type: ShowcaseType;
      title: string;
      description: string;
      content?: string;
      image_url?: string;
      link_url?: string;
      category_tags?: string[];
      pricing_info?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("showcase_items")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showcase"] });
    },
  });
};

export const useCreateReview = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      showcase_item_id: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("showcase_reviews")
        .insert({ ...review, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["showcase-reviews", vars.showcase_item_id] });
    },
  });
};

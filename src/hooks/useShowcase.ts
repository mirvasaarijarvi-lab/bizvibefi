import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ShowcaseType = "case_study" | "testimonial" | "tool" | "guidebook" | "sample_code" | "infographic" | "tool_to_test";

export const TOOL_TEST_REASONS = [
  "feedback",
  "comments",
  "beta_test",
  "early_adoption",
  "code_review",
  "ux_review",
  "bug_hunting",
] as const;
export type ToolTestReason = (typeof TOOL_TEST_REASONS)[number];
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface KeyFigure {
  label: string;
  value: string;
}

export interface ShowcaseItem {
  id: string;
  user_id: string;
  type: ShowcaseType;
  title: string;
  description: string;
  content: string | null;
  challenge: string | null;
  solution: string | null;
  benefits: string[] | null;
  key_figures: KeyFigure[] | null; // stored as jsonb, cast from Json
  image_url: string | null;
  image_urls: string[] | null;
  file_url: string | null;
  file_name: string | null;
  file_urls: { url: string; name: string }[] | null;
  link_url: string | null;
  link_urls: { label?: string; url: string }[] | null;
  category_tags: string[];
  pricing_info: string | null;
  test_reasons: string[] | null;
  test_reasons_other: string | null;
  rejection_reason: string | null;
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
      return (data ?? []) as unknown as ShowcaseItem[];
    },
  });
};

export const useShowcaseItem = (id: string) => {
  return useQuery({
    queryKey: ["showcase", "item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_items")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      const { data: profileRows } = await supabase.rpc("get_public_profile", { _user_id: data.user_id });
      const profile = ((profileRows ?? []) as unknown as { display_name: string | null; avatar_url: string | null }[])[0] ?? null;

      return { ...data, profiles: profile } as unknown as ShowcaseItem;
    },
    enabled: !!id,
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
      return (data ?? []) as unknown as ShowcaseItem[];
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
        .select("*")
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
      challenge?: string;
      solution?: string;
      benefits?: string[];
      key_figures?: KeyFigure[];
      image_url?: string;
      image_urls?: string[];
      file_url?: string;
      file_name?: string;
      file_urls?: { url: string; name: string }[];
      link_url?: string;
      link_urls?: { label?: string; url: string }[];
      category_tags?: string[];
      pricing_info?: string;
      test_reasons?: string[];
      test_reasons_other?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        type: item.type,
        title: item.title,
        description: item.description,
        content: item.content,
        challenge: item.challenge,
        solution: item.solution,
        benefits: item.benefits,
        key_figures: item.key_figures as unknown as Record<string, unknown>[],
        image_url: item.image_url,
        image_urls: item.image_urls as unknown as Record<string, unknown>[] | undefined,
        file_url: item.file_url,
        file_name: item.file_name,
        file_urls: item.file_urls as unknown as Record<string, unknown>[] | undefined,
        link_url: item.link_url,
        link_urls: item.link_urls as unknown as Record<string, unknown>[] | undefined,
        category_tags: item.category_tags,
        pricing_info: item.pricing_info,
        user_id: user.id,
      };
      const { data, error } = await supabase
        .from("showcase_items")
        .insert(payload as never)
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

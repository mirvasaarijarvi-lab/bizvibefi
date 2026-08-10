import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type RecruitmentPostType = "open_position" | "training" | "seeking_work";
export type RecruitmentStatus = "pending" | "approved" | "rejected";

export interface RecruitmentPost {
  id: string;
  user_id: string;
  type: RecruitmentPostType;
  title: string;
  description: string;
  organization: string | null;
  location: string | null;
  is_remote: boolean;
  employment_type: string | null;
  apply_url: string | null;
  apply_email: string | null;
  allow_contact_request: boolean;
  tags: string[];
  status: RecruitmentStatus;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentPostInput {
  type: RecruitmentPostType;
  title: string;
  description: string;
  organization?: string | null;
  location?: string | null;
  is_remote: boolean;
  employment_type?: string | null;
  apply_url?: string | null;
  apply_email?: string | null;
  allow_contact_request: boolean;
  tags: string[];
  expires_at?: string | null;
}

export const RECRUITMENT_TYPE_LABELS: Record<RecruitmentPostType, string> = {
  open_position: "Open position",
  training: "Training to jobs",
  seeking_work: "Seeking employment",
};

/** Approved posts, visible to everyone (including visitors).
 *  Served through an RPC so contact emails stay hidden from anonymous visitors. */
export const useRecruitmentPosts = (type?: RecruitmentPostType | "all") => {
  return useQuery({
    queryKey: ["recruitment-posts", type ?? "all"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_public_recruitment_posts");
      if (error) throw error;
      const posts = (data ?? []) as unknown as RecruitmentPost[];
      return type && type !== "all" ? posts.filter((p) => p.type === type) : posts;
    },
  });
};


/** The signed-in member's own posts, any status. */
export const useMyRecruitmentPosts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-recruitment-posts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruitment_posts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RecruitmentPost[];
    },
    enabled: !!user,
  });
};

export const useAllRecruitmentPosts = (enabled = true) => {
  return useQuery({
    queryKey: ["admin-recruitment-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruitment_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RecruitmentPost[];
    },
    enabled,
  });
};

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["recruitment-posts"] });
  qc.invalidateQueries({ queryKey: ["my-recruitment-posts"] });
  qc.invalidateQueries({ queryKey: ["admin-recruitment-posts"] });
};

export const useCreateRecruitmentPost = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecruitmentPostInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("recruitment_posts")
        .insert({ ...input, user_id: user.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(qc),
  });
};

export const useUpdateRecruitmentPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecruitmentPostInput> & { id: string }) => {
      const { error } = await supabase
        .from("recruitment_posts")
        .update(updates as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
};

export const useDeleteRecruitmentPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recruitment_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
};

export const useModerateRecruitmentPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejection_reason,
    }: {
      id: string;
      status: RecruitmentStatus;
      rejection_reason?: string | null;
    }) => {
      const { error } = await supabase
        .from("recruitment_posts")
        .update({ status, rejection_reason: rejection_reason ?? null } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
};

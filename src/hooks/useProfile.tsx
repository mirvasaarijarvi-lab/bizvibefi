import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WebsiteLink {
  label: string;
  url: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  linkedin_url: string | null;
  website_links: WebsiteLink[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  membership_tier: "starter" | "viber" | "vibetor";
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data as unknown as Profile;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "display_name" | "bio" | "company" | "linkedin_url" | "avatar_url" | "contact_email" | "contact_phone">> & { website_links?: WebsiteLink[] }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .update(updates as never)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};

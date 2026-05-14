import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BadgeDef {
  id: string;
  code: string;
  category: string;
  subcategory: string | null;
  tier: number | null;
  name: string;
  description: string;
  icon: string;
  color: string;
  bonus_points: number;
  requires_peer: boolean;
  requires_founder: boolean;
  is_diamond: boolean;
  evidence_hint: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface BadgeClaim {
  id: string;
  badge_id: string;
  user_id: string;
  evidence: string;
  peer_user_id: string | null;
  peer_confirmed: boolean | null;
  peer_confirmed_at: string | null;
  status: "pending_peer" | "pending_review" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  badge?: BadgeDef;
  claimant?: { display_name: string | null; avatar_url: string | null };
  peer?: { display_name: string | null; avatar_url: string | null };
}

export interface MemberBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: BadgeDef;
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  membership_tier: string;
  badge_count: number;
  total_points: number;
  is_founder: boolean;
}

export const useBadgeCatalog = () =>
  useQuery({
    queryKey: ["badge-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_catalog" as never)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as BadgeDef[];
    },
  });

export const useMyBadges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["member-badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("member_badges" as never)
        .select("*, badge:badge_catalog(*)")
        .eq("user_id", user.id)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return data as unknown as MemberBadge[];
    },
    enabled: !!user,
  });
};

export const useMemberBadges = (userId: string | undefined) =>
  useQuery({
    queryKey: ["member-badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("member_badges" as never)
        .select("*, badge:badge_catalog(*)")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return data as unknown as MemberBadge[];
    },
    enabled: !!userId,
  });

export const useMyClaims = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-claims", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("badge_claims" as never)
        .select("*, badge:badge_catalog(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BadgeClaim[];
    },
    enabled: !!user,
  });
};

export const usePeerClaims = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["peer-claims", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("badge_claims" as never)
        .select("*, badge:badge_catalog(*)")
        .eq("peer_user_id", user.id)
        .is("peer_confirmed", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Enrich with claimant profile
      const userIds = (data as unknown as BadgeClaim[]).map((c) => c.user_id);
      if (userIds.length === 0) return data as unknown as BadgeClaim[];
      const { data: profiles } = await supabase.rpc("list_public_profiles");
      const idSet = new Set(userIds);
      const map = new Map(
        ((profiles ?? []) as unknown as { user_id: string; display_name: string | null; avatar_url: string | null }[])
          .filter((p) => idSet.has(p.user_id))
          .map((p) => [p.user_id, p])
      );
      return (data as unknown as BadgeClaim[]).map((c) => ({
        ...c,
        claimant: map.get(c.user_id) as { display_name: string | null; avatar_url: string | null } | undefined,
      }));
    },
    enabled: !!user,
  });
};

export const useAllPendingClaims = () =>
  useQuery({
    queryKey: ["all-pending-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_claims" as never)
        .select("*, badge:badge_catalog(*)")
        .in("status", ["pending_peer", "pending_review"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      const claims = data as unknown as BadgeClaim[];
      const userIds = Array.from(new Set([
        ...claims.map((c) => c.user_id),
        ...claims.map((c) => c.peer_user_id).filter(Boolean) as string[],
      ]));
      if (userIds.length === 0) return claims;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return claims.map((c) => ({
        ...c,
        claimant: map.get(c.user_id) as { display_name: string | null; avatar_url: string | null } | undefined,
        peer: c.peer_user_id ? (map.get(c.peer_user_id) as { display_name: string | null; avatar_url: string | null } | undefined) : undefined,
      }));
    },
  });

export const useLeaderboard = () =>
  useQuery({
    queryKey: ["badge-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_badge_leaderboard" as never);
      if (error) throw error;
      return (data as unknown as LeaderboardRow[]).filter((r) => !r.is_founder);
    },
  });

export const useAllMemberBadges = (userIds: string[]) =>
  useQuery({
    queryKey: ["all-member-badges", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {} as Record<string, Set<string>>;
      const { data, error } = await supabase
        .from("member_badges" as never)
        .select("user_id, badge_id")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, Set<string>> = {};
      for (const row of (data as unknown as { user_id: string; badge_id: string }[])) {
        if (!map[row.user_id]) map[row.user_id] = new Set();
        map[row.user_id].add(row.badge_id);
      }
      return map;
    },
    enabled: userIds.length > 0,
  });

export const useCreateClaim = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { badge_id: string; evidence: string; peer_user_id?: string | null; requires_peer: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("badge_claims" as never).insert({
        badge_id: input.badge_id,
        user_id: user.id,
        evidence: input.evidence,
        peer_user_id: input.peer_user_id ?? null,
        status: input.requires_peer && input.peer_user_id ? "pending_peer" : "pending_review",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Claim submitted");
      qc.invalidateQueries({ queryKey: ["my-claims"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const usePeerRespond = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ claimId, confirm }: { claimId: string; confirm: boolean }) => {
      const { error } = await supabase
        .from("badge_claims" as never)
        .update({ peer_confirmed: confirm } as never)
        .eq("id", claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Response recorded");
      qc.invalidateQueries({ queryKey: ["peer-claims"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useAdminReviewClaim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ claimId, status, reason }: { claimId: string; status: "approved" | "rejected"; reason?: string }) => {
      const { error } = await supabase
        .from("badge_claims" as never)
        .update({ status, rejection_reason: reason ?? null } as never)
        .eq("id", claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Claim updated");
      qc.invalidateQueries({ queryKey: ["all-pending-claims"] });
      qc.invalidateQueries({ queryKey: ["badge-leaderboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

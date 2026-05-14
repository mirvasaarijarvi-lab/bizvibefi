import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CourseMethod = "face_to_face" | "seminar" | "webinar" | "customized" | "other";

export interface Course {
  id: string;
  title: string;
  summary: string;
  default_method: CourseMethod;
  badge_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CourseCertificate {
  id: string;
  course_id: string;
  participant_user_id: string | null;
  participant_name: string;
  course_title: string;
  course_content: string;
  method: CourseMethod;
  method_details: string | null;
  completion_date: string;
  issued_by: string;
  issued_by_name: string;
  pdf_url: string | null;
  created_at: string;
}

export const useCourses = () =>
  useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses" as never)
        .select("*")
        .order("title", { ascending: true });
      if (error) throw error;
      return data as unknown as Course[];
    },
  });

export const useMyCertificates = (userId: string | undefined) =>
  useQuery({
    queryKey: ["my-certificates", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("course_certificates" as never)
        .select("*")
        .eq("participant_user_id", userId)
        .order("completion_date", { ascending: false });
      if (error) throw error;
      return data as unknown as CourseCertificate[];
    },
    enabled: !!userId,
  });

export const useCertificate = (id: string | undefined) =>
  useQuery({
    queryKey: ["certificate", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .rpc("verify_certificate" as never, { _id: id } as never);
      if (error) throw error;
      const rows = data as unknown as CourseCertificate[] | null;
      return rows?.[0] ?? null;
    },
    enabled: !!id,
  });

export const useIssueCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      course_id: string;
      participant_user_id: string | null;
      participant_name: string;
      course_title: string;
      course_content: string;
      method: CourseMethod;
      method_details: string | null;
      completion_date: string;
      issued_by: string;
      issued_by_name: string;
    }) => {
      const { data, error } = await supabase
        .from("course_certificates" as never)
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CourseCertificate;
    },
    onSuccess: () => {
      toast.success("Certificate issued");
      qc.invalidateQueries({ queryKey: ["my-certificates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateCertificatePdfUrl = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pdf_url }: { id: string; pdf_url: string }) => {
      const { error } = await supabase
        .from("course_certificates" as never)
        .update({ pdf_url } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-certificates"] });
      qc.invalidateQueries({ queryKey: ["certificate"] });
    },
  });
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const RoleEnum = z.enum(["admin", "moderator", "user", "superadmin"]);
const CreateUserSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
  display_name: z.string().trim().min(1).max(100).optional(),
  role: RoleEnum.optional(),
});
const DeleteUserSchema = z.object({ user_id: z.string().uuid() });
const UpdatePasswordSchema = z.object({
  user_id: z.string().uuid(),
  password: z.string().min(12).max(200),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "superadmin")
      .maybeSingle();

    if (!roleCheck) throw new Error("Only superadmins can perform this action");

    const { action, ...params } = await req.json();

    if (action === "create_user") {
      const parsed = CreateUserSchema.safeParse(params);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { email, password, display_name, role } = parsed.data;
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: display_name },
      });
      if (error) throw error;

      // Update role if not default 'user'
      if (role && role !== "user" && data.user) {
        await supabaseAdmin
          .from("user_roles")
          .update({ role })
          .eq("user_id", data.user.id);
      }

      return new Response(JSON.stringify({ success: true, user_id: data.user?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      const parsed = DeleteUserSchema.safeParse(params);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { user_id } = parsed.data;
      if (user_id === caller.id) throw new Error("Cannot delete your own account");

      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_password") {
      const parsed = UpdatePasswordSchema.safeParse(params);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { user_id, password } = parsed.data;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

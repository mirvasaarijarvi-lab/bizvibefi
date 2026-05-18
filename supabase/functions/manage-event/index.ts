import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EventFields = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  agenda: z.string().trim().max(5000).nullable().optional(),
  event_type: z.enum(["meetup", "webinar", "workshop", "hackathon"]),
  starts_at: z.string().datetime({ message: "starts_at must be ISO datetime" }),
  ends_at: z.string().datetime().nullable().optional(),
  location: z.string().trim().max(500).nullable().optional(),
  is_online: z.boolean(),
  online_url: z.string().trim().url("online_url must be a valid URL").max(500).nullable().optional().or(z.literal("").transform(() => null)),
  max_attendees: z.number().int().positive().max(100000).nullable().optional(),
  is_published: z.boolean(),
  image_url: z.string().trim().url().max(1000).nullable().optional().or(z.literal("").transform(() => null)),
  title_fi: z.string().trim().max(200).nullable().optional(),
  title_sv: z.string().trim().max(200).nullable().optional(),
  description_fi: z.string().trim().max(2000).nullable().optional(),
  description_sv: z.string().trim().max(2000).nullable().optional(),
  location_fi: z.string().trim().max(500).nullable().optional(),
  location_sv: z.string().trim().max(500).nullable().optional(),
  agenda_fi: z.string().trim().max(5000).nullable().optional(),
  agenda_sv: z.string().trim().max(5000).nullable().optional(),
}).superRefine((v, ctx) => {
  if (v.ends_at && new Date(v.ends_at) <= new Date(v.starts_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ends_at"], message: "ends_at must be after starts_at" });
  }
  if (v.is_online && !v.online_url) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["online_url"], message: "online_url is required for online events" });
  }
  if (!v.is_online && !v.location) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["location"], message: "location is required for in-person events" });
  }
});

const RequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), data: EventFields }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), data: EventFields }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Unauthorized: missing bearer token" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: authErr } = await supabase.auth.getClaims(token);
  if (authErr || !claimsData?.claims) {
    return json(401, { error: "Unauthorized: invalid token" });
  }
  const userId = claimsData.claims.sub as string;

  // Authorization: superadmin OR (for update/delete) the event creator
  const { data: isSuperadmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "superadmin",
  });
  if (roleErr) return json(500, { error: "Role check failed", details: roleErr.message });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
      formErrors: parsed.error.flatten().formErrors,
    });
  }

  const payload = parsed.data;

  // Per-action authorization
  if (payload.action === "create" && !isSuperadmin) {
    return json(403, { error: "Forbidden: superadmin role required to create events" });
  }
  if (payload.action === "update" || payload.action === "delete") {
    if (!isSuperadmin) {
      const { data: existing, error: fetchErr } = await supabase
        .from("events")
        .select("created_by")
        .eq("id", payload.id)
        .maybeSingle();
      if (fetchErr) return json(500, { error: "Lookup failed", details: fetchErr.message });
      if (!existing) return json(404, { error: "Event not found" });
      if (existing.created_by !== userId) {
        return json(403, { error: "Forbidden: only the event creator or a superadmin can modify this event" });
      }
    }
  }

  try {
    if (payload.action === "create") {
      const { data, error } = await supabase
        .from("events")
        .insert([{ ...payload.data, created_by: userId }])
        .select()
        .single();
      if (error) return json(400, { error: error.message });
      return json(200, { event: data });
    }

    if (payload.action === "update") {
      const { data, error } = await supabase
        .from("events")
        .update(payload.data)
        .eq("id", payload.id)
        .select()
        .maybeSingle();
      if (error) return json(400, { error: error.message });
      if (!data) return json(404, { error: "Event not found" });
      return json(200, { event: data });
    }

    // delete
    const { error } = await supabase.from("events").delete().eq("id", payload.id);
    if (error) return json(400, { error: error.message });
    return json(200, { ok: true });
  } catch (err) {
    return json(500, {
      error: "Server error",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

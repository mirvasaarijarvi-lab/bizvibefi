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
  online_url: z.string().trim().url("online_url must be a valid URL").regex(/^https?:\/\//i, "URL must start with http(s)").max(500).nullable().optional().or(z.literal("").transform(() => null)),
  max_attendees: z.number().int().positive().max(100000).nullable().optional(),
  is_published: z.boolean(),
  image_url: z.string().trim().url().regex(/^https?:\/\//i, "URL must start with http(s)").max(1000).nullable().optional().or(z.literal("").transform(() => null)),
  requires_signin: z.boolean().optional().default(true),
  // Events hosted by someone else: we only store a promo link + organiser name.
  external_url: z.string().trim().url("external_url must be a valid URL").regex(/^https?:\/\//i, "URL must start with http(s)").max(1000).nullable().optional().or(z.literal("").transform(() => null)),
  external_host: z.string().trim().max(200).nullable().optional(),
  title_fi: z.string().trim().max(200).nullable().optional(),
  title_sv: z.string().trim().max(200).nullable().optional(),
  description_fi: z.string().trim().max(2000).nullable().optional(),
  description_sv: z.string().trim().max(2000).nullable().optional(),
  location_fi: z.string().trim().max(500).nullable().optional(),
  location_sv: z.string().trim().max(500).nullable().optional(),
  agenda_fi: z.string().trim().max(5000).nullable().optional(),
  agenda_sv: z.string().trim().max(5000).nullable().optional(),
  speakers: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    title: z.string().trim().max(200).optional().default(""),
    company: z.string().trim().max(200).optional().default(""),
    image_url: z.union([z.string().trim().url().regex(/^https?:\/\//i, "URL must start with http(s)").max(1000), z.literal("")]).optional().default(""),
  })).max(50).optional().default([]),
  sponsors: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    logo_url: z.union([z.string().trim().url().regex(/^https?:\/\//i, "URL must start with http(s)").max(1000), z.literal("")]).optional().default(""),
    url: z.union([z.string().trim().url().regex(/^https?:\/\//i, "URL must start with http(s)").max(500), z.literal("")]).optional().default(""),
    kind: z.enum(["sponsor", "partner"]).default("sponsor"),
  })).max(50).optional().default([]),
}).superRefine((v, ctx) => {
  if (v.ends_at && new Date(v.ends_at) <= new Date(v.starts_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ends_at"], message: "ends_at must be after starts_at" });
  }
  // External events are just a link out; venue/online details are optional.
  if (v.external_url) return;
  if (v.is_online && !v.online_url) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["online_url"], message: "online_url is required for online events" });
  }
  if (!v.is_online && !v.location) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["location"], message: "location is required for in-person events" });
  }
});

// online_url is column-level revoked for anon/authenticated, so never `select("*")`.
const RETURN_COLS = [
  "id", "title", "description", "agenda", "event_type", "starts_at", "ends_at",
  "location", "is_online", "max_attendees", "image_url", "is_published",
  "requires_signin", "external_url", "external_host", "speakers", "sponsors",
  "title_fi", "title_sv", "description_fi", "description_sv",
  "location_fi", "location_sv", "agenda_fi", "agenda_sv",
  "created_by", "created_at", "updated_at",
].join(", ");

const RequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), data: EventFields }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), data: EventFields }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

type TranslatableData = {
  title: string;
  description?: string | null;
  location?: string | null;
  agenda?: string | null;
  title_fi?: string | null; title_sv?: string | null;
  description_fi?: string | null; description_sv?: string | null;
  location_fi?: string | null; location_sv?: string | null;
  agenda_fi?: string | null; agenda_sv?: string | null;
};

async function translateBatch(
  source: Record<string, string>,
  targetLang: "Finnish" | "Swedish",
): Promise<Record<string, string>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || Object.keys(source).length === 0) return {};
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You translate event copy from English to ${targetLang}. Preserve tone, line breaks, and proper nouns. Return ONLY a JSON object with the same keys, each value being the translation. No commentary.`,
          },
          { role: "user", content: JSON.stringify(source) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error(`translate ${targetLang} failed`, res.status, await res.text());
      return {};
    }
    const out = await res.json();
    const text = out?.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("translation error", e);
    return {};
  }
}

async function autoTranslateFields(d: TranslatableData) {
  const fieldMap: Array<[keyof TranslatableData, keyof TranslatableData, keyof TranslatableData]> = [
    ["title", "title_fi", "title_sv"],
    ["description", "description_fi", "description_sv"],
    ["location", "location_fi", "location_sv"],
    ["agenda", "agenda_fi", "agenda_sv"],
  ];

  const fiSource: Record<string, string> = {};
  const svSource: Record<string, string> = {};
  for (const [src, fi, sv] of fieldMap) {
    const srcVal = (d[src] as string | null | undefined)?.trim();
    if (!srcVal) continue;
    if (!(d[fi] as string | null | undefined)?.trim()) fiSource[src as string] = srcVal;
    if (!(d[sv] as string | null | undefined)?.trim()) svSource[src as string] = srcVal;
  }

  const [fiOut, svOut] = await Promise.all([
    translateBatch(fiSource, "Finnish"),
    translateBatch(svSource, "Swedish"),
  ]);

  for (const [src, fi, sv] of fieldMap) {
    if (fiOut[src as string]) (d as Record<string, unknown>)[fi as string] = fiOut[src as string];
    if (svOut[src as string]) (d as Record<string, unknown>)[sv as string] = svOut[src as string];
  }
}

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
  if (roleErr) {
    console.error("manage-event role check failed:", roleErr);
    return json(500, { error: "An internal error occurred" });
  }

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
      if (fetchErr) {
        console.error("manage-event event lookup failed:", fetchErr);
        return json(500, { error: "An internal error occurred" });
      }
      if (!existing) return json(404, { error: "Event not found" });
      if (existing.created_by !== userId) {
        return json(403, { error: "Forbidden: only the event creator or a superadmin can modify this event" });
      }
    }
  }

  // Auto-translate missing FI/SV fields from EN source
  await autoTranslateFields(payload.data);

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
    console.error("manage-event server error:", err);
    return json(500, { error: "An internal error occurred" });
  }
});

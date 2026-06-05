import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100).regex(/^[^<>{}]*$/),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(2000).regex(/^[^<>{}]*$/),
  // Honeypot — bots fill, humans don't. Must be empty/absent.
  website: z.string().max(0).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    // Silent success for honeypot trips to avoid revealing the trap
    const honeypotTripped =
      typeof (body as Record<string, unknown>)?.website === "string" &&
      ((body as Record<string, string>).website?.length ?? 0) > 0;
    if (honeypotTripped) return json(200, { ok: true });
    return json(400, { error: "Invalid input" });
  }

  const { name, email, message } = parsed.data;

  const lowerMsg = message.toLowerCase();
  const isVibetorRequest =
    lowerMsg.includes("vibetor") ||
    lowerMsg.includes("investor") ||
    lowerMsg.includes("viber status") ||
    lowerMsg.includes("viber membership");
  const type = isVibetorRequest ? "vibetor_request" : "contact";
  const title = isVibetorRequest ? "Vibetor Status Request" : "New Contact Message";

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await admin.from("admin_notifications").insert({
    type,
    title,
    message: message.slice(0, 500),
    sender_name: name,
    sender_email: email,
  });

  if (error) {
    console.error("submit-contact-message insert failed:", error);
    return json(500, { error: "Failed to submit message" });
  }

  return json(200, { ok: true });
});

import { createClient } from "npm:@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Sign in to access this presentation" });
  }

  let body: { presentation_id?: string; download?: boolean };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const presentationId = body?.presentation_id;
  const wantDownload = !!body?.download;
  if (!presentationId || typeof presentationId !== "string") {
    return json(400, { error: "presentation_id is required" });
  }

  // User-scoped client (validates JWT)
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: authErr } = await userClient.auth.getClaims(token);
  if (authErr || !claimsData?.claims) {
    return json(401, { error: "Invalid session" });
  }
  const userId = claimsData.claims.sub as string;
  const userEmail = (claimsData.claims.email as string | undefined)?.toLowerCase() ?? null;

  // Service role for trusted lookups
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const logAccess = async (
    eventId: string | null,
    allowed: boolean,
    status: number,
    reason: string,
  ) => {
    try {
      await admin.from("presentation_access_log").insert({
        presentation_id: presentationId,
        event_id: eventId,
        user_id: userId,
        user_email: userEmail,
        allowed,
        reason,
        http_status: status,
      });
    } catch (e) {
      console.error("presentation_access_log insert failed:", e);
    }
  };

  // Load presentation + event
  const { data: pres, error: presErr } = await admin
    .from("event_presentations")
    .select("id, event_id, title, file_path, mime_type")
    .eq("id", presentationId)
    .maybeSingle();
  if (presErr) {
    console.error("get-event-presentation presentation lookup failed:", presErr);
    return json(500, { error: "An internal error occurred" });
  }
  if (!pres) return json(404, { error: "Presentation not found" });

  const { data: event, error: eventErr } = await admin
    .from("events")
    .select("id, starts_at, is_published, created_by")
    .eq("id", pres.event_id)
    .maybeSingle();
  if (eventErr) {
    console.error("get-event-presentation event lookup failed:", eventErr);
    return json(500, { error: "An internal error occurred" });
  }
  if (!event) return json(404, { error: "Event not found" });

  // Role check
  const [{ data: isAdmin }, { data: isSuperadmin }] = await Promise.all([
    admin.rpc("has_role", { _user_id: userId, _role: "admin" }),
    admin.rpc("has_role", { _user_id: userId, _role: "superadmin" }),
  ]);
  const isPrivileged = !!isAdmin || !!isSuperadmin || event.created_by === userId;

  // Event must be past + published (unless privileged previewing)
  const eventStart = new Date(event.starts_at).getTime();
  const now = Date.now();
  if (!isPrivileged) {
    if (!event.is_published) {
      return json(403, { error: "This presentation is not available" });
    }
    if (eventStart > now) {
      return json(403, { error: "Presentations become available after the event" });
    }
  }

  // Access check: signed-up attendee?
  if (!isPrivileged) {
    const { data: rsvp } = await admin
      .from("event_rsvps")
      .select("id")
      .eq("event_id", pres.event_id)
      .eq("user_id", userId)
      .eq("status", "going")
      .maybeSingle();

    let allowed = !!rsvp;
    if (!allowed && userEmail) {
      const { data: signup } = await admin
        .from("event_signups")
        .select("id")
        .eq("event_id", pres.event_id)
        .ilike("email", userEmail)
        .maybeSingle();
      allowed = !!signup;
    }
    if (!allowed) {
      return json(403, { error: "Only attendees who signed up for this event can access the presentation" });
    }
  }

  // Mint signed URL
  const expiresIn = 60 * 10; // 10 min
  const fileName = (pres.title || "presentation").replace(/[^\w.-]+/g, "_") + ".pdf";
  const { data: signed, error: signErr } = await admin.storage
    .from("event-presentations")
    .createSignedUrl(pres.file_path, expiresIn, wantDownload ? { download: fileName } : undefined);

  if (signErr || !signed?.signedUrl) {
    console.error("get-event-presentation signed URL failed:", signErr);
    return json(500, { error: "An internal error occurred" });
  }

  return json(200, {
    url: signed.signedUrl,
    expires_in: expiresIn,
    title: pres.title,
    mime_type: pres.mime_type,
  });
});

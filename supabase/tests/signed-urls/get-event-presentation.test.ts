/**
 * Signed-URL access tests for the `get-event-presentation` edge function.
 *
 * Verifies the allow/deny matrix for the only signed-URL surface in the app:
 *
 *   Caller                                  Expected
 *   ──────────────────────────────────────  ────────
 *   anon (no Authorization header)          401
 *   authenticated non-attendee              403
 *   attendee via RSVP (status='going')      200 + signed URL
 *   attendee via event_signups email match  200 + signed URL
 *   event creator (non-admin)               200 + signed URL
 *   admin (no RSVP)                         200 + signed URL
 *   bad presentation_id                     404
 *   missing body                            400
 *
 * The test boots a self-contained fixture set per run via service-role and
 * tears it down in `afterAll`. It is skipped automatically when the required
 * env vars are not present, so it never breaks `bun run test` on a laptop
 * without Lovable Cloud credentials.
 *
 * Required env (set in CI):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SIGNED_URL_TEST_USER_PASSWORD   (any non-empty string, used for all fixture users)
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SIGNED_URL_TEST_USER_PASSWORD ?? "Test!Pass-9001";

const HAS_ENV = !!(SUPABASE_URL && ANON_KEY && SERVICE_KEY);
const d = HAS_ENV ? describe : describe.skip;

const FN_URL = `${SUPABASE_URL}/functions/v1/get-event-presentation`;
const RUN_TAG = `signed-url-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type Fixture = {
  admin: SupabaseClient;
  presentationId: string;
  eventId: string;
  filePath: string;
  users: Record<
    "creator" | "admin" | "attendeeRsvp" | "attendeeSignup" | "outsider",
    { id: string; email: string; jwt: string }
  >;
};

async function createUser(
  admin: SupabaseClient,
  label: string,
): Promise<{ id: string; email: string; jwt: string }> {
  const email = `${RUN_TAG}-${label}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser ${label} failed: ${error?.message}`);
  // Sign in to mint a JWT (matches what the edge function will receive).
  const anon = createClient(SUPABASE_URL!, ANON_KEY!);
  const { data: sess, error: signErr } = await anon.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signErr || !sess.session) throw new Error(`signIn ${label} failed: ${signErr?.message}`);
  return { id: data.user.id, email, jwt: sess.session.access_token };
}

async function callFn(jwt: string | null, body: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  if (ANON_KEY) headers.apikey = ANON_KEY;
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, body: json, raw: text };
}

let fx: Fixture;

beforeAll(async () => {
  if (!HAS_ENV) return;
  const admin = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false },
  });

  const [creator, adminUser, attendeeRsvp, attendeeSignup, outsider] = await Promise.all([
    createUser(admin, "creator"),
    createUser(admin, "admin"),
    createUser(admin, "rsvp"),
    createUser(admin, "signup"),
    createUser(admin, "outsider"),
  ]);

  // Grant admin role.
  const { error: roleErr } = await admin
    .from("user_roles")
    .insert({ user_id: adminUser.id, role: "admin" });
  if (roleErr) throw new Error(`grant admin role: ${roleErr.message}`);

  // Past published event.
  const startsAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const endsAt = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const { data: event, error: eventErr } = await admin
    .from("events")
    .insert({
      title: `${RUN_TAG} signed-url event`,
      slug: `${RUN_TAG}-slug`,
      starts_at: startsAt,
      ends_at: endsAt,
      is_published: true,
      created_by: creator.id,
    })
    .select("id")
    .single();
  if (eventErr || !event) throw new Error(`create event: ${eventErr?.message}`);

  // RSVP going + signup-by-email fixtures.
  const [{ error: rsvpErr }, { error: signupErr }] = await Promise.all([
    admin.from("event_rsvps").insert({
      event_id: event.id,
      user_id: attendeeRsvp.id,
      status: "going",
    }),
    admin.from("event_signups").insert({
      event_id: event.id,
      email: attendeeSignup.email,
      full_name: "Signup Attendee",
    }),
  ]);
  if (rsvpErr) throw new Error(`rsvp: ${rsvpErr.message}`);
  if (signupErr) throw new Error(`signup: ${signupErr.message}`);

  // Upload a tiny PDF to the private bucket and register a presentation row.
  const filePath = `${event.id}/${RUN_TAG}.pdf`;
  const pdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, // %PDF-1.4
  ]);
  const { error: uploadErr } = await admin.storage
    .from("event-presentations")
    .upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (uploadErr) throw new Error(`upload: ${uploadErr.message}`);

  const { data: pres, error: presErr } = await admin
    .from("event_presentations")
    .insert({
      event_id: event.id,
      title: `${RUN_TAG} deck`,
      file_path: filePath,
      mime_type: "application/pdf",
      file_size: pdfBytes.byteLength,
    })
    .select("id")
    .single();
  if (presErr || !pres) throw new Error(`presentation: ${presErr?.message}`);

  fx = {
    admin,
    presentationId: pres.id,
    eventId: event.id,
    filePath,
    users: {
      creator,
      admin: adminUser,
      attendeeRsvp,
      attendeeSignup,
      outsider,
    },
  };
}, 60_000);

afterAll(async () => {
  if (!HAS_ENV || !fx) return;
  // Order matters: child rows then storage then auth users.
  await fx.admin.from("presentation_access_log").delete().eq("event_id", fx.eventId);
  await fx.admin.from("event_presentations").delete().eq("id", fx.presentationId);
  await fx.admin.from("event_rsvps").delete().eq("event_id", fx.eventId);
  await fx.admin.from("event_signups").delete().eq("event_id", fx.eventId);
  await fx.admin.from("events").delete().eq("id", fx.eventId);
  await fx.admin.storage.from("event-presentations").remove([fx.filePath]);
  await fx.admin.from("user_roles").delete().eq("user_id", fx.users.admin.id);
  for (const u of Object.values(fx.users)) {
    await fx.admin.auth.admin.deleteUser(u.id).catch(() => {});
  }
}, 60_000);

d("get-event-presentation signed-URL access", () => {
  it("rejects anon callers with 401", async () => {
    const res = await callFn(null, { presentation_id: fx.presentationId });
    expect(res.status).toBe(401);
  });

  it("rejects authenticated non-attendees with 403", async () => {
    const res = await callFn(fx.users.outsider.jwt, { presentation_id: fx.presentationId });
    expect(res.status).toBe(403);
    expect(res.body?.error).toMatch(/attendee/i);
  });

  it("allows RSVP attendees and returns a signed URL", async () => {
    const res = await callFn(fx.users.attendeeRsvp.jwt, { presentation_id: fx.presentationId });
    expect(res.status).toBe(200);
    expect(typeof res.body?.url).toBe("string");
    expect(res.body.url).toContain("/storage/v1/object/sign/event-presentations/");
    expect(res.body.expires_in).toBeGreaterThan(0);
  });

  it("allows signup-by-email attendees", async () => {
    const res = await callFn(fx.users.attendeeSignup.jwt, { presentation_id: fx.presentationId });
    expect(res.status).toBe(200);
    expect(typeof res.body?.url).toBe("string");
  });

  it("allows the event creator", async () => {
    const res = await callFn(fx.users.creator.jwt, { presentation_id: fx.presentationId });
    expect(res.status).toBe(200);
  });

  it("allows admins even without an RSVP", async () => {
    const res = await callFn(fx.users.admin.jwt, { presentation_id: fx.presentationId });
    expect(res.status).toBe(200);
  });

  it("returns 404 for an unknown presentation_id", async () => {
    const res = await callFn(fx.users.admin.jwt, {
      presentation_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed body", async () => {
    const res = await callFn(fx.users.admin.jwt, {});
    expect(res.status).toBe(400);
  });

  it("writes an access log entry for both allow and deny", async () => {
    const { data } = await fx.admin
      .from("presentation_access_log")
      .select("allowed, reason, user_id")
      .eq("presentation_id", fx.presentationId);
    const reasons = new Set((data ?? []).map((r) => r.reason));
    expect(reasons.has("not_attendee")).toBe(true);
    // At least one of attendee/admin/creator should be present.
    expect(
      ["attendee", "admin", "creator"].some((r) => reasons.has(r)),
    ).toBe(true);
  });
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are BizVibe's friendly support assistant. You help users navigate the BizVibe platform — a collective for builders, strategists, and connectors based in Finland.

Key facts about BizVibe:
- BizVibe is a collective where builders ship products, connect, and grow together.
- There are three membership tiers: Starter (free, WhatsApp community, free events, hackathons, builder network), Viber (enhanced access to forum categories, exclusive events), and Vibetor (investor-level, full platform access including lead generation, courses, investor access, exclusive events). Vibetor status is granted by admins only.
- Users with a "Viber access override" can access Viber-tier content even as a Starter member.
- The platform has a community forum (with tiered access by category), events (meetups, webinars, workshops, hackathons), a member directory, and member profiles.
- The Showcase section lets members submit case studies, testimonials, tools, guidebooks, and sample codes/prompts for community discovery. Submissions require admin approval.
- Members can view each other's profiles, send contact requests with messages, and control which profile fields are visible to others.
- Events support RSVP, cover images, Google Maps location links, and are managed by admins.
- The Forum has categories with tier-based access. Some categories require approval for new topics.
- Founded by Minna Blomster, Mirva Saarijärvi, and Vesa Mattila.
- Contact email: shipping@bizvibe.fi
- Pages: Home, Community, Get Going, Showcase, Forum, Events, Members, About, Contact, Profile.
- The platform supports English, Finnish, and Swedish.
- User roles: SuperAdmin (platform improvements + admin rights), Admin (accept vibetors, approve case studies, manage leads), Moderator, User.

Be concise, helpful, and friendly. If you don't know something specific, suggest the user check the relevant page or contact shipping@bizvibe.fi. Use markdown formatting when helpful.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Failed to get response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Support chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

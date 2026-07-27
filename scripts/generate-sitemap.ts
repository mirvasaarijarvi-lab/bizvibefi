// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches dynamic routes (approved showcase items, public member profiles) from Supabase.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://goodvibescafe.org";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://ztfbgbcevtrxdchbjeck.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmJnYmNldnRyeGRjaGJqZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDQ0MjcsImV4cCI6MjA5MDkyMDQyN30.a_TpaWG8CRAXTsr4cHWZ4CNob7dJn9-LEdURd9uJOF8";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/community", changefreq: "weekly", priority: "0.8" },
  { path: "/showcase", changefreq: "weekly", priority: "0.8" },
  { path: "/get-going", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/events", changefreq: "weekly", priority: "0.7" },
  { path: "/forum", changefreq: "daily", priority: "0.7" },
  { path: "/members", changefreq: "weekly", priority: "0.6" },
  { path: "/badges", changefreq: "monthly", priority: "0.5" },
  { path: "/auth", changefreq: "yearly", priority: "0.3" },
  { path: "/reset-password", changefreq: "yearly", priority: "0.2" },
  { path: "/profile", changefreq: "monthly", priority: "0.3" },
  { path: "/apply-starter", changefreq: "monthly", priority: "0.6" },
  { path: "/apply-viber", changefreq: "monthly", priority: "0.6" },
  { path: "/apply-vibetor", changefreq: "monthly", priority: "0.6" },
  { path: "/accessibility", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
];

async function fetchRest<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`sitemap: ${path} -> ${res.status}`);
      return [];
    }
    return (await res.json()) as T[];
  } catch (e) {
    console.warn(`sitemap: ${path} failed`, e);
    return [];
  }
}

function toIso(date?: string | null): string | undefined {
  if (!date) return undefined;
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

async function buildDynamicEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  const showcase = await fetchRest<{ id: string; updated_at?: string }>(
    "showcase_items?status=eq.approved&select=id,updated_at",
  );
  for (const item of showcase) {
    entries.push({
      path: `/showcase/${item.id}`,
      lastmod: toIso(item.updated_at),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  const profiles = await fetchRest<{ user_id: string; updated_at?: string }>(
    "profiles?select=user_id,updated_at",
  );
  for (const p of profiles) {
    if (!p.user_id) continue;
    entries.push({
      path: `/members/${p.user_id}`,
      lastmod: toIso(p.updated_at),
      changefreq: "monthly",
      priority: "0.4",
    });
  }

  const events = await fetchRest<{ id: string; updated_at?: string }>(
    "events?is_published=eq.true&select=id,updated_at",
  );
  for (const e of events) {
    entries.push({
      path: `/events/${e.id}/feedback`,
      lastmod: toIso(e.updated_at),
      changefreq: "monthly",
      priority: "0.4",
    });
  }

  const categories = await fetchRest<{ slug: string; updated_at?: string }>(
    "forum_categories?select=slug,updated_at",
  );
  for (const c of categories) {
    if (!c.slug) continue;
    entries.push({
      path: `/forum/${c.slug}`,
      lastmod: toIso(c.updated_at),
      changefreq: "weekly",
      priority: "0.5",
    });
  }

  const topics = await fetchRest<{
    id: string;
    updated_at?: string;
    forum_categories?: { slug?: string } | null;
  }>(
    "forum_topics?select=id,updated_at,forum_categories(slug)",
  );
  for (const t of topics) {
    const slug = t.forum_categories?.slug;
    if (!slug || !t.id) continue;
    entries.push({
      path: `/forum/${slug}/${t.id}`,
      lastmod: toIso(t.updated_at),
      changefreq: "weekly",
      priority: "0.4",
    });
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

async function main() {
  const dynamic = await buildDynamicEntries();
  const entries = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(
    `sitemap.xml written (${entries.length} entries: ${staticEntries.length} static, ${dynamic.length} dynamic)`,
  );
}

main();

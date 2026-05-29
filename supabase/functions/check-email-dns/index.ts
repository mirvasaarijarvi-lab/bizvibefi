import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';



const DOH = 'https://dns.google/resolve';

type DnsAnswer = { name: string; type: number; data: string };

async function dns(name: string, type: string): Promise<DnsAnswer[] | { error: string }> {
  try {
    const r = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
    });
    const j = (await r.json()) as { Answer?: DnsAnswer[] };
    return (j.Answer ?? []).map((a) => ({ name: a.name, type: a.type, data: a.data }));
  } catch (e) {
    return { error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Require authenticated admin/superadmin — this endpoint is only used by the
  // AdminEmailHealth page and exposes the app's email infrastructure.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: authErr } = await supabase.auth.getClaims(token);
  if (authErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claimsData.claims.sub as string;
  const [{ data: isAdmin }, { data: isSuperadmin }] = await Promise.all([
    supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
    supabase.rpc('has_role', { _user_id: userId, _role: 'superadmin' }),
  ]);
  if (!isAdmin && !isSuperadmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const domain = (url.searchParams.get('domain') || 'goodvibescafe.org').toLowerCase().trim();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return new Response(JSON.stringify({ error: 'Invalid domain' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const [mx, txt, dmarc, improvmxDkim] = await Promise.all([
    dns(domain, 'MX'),
    dns(domain, 'TXT'),
    dns(`_dmarc.${domain}`, 'TXT'),
    dns(`improvmx._domainkey.${domain}`, 'TXT'),
  ]);

  const spfRecords = Array.isArray(txt)
    ? txt.filter((r) => /v=spf1/i.test(r.data))
    : [];

  // Evaluate ImprovMX-specific health
  const mxStr = JSON.stringify(mx);
  const checks = {
    mx_improvmx: {
      ok: /mx1\.improvmx\.com/i.test(mxStr) && /mx2\.improvmx\.com/i.test(mxStr),
      label: 'MX records point to ImprovMX',
      expected: 'mx1.improvmx.com (priority 10), mx2.improvmx.com (priority 20)',
    },
    spf: {
      ok: spfRecords.some((r) => /include:spf\.improvmx\.com/i.test(r.data)),
      label: 'SPF includes ImprovMX',
      expected: 'v=spf1 include:spf.improvmx.com ~all',
    },
    spf_single: {
      ok: spfRecords.length === 1,
      label: 'Exactly one SPF record',
      expected: 'Multiple SPF records break authentication',
    },
    dmarc: {
      ok: Array.isArray(dmarc) && dmarc.some((r) => /v=DMARC1/i.test(r.data)),
      label: 'DMARC policy published',
      expected: 'v=DMARC1; p=none; rua=mailto:you@domain',
    },
    dkim_improvmx: {
      ok: Array.isArray(improvmxDkim) && improvmxDkim.length > 0,
      label: 'ImprovMX DKIM key published (optional)',
      expected: 'improvmx._domainkey TXT record',
    },
  };

  return new Response(
    JSON.stringify({
      domain,
      checked_at: new Date().toISOString(),
      records: { mx, txt, dmarc, improvmxDkim },
      spfRecords,
      checks,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});

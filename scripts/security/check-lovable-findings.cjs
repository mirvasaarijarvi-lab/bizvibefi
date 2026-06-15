#!/usr/bin/env node
/**
 * Compare the current Lovable security report against the committed baseline
 * and fail if any NEW finding appears for the scanners we care about.
 *
 * Inputs:
 *   .security/lovable-report.json    (current export, required)
 *   .security/lovable-baseline.json  (committed snapshot of known/accepted)
 *
 * Either may be missing:
 *   - missing report   → exit 2 (CI misconfig, fail loud)
 *   - missing baseline → treat as empty (any finding is "new")
 *
 * Report shape (matches Lovable's security--get_scan_results export):
 *   { findings: [ { scanner_name, internal_id, severity, title, ... } ] }
 *
 * Tracked scanners (case-insensitive):
 *   - connector_security_scan  (Wiz + similar)
 *   - agent_security
 */
const fs = require("node:fs");
const path = require("node:path");

const TRACKED = new Set(["connector_security_scan", "agent_security"]);

const reportPath = process.env.LOVABLE_REPORT
  || path.resolve(".security/lovable-report.json");
const baselinePath = process.env.LOVABLE_BASELINE
  || path.resolve(".security/lovable-baseline.json");

function readJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    console.error(`Failed to parse ${p}: ${err.message}`);
    process.exit(2);
  }
}

const report = readJson(reportPath, null);
if (!report) {
  console.error(`Missing report: ${reportPath}`);
  console.error("Export it from Lovable → Security panel and commit / upload it before this job runs.");
  process.exit(2);
}

const baseline = readJson(baselinePath, { findings: [] });

const findings = Array.isArray(report.findings) ? report.findings : [];
const baselineKeys = new Set(
  (Array.isArray(baseline.findings) ? baseline.findings : []).map(
    (f) => `${(f.scanner_name || "").toLowerCase()}::${f.internal_id}`,
  ),
);

const tracked = findings.filter((f) =>
  TRACKED.has((f.scanner_name || "").toLowerCase()),
);
const newFindings = tracked.filter(
  (f) => !baselineKeys.has(`${f.scanner_name.toLowerCase()}::${f.internal_id}`),
);

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
function writeSummary(lines) {
  if (!summaryFile) return;
  fs.appendFileSync(summaryFile, lines.join("\n") + "\n");
}

writeSummary([
  "## Lovable platform scans",
  "",
  `Report: \`${path.relative(process.cwd(), reportPath)}\``,
  `Baseline: \`${path.relative(process.cwd(), baselinePath)}\`${fs.existsSync(baselinePath) ? "" : " _(missing — treated as empty)_"}`,
  "",
  `- Tracked scanners: ${[...TRACKED].join(", ")}`,
  `- Total tracked findings in report: **${tracked.length}**`,
  `- New vs baseline: **${newFindings.length}**`,
  "",
]);

if (newFindings.length === 0) {
  console.log(`OK — no new connector_security_scan / agent_security findings (${tracked.length} tracked, all baselined).`);
  process.exit(0);
}

writeSummary([
  "### New findings (fail)",
  "",
  "| Scanner | Severity | Title | ID |",
  "| --- | --- | --- | --- |",
  ...newFindings.map(
    (f) =>
      `| ${f.scanner_name} | ${f.severity || "?"} | ${(f.title || "(no title)").replace(/\|/g, "\\|")} | \`${f.internal_id}\` |`,
  ),
  "",
  "Resolve via Lovable (fix or `ignore` with rationale), then refresh `.security/lovable-baseline.json` and commit.",
]);

console.error(`FAIL — ${newFindings.length} new tracked finding(s):`);
for (const f of newFindings) {
  console.error(`  [${f.scanner_name}] ${f.severity || "?"} ${f.internal_id} — ${f.title || "(no title)"}`);
}
process.exit(1);

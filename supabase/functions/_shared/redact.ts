// Redact an email address for safe logging.
// Returns a form like "j***@example.com" so operators cannot read full PII
// from edge function log streams. Falls back to "***" on malformed input.
export function redactEmail(email: unknown): string {
  if (typeof email !== 'string' || email.length === 0) return '***';
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local[0] ?? '';
  return `${head}***@${domain}`;
}

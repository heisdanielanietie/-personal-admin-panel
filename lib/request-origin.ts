// Explicit deployment origins avoid trusting client-supplied forwarded headers.
export function allowedRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  try {
    const parsed = new URL(origin);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.origin !== origin) return false;
    const configured: unknown = JSON.parse(process.env.STUDIO_ALLOWED_ORIGINS || '[]');
    const allowed = Array.isArray(configured) ? configured.filter(x => typeof x === 'string') : [];
    return origin === new URL(request.url).origin || allowed.includes(origin);
  } catch {
    return false;
  }
}

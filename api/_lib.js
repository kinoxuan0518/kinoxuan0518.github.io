/* shared bits for the two little endpoints: who may call them, and how often */
const ALLOW = [
  /^https:\/\/kinoxuan0518\.github\.io$/,
  /^https:\/\/kino-xuan\.vercel\.app$/,
  /^https:\/\/[\w-]+-kinoxuans-projects\.vercel\.app$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];
export const okOrigin = o => !!o && ALLOW.some(r => r.test(o));
export function cors(o) {
  return okOrigin(o)
    ? { 'Access-Control-Allow-Origin': o, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }
    : { 'Vary': 'Origin' };
}
export const json = (body, status, headers) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
/* a per-instance sliding window: not a fortress, just enough that one visitor can't run up the bill */
const hits = new Map();
export function limited(key, max, windowMs) {
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < windowMs);
  a.push(now); hits.set(key, a);
  if (hits.size > 5000) hits.clear();
  return a.length > max;
}
export const ipOf = req => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

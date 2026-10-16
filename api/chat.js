/* 小杏仁 on github.io: the visitor's turns come in, the persona (held here, not in the page) and the model key are added,
   and DeepSeek's answer streams back as plain text. Configure in Vercel → Settings → Environment Variables:
     DEEPSEEK_API_KEY   required
     LLM_MODEL          optional, default deepseek-chat
     LLM_BASE_URL       optional, default https://api.deepseek.com (any OpenAI-compatible endpoint works) */
import PERSONA from './_persona.js';
import { okOrigin, cors, json, limited, ipOf } from './_lib.js';

const KEY = () => process.env.DEEPSEEK_API_KEY || process.env.LLM_API_KEY || '';

export function OPTIONS(req) { return new Response(null, { status: 204, headers: cors(req.headers.get('origin')) }); }
/* GET: is the key there? with ?check, also: which of our variables the server can see (names only), and whether
   DeepSeek accepts the key and has balance (its free /user/balance call, no tokens spent) */
export async function GET(req) {
  const h = cors(req.headers.get('origin')), out = { ok: true, configured: !!KEY(), ink: !!process.env.INK_TO };
  if (new URL(req.url).searchParams.has('check') && !limited('check:' + ipOf(req), 6, 10 * 60e3)) {
    out.seen = Object.keys(process.env).filter(k => /DEEPSEEK|LLM_|INK|RESEND/i.test(k));
    if (KEY()) {
      try {
        const base = (process.env.LLM_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
        const r = await fetch(base + '/user/balance', { headers: { Authorization: 'Bearer ' + KEY() } });
        out.keyAccepted = r.ok;
        if (r.ok) { const j = await r.json().catch(() => ({})); out.hasBalance = !!j.is_available; }
      } catch { out.keyAccepted = null; }
    }
  }
  return json(out, 200, h);
}

export async function POST(req) {
  const origin = req.headers.get('origin'), h = cors(origin);
  if (!okOrigin(origin)) return json({ error: 'forbidden' }, 403, h);
  if (!KEY()) return json({ error: 'not_configured' }, 503, h);
  const ip = ipOf(req);
  if (limited('chat:' + ip, 24, 10 * 60e3) || limited('chat:all', 600, 60 * 60e3)) return json({ error: 'rate_limited' }, 429, h);

  let body; try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400, h); }
  const lang = body && body.lang === 'en' ? 'en' : 'zh';
  const msgs = [];
  for (const t of (Array.isArray(body && body.turns) ? body.turns.slice(-14) : [])) {
    if (!t || typeof t.content !== 'string' || !t.content.trim()) continue;
    const role = t.role === 'assistant' ? 'assistant' : 'user';
    msgs.push({ role, content: t.content.slice(0, role === 'user' ? 600 : 2400) });
  }
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ error: 'bad_request' }, 400, h);

  const base = (process.env.LLM_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
  let up;
  try {
    up = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY() },
      body: JSON.stringify({ model: process.env.LLM_MODEL || 'deepseek-chat', stream: true, max_tokens: 700, temperature: 1.1,
        messages: [{ role: 'system', content: PERSONA[lang] }, ...msgs] }),
    });
  } catch { return json({ error: 'upstream' }, 502, h); }
  if (!up.ok || !up.body) {
    const s = up.status;
    return json({ error: s === 429 ? 'rate_limited' : (s === 401 || s === 402 || s === 403) ? 'not_configured' : 'upstream' }, s === 429 ? 429 : 502, h);
  }

  /* the provider speaks server-sent events; the page only wants the words */
  const reader = up.body.getReader(), dec = new TextDecoder(), enc = new TextEncoder();
  let buf = '';
  const out = new ReadableStream({
    async pull(ctl) {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) { ctl.close(); return; }
        buf += dec.decode(value, { stream: true });
        let i, sent = false;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          const d = line.slice(5).trim();
          if (d === '[DONE]') { ctl.close(); reader.cancel().catch(() => {}); return; }
          try { const c = JSON.parse(d).choices?.[0]?.delta?.content; if (c) { ctl.enqueue(enc.encode(c)); sent = true; } } catch {}
        }
        if (sent) return;
      }
    },
    cancel() { reader.cancel().catch(() => {}); },
  });
  return new Response(out, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...h } });
}

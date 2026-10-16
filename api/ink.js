/* the notebook's invisible ink on github.io: what a visitor writes is posted to Kino's inbox and nowhere else.
   Configure in Vercel → Settings → Environment Variables:
     INK_TO            required, the address the notes go to
     RESEND_API_KEY    optional; if set, mail goes through Resend, otherwise through FormSubmit
                       (FormSubmit sends one "activate" email to INK_TO the first time; click it once) */
import { okOrigin, cors, json, limited, ipOf } from './_lib.js';

export function OPTIONS(req) { return new Response(null, { status: 204, headers: cors(req.headers.get('origin')) }); }

/* GET: is the notebook wired to an inbox, and through which service (no test mail: that would let anyone fill the inbox) */
export function GET(req) {
  return json({ configured: !!process.env.INK_TO, via: process.env.RESEND_API_KEY ? 'resend' : 'formsubmit' }, 200, cors(req.headers.get('origin')));
}

export async function POST(req) {
  const origin = req.headers.get('origin'), h = cors(origin);
  if (!okOrigin(origin)) return json({ error: 'forbidden' }, 403, h);
  const to = process.env.INK_TO || '';
  if (!to) return json({ error: 'not_configured' }, 503, h);
  if (limited('ink:' + ipOf(req), 6, 10 * 60e3) || limited('ink:all', 200, 60 * 60e3)) return json({ error: 'rate_limited' }, 429, h);

  let body; try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400, h); }
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 1000) : '';
  if (!text) return json({ error: 'bad_request' }, 400, h);
  const lang = body.lang === 'en' ? 'English' : '中文';

  const r = await deliver(to, text, lang);
  return json({ ok: r.ok }, r.ok ? 200 : 502, h);
}


async function deliver(to, text, lang) {
  const when = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  const subject = '笔记本上有人留了一句话';
  const plain = `${text}\n\n——\n${when}（北京时间）· 页面语言：${lang}\n来自漂流的舱的隐形墨水页`;
  try {
    if (process.env.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.RESEND_API_KEY },
        body: JSON.stringify({ from: 'Kino 的笔记本 <onboarding@resend.dev>', to: [to], subject, text: plain }),
      });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, said: j.message || j.name || (r.ok ? 'sent' : '') };
    }
    const site = 'https://kinoxuan0518.github.io/';
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: site.slice(0, -1), Referer: site },
      body: JSON.stringify({ _subject: subject, _template: 'box', _captcha: 'false', '留言': text, '时间': when + '（北京时间）', '页面语言': lang }),
    });
    const raw = await r.text();
    let j = {}; try { j = JSON.parse(raw); } catch {}
    return { ok: r.ok && (j.success === true || j.success === 'true'), status: r.status, said: j.message || raw.slice(0, 200) };
  } catch (e) { return { ok: false, status: 0, said: String(e && e.message || e).slice(0, 200) }; }
}

/* GET /api/reel-thumb?code=<reel shortcode>  ->  the reel's cover image

   Instagram's public embed page carries the cover image for any public reel, so
   this needs no app, no token and no login. We proxy the image bytes rather than
   handing the CDN URL to the browser: those URLs are signed and expire within
   hours, and Instagram rejects a fair share of hotlinked requests.

   Cached hard at the edge — a reel's cover never changes, so one fetch serves
   every visitor for a week and keeps working from stale cache after that. */

/* Instagram serves the post page as a JS shell to browsers, but still renders the
   cover into og:image for link-preview crawlers — so we ask as one. The embed page
   is kept as a last resort in case that variant comes back. */
const CRAWLER = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const SHORTCODE = /^[A-Za-z0-9_-]{5,24}$/;
const TIMEOUT = 8000;

const sources = code => [
  { url: `https://www.instagram.com/p/${code}/`, ua: CRAWLER },
  { url: `https://www.instagram.com/reel/${code}/`, ua: CRAWLER },
  { url: `https://www.instagram.com/reel/${code}/embed/captioned/`, ua: BROWSER }
];

function tidy(url) {
  return url.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');
}

/* the cover turns up in a few different shapes depending on which variant
   Instagram serves — take whichever appears first */
function findCover(html) {
  const patterns = [
    /<meta\s+property="og:image"\s+content="([^"]+)"/,
    /"thumbnail_src"\s*:\s*"([^"]+)"/,
    /"display_url"\s*:\s*"([^"]+)"/,
    /class="EmbeddedMediaImage"[^>]*\ssrc="([^"]+)"/
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && /^https?:\/\/[^"]*scontent/.test(tidy(m[1]))) return tidy(m[1]);
  }
  return null;
}

async function get(url, headers) {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), TIMEOUT);
  try {
    return await fetch(url, { headers, signal: stop.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function reelThumb(req, res) {
  const code = (req.query && req.query.code) ||
    new URL(req.url, 'http://localhost').searchParams.get('code');

  if (!code || !SHORTCODE.test(code)) {
    res.statusCode = 400;
    res.setHeader('Cache-Control', 'no-store');
    return res.end('bad reel code');
  }

  try {
    let cover = null;
    for (const src of sources(code)) {
      try {
        const page = await get(src.url, { 'user-agent': src.ua, 'accept-language': 'en-US,en;q=0.9' });
        if (!page.ok) continue;
        cover = findCover(await page.text());
        if (cover) break;
      } catch (_) { /* try the next source */ }
    }
    if (!cover) throw new Error('no cover found for ' + code);

    const img = await get(cover, { 'user-agent': BROWSER, referer: 'https://www.instagram.com/' });
    if (!img.ok) throw new Error('cover fetch ' + img.status);

    res.statusCode = 200;
    res.setHeader('Content-Type', img.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000');
    res.end(Buffer.from(await img.arrayBuffer()));
  } catch (err) {
    // the strip falls back to its local cover image, so a failure here is cosmetic
    res.statusCode = 502;
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end('cover unavailable: ' + err.message);
  }
};

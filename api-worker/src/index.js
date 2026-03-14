const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SCRIPT_BODY = `(()=>{if(window.webstatsRequestSent)return;window.webstatsRequestSent=!0;const e=document.currentScript,t=e&&e.getAttribute("data-api")||window.WEBSTATS_API||"";let n="";try{n=t||new URL(e&&e.src?e.src:location.href).origin}catch{n=location.origin}const o=n.replace(/\\/$/,"")+"/api.php";fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:location.href,referrer:document.referrer})}).then(e=>e.json()).then(e=>{for(const t in e)document.querySelectorAll("#"+t).forEach(t=>t.innerText=e[t])}).catch(e=>console.error(e))})();`;
const TEST_PAGE = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WebStats Live</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap");
      :root {
        color-scheme: dark;
        --bg: #07080f;
        --bg-2: #0d1326;
        --ink: #eaf1ff;
        --muted: #9db0d6;
        --accent: #7cfbff;
        --accent-2: #ff77f1;
        --accent-3: #7b5cff;
        --glass: rgba(11, 16, 30, 0.72);
        --stroke: rgba(124, 251, 255, 0.18);
        --glow: 0 0 30px rgba(124, 251, 255, 0.25), 0 0 80px rgba(123, 92, 255, 0.18);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Space Grotesk", "Segoe UI", system-ui, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(900px 600px at 80% -10%, rgba(123, 92, 255, 0.28), transparent 60%),
          radial-gradient(700px 500px at 0% 0%, rgba(124, 251, 255, 0.22), transparent 60%),
          radial-gradient(900px 700px at 80% 90%, rgba(255, 119, 241, 0.2), transparent 60%),
          linear-gradient(150deg, var(--bg), var(--bg-2));
        overflow-x: hidden;
        display: grid;
        place-items: center;
        padding: 40px 18px 52px;
      }
      .aurora {
        position: fixed;
        inset: -20% -10% auto -10%;
        height: 60vh;
        background:
          radial-gradient(50% 80% at 20% 30%, rgba(124, 251, 255, 0.35), transparent 70%),
          radial-gradient(50% 80% at 70% 20%, rgba(255, 119, 241, 0.3), transparent 70%),
          radial-gradient(50% 80% at 50% 80%, rgba(123, 92, 255, 0.3), transparent 70%);
        filter: blur(40px) saturate(1.2);
        animation: drift 14s ease-in-out infinite alternate;
        pointer-events: none;
        z-index: 0;
      }
      .grid {
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(circle at 50% 40%, rgba(0,0,0,0.7), transparent 70%);
        pointer-events: none;
        z-index: 0;
      }
      .shell {
        width: min(1120px, 100%);
        display: grid;
        gap: 18px;
        position: relative;
        z-index: 1;
      }
      .hero {
        padding: 26px 30px 22px;
        border-radius: 20px;
        border: 1px solid var(--stroke);
        background: var(--glass);
        box-shadow: var(--glow);
        display: grid;
        gap: 12px;
        position: relative;
        overflow: hidden;
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: -40% -20% auto auto;
        width: 360px;
        height: 360px;
        background: conic-gradient(from 120deg, transparent, rgba(124, 251, 255, 0.4), transparent 60%);
        filter: blur(30px);
        opacity: 0.7;
        animation: spin 18s linear infinite;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .badge .pulse {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 12px rgba(124, 251, 255, 0.9);
        animation: pulse 2s ease-in-out infinite;
      }
      .hero h1 {
        margin: 0;
        font-size: clamp(28px, 4.2vw, 44px);
        letter-spacing: 0.6px;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
        max-width: 760px;
      }
      .cards {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .card {
        background: linear-gradient(145deg, rgba(12, 18, 33, 0.9), rgba(7, 10, 20, 0.9));
        border: 1px solid rgba(124, 251, 255, 0.14);
        border-radius: 18px;
        padding: 18px 18px 20px;
        display: grid;
        gap: 8px;
        min-height: 122px;
        position: relative;
        overflow: hidden;
        transform: translateY(10px) scale(0.98);
        opacity: 0;
        animation: rise 0.7s ease forwards;
      }
      .card:nth-child(2) { animation-delay: 0.08s; }
      .card:nth-child(3) { animation-delay: 0.16s; }
      .card:nth-child(4) { animation-delay: 0.24s; }
      .card:nth-child(5) { animation-delay: 0.32s; }
      .card:nth-child(6) { animation-delay: 0.4s; }
      .card::before {
        content: "";
        position: absolute;
        inset: auto 14px 14px auto;
        width: 72px;
        height: 72px;
        background: radial-gradient(circle at 30% 30%, rgba(124, 251, 255, 0.6), transparent 60%);
        opacity: 0.5;
        filter: blur(2px);
      }
      .card::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(120px 80px at 20% 0%, rgba(255, 119, 241, 0.18), transparent 70%);
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      .card:hover {
        transform: translateY(0) scale(1);
        box-shadow: 0 0 35px rgba(124, 251, 255, 0.2);
      }
      .card:hover::after { opacity: 1; }
      .label {
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .value {
        font-size: 30px;
        font-weight: 600;
        text-shadow: 0 0 18px rgba(124, 251, 255, 0.35);
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(10, 14, 24, 0.8);
        border: 1px solid rgba(123, 92, 255, 0.3);
        color: var(--muted);
        font-size: 12px;
        box-shadow: 0 0 20px rgba(123, 92, 255, 0.18);
      }
      .chip code {
        font-family: "JetBrains Mono", ui-monospace, monospace;
        color: var(--accent);
        font-size: 12px;
      }
      .debug {
        background: rgba(10, 12, 22, 0.7);
        border: 1px solid rgba(124, 251, 255, 0.14);
        border-radius: 16px;
        padding: 16px;
        font-family: "JetBrains Mono", ui-monospace, monospace;
        font-size: 12px;
        color: var(--muted);
        white-space: pre-wrap;
        box-shadow: inset 0 0 30px rgba(124, 251, 255, 0.08);
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      @keyframes rise {
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes drift {
        0% { transform: translateY(0) translateX(0); }
        100% { transform: translateY(20px) translateX(30px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @media (max-width: 600px) {
        .hero { padding: 22px; }
        .value { font-size: 24px; }
      }
    </style>
  </head>
  <body>
    <div class="aurora"></div>
    <div class="grid"></div>
    <main class="shell">
      <section class="hero">
        <div class="badge"><span class="pulse"></span> WEBSTATS LIVE</div>
        <h1>\u6570\u636e\u8109\u51b2\u4e2d\u5fc3</h1>
        <p>这是一个静默运行的统计仪表板，直接展示实时与累计访问数据。</p>
      </section>

      <section class="cards">
        <div class="card">
          <div class="label">\u4eca\u65e5\u603b\u8bbf\u95ee\u91cf</div>
          <div class="value" id="webstats_today_pv">\u52a0\u8f7d\u4e2d...</div>
        </div>
        <div class="card">
          <div class="label">\u4eca\u65e5\u603b\u8bbf\u5ba2\u6570</div>
          <div class="value" id="webstats_today_uv">\u52a0\u8f7d\u4e2d...</div>
        </div>
        <div class="card">
          <div class="label">\u5168\u7ad9\u7d2f\u8ba1\u8bbf\u95ee\u91cf</div>
          <div class="value" id="webstats_site_pv">\u52a0\u8f7d\u4e2d...</div>
        </div>
        <div class="card">
          <div class="label">\u5168\u7ad9\u7d2f\u8ba1\u8bbf\u5ba2\u6570</div>
          <div class="value" id="webstats_site_uv">\u52a0\u8f7d\u4e2d...</div>
        </div>
        <div class="card">
          <div class="label">\u5f53\u524d\u9875\u9762\u8bbf\u95ee\u91cf</div>
          <div class="value" id="webstats_page_pv">\u52a0\u8f7d\u4e2d...</div>
        </div>
        <div class="card">
          <div class="label">\u5f53\u524d\u9875\u9762\u8bbf\u5ba2\u6570</div>
          <div class="value" id="webstats_page_uv">\u52a0\u8f7d\u4e2d...</div>
        </div>
      </section>

      <section class="meta">
        <div class="chip">\u811a\u672c\u5730\u5740 <code>/webstats.min.js</code></div>
        <div class="chip">API \u5165\u53e3 <code>/api.php</code></div>
      </section>

      <section class="debug" id="webstats_debug">\u7b49\u5f85 /api.php \u54cd\u5e94...</section>
    </main>

    <script>
      (async () => {
        const debug = document.getElementById("webstats_debug");
        try {
          const res = await fetch("/api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: location.href, referrer: document.referrer || "" }),
          });
          const text = await res.text();
          debug.innerText = res.status + " " + text;
          try {
            const data = JSON.parse(text);
            for (const k in data) {
              const el = document.getElementById(k);
              if (el) el.innerText = data[k];
            }
          } catch {}
        } catch (e) {
          debug.innerText = "fetch /api.php failed: " + (e && e.message ? e.message : String(e));
        }
      })();
    </script>
  </body>
</html>`;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/webstats.min.js") {
      return new Response(SCRIPT_BODY, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (
      url.pathname === "/" ||
      url.pathname === "/test" ||
      url.pathname === "/test.html"
    ) {
      return new Response(TEST_PAGE, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    if (url.pathname === "/webstats" && request.method === "GET") {
      const callback =
        url.searchParams.get("jsonpCallback") ||
        url.searchParams.get("callback") ||
        "WebStatsCallback";

      if (!isValidCallback(callback)) {
        return new Response("Bad Request", { status: 400, headers: CORS_HEADERS });
      }

      const pageUrl = resolvePageUrl(request, url);
      if (!pageUrl) {
        return new Response("Bad Request", { status: 400, headers: CORS_HEADERS });
      }

      let counts;
      try {
        counts = await handleCount(env.webstats, request, pageUrl);
      } catch {
        return new Response("Bad Request", { status: 400, headers: CORS_HEADERS });
      }
      const body = `${callback}(${JSON.stringify(counts)});`;

      return new Response(body, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          ...CORS_HEADERS,
        },
      });
    }

    if (url.pathname !== "/api.php") {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400, headers: CORS_HEADERS });
    }

    const pageUrl = String(body.url || "");
    if (!pageUrl) {
      return new Response("Bad Request", { status: 400, headers: CORS_HEADERS });
    }

    let counts;
    try {
        counts = await handleCount(env.webstats, request, pageUrl);
    } catch {
      return new Response("Bad Request", { status: 400, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify(counts), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...CORS_HEADERS,
      },
    });
  },
};

function resolvePageUrl(request, url) {
  return (
    String(url.searchParams.get("url") || "") ||
    request.headers.get("Referer") ||
    request.headers.get("referer") ||
    ""
  );
}

function isValidCallback(name) {
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(name);
}

async function handleCount(db, request, pageUrl) {
  if (!pageUrl) {
    throw new Error("Bad Request");
  }

  let page;
  let site;
  try {
      const parsed = new URL(pageUrl);
      site = parsed.hostname;
      page = parsed.pathname + parsed.search;
    } catch {
    throw new Error("Bad Request");
  }

  const day = getBeijingDay();
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "0.0.0.0";
  const ua = request.headers.get("User-Agent") || "";
  const visitor = await sha256(`${ip}|${ua}`);

  const siteUvDayDelta = await insertUv(db, "site", site, "", day, visitor);
  const pageUvDayDelta = await insertUv(db, "page", site, page, day, visitor);
  const siteUvTotalDelta = await insertUv(db, "site", site, "", "*", visitor);
  const pageUvTotalDelta = await insertUv(db, "page", site, page, "*", visitor);

  await upsertCounts(db, site, page, day, {
    siteUvDayDelta,
    pageUvDayDelta,
    siteUvTotalDelta,
    pageUvTotalDelta,
  });

  return readCounts(db, site, page, day);
}

async function insertUv(db, scope, site, page, day, visitor) {
  const result = await db
    .prepare(
      "INSERT INTO uv_seen(scope, site, page, day, visitor) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING"
    )
    .bind(scope, site, page, day, visitor)
    .run();
  return result?.meta?.changes ? 1 : 0;
}

async function upsertCounts(db, site, page, day, deltas) {
  const {
    siteUvDayDelta,
    pageUvDayDelta,
    siteUvTotalDelta,
    pageUvTotalDelta,
  } = deltas;

  await db
    .prepare(
      "INSERT INTO site_daily(site, day, pv, uv) VALUES (?, ?, 1, ?) ON CONFLICT(site, day) DO UPDATE SET pv = pv + 1, uv = uv + ?"
    )
    .bind(site, day, siteUvDayDelta, siteUvDayDelta)
    .run();

  await db
    .prepare(
      "INSERT INTO site_total(site, pv, uv) VALUES (?, 1, ?) ON CONFLICT(site) DO UPDATE SET pv = pv + 1, uv = uv + ?"
    )
    .bind(site, siteUvTotalDelta, siteUvTotalDelta)
    .run();

  await db
    .prepare(
      "INSERT INTO page_daily(site, page, day, pv, uv) VALUES (?, ?, ?, 1, ?) ON CONFLICT(site, page, day) DO UPDATE SET pv = pv + 1, uv = uv + ?"
    )
    .bind(site, page, day, pageUvDayDelta, pageUvDayDelta)
    .run();

  await db
    .prepare(
      "INSERT INTO page_total(site, page, pv, uv) VALUES (?, ?, 1, ?) ON CONFLICT(site, page) DO UPDATE SET pv = pv + 1, uv = uv + ?"
    )
    .bind(site, page, pageUvTotalDelta, pageUvTotalDelta)
    .run();
}

async function readCounts(db, site, page, day) {
  const todaySite = await db
    .prepare("SELECT pv, uv FROM site_daily WHERE site = ? AND day = ?")
    .bind(site, day)
    .first();
  const todayPage = await db
    .prepare("SELECT pv, uv FROM page_daily WHERE site = ? AND page = ? AND day = ?")
    .bind(site, page, day)
    .first();
  const totalSite = await db
    .prepare("SELECT pv, uv FROM site_total WHERE site = ?")
    .bind(site)
    .first();
  const totalPage = await db
    .prepare("SELECT pv, uv FROM page_total WHERE site = ? AND page = ?")
    .bind(site, page)
    .first();

  return {
    webstats_today_pv: todaySite?.pv ?? 0,
    webstats_today_uv: todaySite?.uv ?? 0,
    webstats_site_pv: totalSite?.pv ?? 0,
    webstats_site_uv: totalSite?.uv ?? 0,
    webstats_page_pv: totalPage?.pv ?? 0,
    webstats_page_uv: totalPage?.uv ?? 0,
  };
}

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getBeijingDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

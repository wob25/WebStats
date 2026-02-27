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
    <title>WebStats Selfhost Test</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: "Segoe UI", Arial, sans-serif; margin: 32px; color: #111; }
      h1 { margin: 0 0 12px; font-size: 20px; }
      .row { margin: 6px 0; }
      code { background: #f6f6f6; padding: 2px 6px; border-radius: 4px; }
      .note { margin-top: 16px; color: #555; font-size: 13px; }
    </style>
  </head>
  <body>
    <h1>WebStats Selfhost Test</h1>
    <div class="row">今日总访问量 <span id="webstats_today_pv">加载中...</span></div>
    <div class="row">今日总访客数 <span id="webstats_today_uv">加载中...</span></div>
    <div class="row">本站总访问量 <span id="webstats_site_pv">加载中...</span></div>
    <div class="row">本站总访客数 <span id="webstats_site_uv">加载中...</span></div>
    <div class="row">本页总阅读量 <span id="webstats_page_pv">加载中...</span></div>
    <div class="row">本页总访客数 <span id="webstats_page_uv">加载中...</span></div>
    <div class="note">脚本地址：<code>/webstats.min.js</code>，API：<code>/api.php</code></div>
    <div class="note">调试输出：</div>
    <pre id="webstats_debug">等待 /api.php 响应...</pre>
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

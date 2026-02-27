import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

const PORT = Number(process.env.PORT || 8080);
const DB_PATH = process.env.DB_PATH || "/data/webstats.sqlite3";

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(process.cwd(), "schema.sql"), "utf8"));

const SCRIPT_BODY = fs.readFileSync(
  path.join(process.cwd(), "webstats.min.js"),
  "utf8"
);

app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("webstats service is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/webstats.min.js", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(SCRIPT_BODY);
});

app.get("/webstats", (req, res) => {
  const callback =
    String(req.query?.jsonpCallback || req.query?.callback || "WebStatsCallback");
  if (!isValidCallback(callback)) {
    res.status(400).send("Bad Request");
    return;
  }

  const pageUrl = resolvePageUrl(req);
  if (!pageUrl) {
    res.status(400).send("Bad Request");
    return;
  }

  let counts;
  try {
    counts = handleCount(req, pageUrl);
  } catch {
    res.status(400).send("Bad Request");
    return;
  }

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(`${callback}(${JSON.stringify(counts)});`);
});

app.options("/api.php", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(204).send();
});

app.post("/api.php", (req, res) => {
  const pageUrl = String(req.body?.url || "");
  if (!pageUrl) {
    res.status(400).send("Bad Request");
    return;
  }

  try {
    const counts = handleCount(req, pageUrl);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(counts);
  } catch {
    res.status(400).send("Bad Request");
  }
});

app.listen(PORT, () => {
  console.log(`webstats-selfhost on :${PORT}`);
});

function insertUv(scope, site, page, day, visitor) {
  const stmt = db.prepare(
    "INSERT INTO uv_seen(scope, site, page, day, visitor) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING"
  );
  const info = stmt.run(scope, site, page, day, visitor);
  return info.changes ? 1 : 0;
}

function resolvePageUrl(req) {
  return String(req.query?.url || req.get("referer") || "");
}

function isValidCallback(name) {
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(name);
}

function handleCount(req, pageUrl) {
  let site;
  let page;
  const parsed = new URL(pageUrl);
  site = parsed.hostname;
  page = parsed.pathname + parsed.search;

  const day = getBeijingDay();
  const ip =
    (req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      "").toString() || "0.0.0.0";
  const ua = req.headers["user-agent"] || "";
  const visitor = crypto
    .createHash("sha256")
    .update(`${ip}|${ua}`)
    .digest("hex");

  const siteUvDayDelta = insertUv("site", site, "", day, visitor);
  const pageUvDayDelta = insertUv("page", site, page, day, visitor);
  const siteUvTotalDelta = insertUv("site", site, "", "*", visitor);
  const pageUvTotalDelta = insertUv("page", site, page, "*", visitor);

  upsertCounts(site, page, day, {
    siteUvDayDelta,
    pageUvDayDelta,
    siteUvTotalDelta,
    pageUvTotalDelta,
  });

  return readCounts(site, page, day);
}

function upsertCounts(site, page, day, deltas) {
  const {
    siteUvDayDelta,
    pageUvDayDelta,
    siteUvTotalDelta,
    pageUvTotalDelta,
  } = deltas;

  db.prepare(
    "INSERT INTO site_daily(site, day, pv, uv) VALUES (?, ?, 1, ?) ON CONFLICT(site, day) DO UPDATE SET pv = pv + 1, uv = uv + ?"
  ).run(site, day, siteUvDayDelta, siteUvDayDelta);

  db.prepare(
    "INSERT INTO site_total(site, pv, uv) VALUES (?, 1, ?) ON CONFLICT(site) DO UPDATE SET pv = pv + 1, uv = uv + ?"
  ).run(site, siteUvTotalDelta, siteUvTotalDelta);

  db.prepare(
    "INSERT INTO page_daily(site, page, day, pv, uv) VALUES (?, ?, ?, 1, ?) ON CONFLICT(site, page, day) DO UPDATE SET pv = pv + 1, uv = uv + ?"
  ).run(site, page, day, pageUvDayDelta, pageUvDayDelta);

  db.prepare(
    "INSERT INTO page_total(site, page, pv, uv) VALUES (?, ?, 1, ?) ON CONFLICT(site, page) DO UPDATE SET pv = pv + 1, uv = uv + ?"
  ).run(site, page, pageUvTotalDelta, pageUvTotalDelta);
}

function readCounts(site, page, day) {
  const todaySite = db
    .prepare("SELECT pv, uv FROM site_daily WHERE site = ? AND day = ?")
    .get(site, day);
  const todayPage = db
    .prepare("SELECT pv, uv FROM page_daily WHERE site = ? AND page = ? AND day = ?")
    .get(site, page, day);
  const totalSite = db
    .prepare("SELECT pv, uv FROM site_total WHERE site = ?")
    .get(site);
  const totalPage = db
    .prepare("SELECT pv, uv FROM page_total WHERE site = ? AND page = ?")
    .get(site, page);

  return {
    webstats_today_pv: todaySite?.pv ?? 0,
    webstats_today_uv: todaySite?.uv ?? 0,
    webstats_site_pv: totalSite?.pv ?? 0,
    webstats_site_uv: totalSite?.uv ?? 0,
    webstats_page_pv: totalPage?.pv ?? 0,
    webstats_page_uv: totalPage?.uv ?? 0,
  };
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

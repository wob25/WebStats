# WebStats

<p align="center">
  <strong>Self-hosted website traffic statistics</strong><br/>
  <sub>Cloudflare Worker + D1 / Docker + SQLite</sub>
</p>

<p align="center">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-111827?style=for-the-badge" />
  <img alt="runtime" src="https://img.shields.io/badge/runtime-Node%2020-2563eb?style=for-the-badge" />
  <img alt="deploy" src="https://img.shields.io/badge/deploy-Worker%20%7C%20Docker-16a34a?style=for-the-badge" />
</p>

<p align="center">
  <a href="./README.md">中文</a> | English (current)
</p>

---

## 1. What this project does

WebStats is a fully self-hosted traffic counter for blogs, docs sites, and static websites.

Endpoints:

- `GET /webstats.min.js`
- `POST /api.php`
- `GET /webstats?jsonpCallback=WebStatsCallback&url=...` (optional JSONP)

---

## 2. Metrics explained

| Field | Meaning | Scope |
|---|---|---|
| `webstats_today_pv` | Page views today | Site-level, current Beijing day |
| `webstats_today_uv` | Unique visitors today | Site-level, current Beijing day |
| `webstats_site_pv` | Total page views | Site-level cumulative |
| `webstats_site_uv` | Total unique visitors | Site-level cumulative |
| `webstats_page_pv` | Total page views for current page | Current page (path + query) |
| `webstats_page_uv` | Total unique visitors for current page | Current page (path + query) |

Notes:

- `pv` increments per request.
- `uv` is deduplicated by visitor fingerprint (IP + UA hash in current implementation).
- Daily metrics reset by `Asia/Shanghai` date boundary.

---

## 3. Structure

```text
.
├─ api-worker/
├─ docker/
├─ shared/
├─ webstats.min.js
├─ README.md
└─ README-EN.md
```

---

## 4. Cloudflare Worker + D1

```bash
cd api-worker
wrangler d1 create webstats
wrangler d1 execute webstats --remote --file=./schema.sql
wrangler deploy
```

Verify:

```bash
curl -i "https://your-worker.workers.dev/webstats.min.js"
curl -i -X POST "https://your-worker.workers.dev/api.php" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","referrer":""}'
```

---

## 5. Migrate existing total counts (optional)

PowerShell:

```powershell
$site = "example.com"
wrangler d1 execute webstats --remote --command "INSERT INTO site_total(site, pv, uv) VALUES ('$site', 13403, 11692) ON CONFLICT(site) DO UPDATE SET pv = excluded.pv, uv = excluded.uv"
```

Bash:

```bash
site="example.com"
wrangler d1 execute webstats --remote --command \
"INSERT INTO site_total(site, pv, uv) VALUES ('$site', 13403, 11692) ON CONFLICT(site) DO UPDATE SET pv = excluded.pv, uv = excluded.uv"
```

---

## 6. Docker

Build and push:

```bash
docker login -u <dockerhub-username>
docker buildx build --no-cache -f docker/Dockerfile -t <dockerhub-username>/webstats:v1.0 --push docker
```

Run:

```bash
docker run -d --name webstats \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  <dockerhub-username>/webstats:v1.0
```

Validate:

```bash
curl -i "http://localhost:8080/"
curl -i "http://localhost:8080/health"
curl -i "http://localhost:8080/webstats.min.js"
```

---

## 7. Claw Cloud settings

- Image: `<dockerhub-username>/webstats:v1.0`
- Port: `8080`
- Replicas: `1`
- Local Storage mount: `/data`
- Health Check: `/health` or `/webstats.min.js`

If `/` is 404 while `/webstats.min.js` and `POST /api.php` work, stats service is still functional.

---

## 8. Frontend integration

```js
fetch('https://your-counter-domain.example/api.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: window.location.href,
    referrer: document.referrer || ''
  })
})
  .then((res) => res.json())
  .then((data) => {
    // data.webstats_today_pv
    // data.webstats_today_uv
    // data.webstats_site_pv
    // data.webstats_site_uv
    // data.webstats_page_pv
    // data.webstats_page_uv
  })
```

---

## Acknowledgements

Thanks to the following platforms for supporting deployment and runtime:

- [Cloudflare](https://www.cloudflare.com/)
- [Claw Cloud](https://run.claw.cloud/)

---

## License

MIT

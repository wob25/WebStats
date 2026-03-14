# 📊 WebStats

**Lightweight, Self-hosted Website Analytics Service**  
Cloudflare Worker + D1 / Docker + SQLite

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/Runtime-Cloudflare%20Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Docker-2496ED?logo=docker)](https://www.docker.com/)

[Chinese (current)] | [English](./README-EN.md)

---

## 🖼️ Preview

![WebStats Preview](%20docs/webstats.jpeg)

---

## 1. What is this?
**WebStats** is a self-hosted analytics service suitable for blogs, documentation sites, and static pages.

**Core Interfaces:**
- `GET /webstats.min.js`: Frontend script integration
- `POST /api.php`: Analytics API
- `GET /webstats?jsonpCallback=WebStatsCallback&url=...`: JSONP compatible interface (optional)

---

## 2. Field Meanings (Key)

| Field | Meaning | Scope |
| :--- | :--- | :--- |
| `webstats_today_pv` | Today's Page Views (PV) | Current site, based on Beijing time |
| `webstats_today_uv` | Today's Unique Visitors (UV) | Current site, based on Beijing time |
| `webstats_site_pv` | Total Site Page Views | Current site, all-time accumulation |
| `webstats_site_uv` | Total Site Unique Visitors | Current site, all-time accumulation |
| `webstats_page_pv` | Current Page Page Views | Current page (URL path+query) |
| `webstats_page_uv` | Current Page Unique Visitors | Current page (URL path+query) |

**Notes:**
- **pv**: Increases with every request.
- **uv**: Deduplicated based on visitor fingerprint (IP + UA hash).
- **"today"** resets at midnight `Asia/Shanghai` time (Beijing time).

---

## 3. Directory Structure
```text
.
├─ api-worker/      # Cloudflare Worker + D1
├─ docker/          # Docker + SQLite
├─ shared/          # Shared scripts
├─  docs/           # Documentation and preview (webstats.jpeg)
├─ webstats.min.js  # Script entry point
├─ README.md
└─ README-EN.md
```

---

## 4. Worker + D1 Deployment
Execute in the `api-worker/` directory:

```bash
wrangler login
wrangler d1 create webstats
# Record the database_id from the output and fill it into wrangler.jsonc
wrangler d1 execute webstats --remote --file=./api-worker/schema.sql
wrangler deploy
```

**Verification:**
```bash
curl -i "https://your-worker.workers.dev/webstats.min.js"
curl -i -X POST "https://your-worker.workers.dev/api.php" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","referrer":""}'
```

---

## 5. Migrate Old Site Totals (Optional)

#### **PowerShell:**
```powershell
$site = "example.com"
wrangler d1 execute webstats --remote --command "INSERT INTO site_total(site, pv, uv) VALUES ('$site', 13403, 11692) ON CONFLICT(site) DO UPDATE SET pv = excluded.pv, uv = excluded.uv"
```

#### **Bash:**
```bash
site="example.com"
wrangler d1 execute webstats --remote --command \
"INSERT INTO site_total(site, pv, uv) VALUES ('$site', 13403, 11692) ON CONFLICT(site) DO UPDATE SET pv = excluded.pv, uv = excluded.uv"
```

---

## 6. Docker Deployment
**Build and Push:**
```bash
docker login -u <dockerhub-username>
docker buildx build --no-cache -f docker/Dockerfile -t <dockerhub-username>/webstats:v1.0 --push docker
```

**Run Locally:**
```bash
docker run -d --name webstats \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  <dockerhub-username>/webstats:v1.0
```

---

## 7. Claw Cloud Parameters
- **Image**: `<dockerhub-username>/webstats:v1.0`
- **Port**: `8080`
- **Replicas**: `1`
- **Local Storage**: Mount `/data` (**Required**)
- **Health Check**: `/health` or `/webstats.min.js`

**Note**: If the root path `/` returns 404 but `/webstats.min.js` and `/api.php` work, the tracking functionality is still usable.

---

## 8. Frontend Integration
Include the script in your HTML or call it manually:

```javascript
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
    // Auto-fill example:
    // document.getElementById('webstats_site_pv').innerText = data.webstats_site_pv;
  })
```

---

## 9. FAQ
- **PV increases by 2 per refresh**: Common in development mode with double-execution or redundant reporting logic.
- **PowerShell command error**: Ensure you use `$site = "..."` syntax; do not mix with Bash format.
- **insufficient scopes**: Docker Hub PAT lacks permissions; recreate with Read/Write access and log in again.

---

## Credits
Thanks to the following platforms for supporting the deployment and operation of this project:

[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)  
[![Claw Cloud](https://img.shields.io/badge/Claw%20Cloud-0052D9?logo=cloud&logoColor=white)](https://claw.cloud/)

## License
[MIT](LICENSE)

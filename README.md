# WebStats

<p align="center">
  <strong>轻量、自托管的网站访问统计服务</strong><br/>
  <sub>Cloudflare Worker + D1 / Docker + SQLite</sub>
</p>

<p align="center">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-111827?style=for-the-badge" />
  <img alt="runtime" src="https://img.shields.io/badge/runtime-Node%2020-2563eb?style=for-the-badge" />
  <img alt="deploy" src="https://img.shields.io/badge/deploy-Worker%20%7C%20Docker-16a34a?style=for-the-badge" />
</p>

<p align="center">
  中文（当前） | <a href="./README-EN.md">English</a>
</p>

---

## 1. 这是什么

WebStats 是一个可完全自建的访问统计服务，适合博客、文档站和静态站。

接口：

- `GET /webstats.min.js`：前端脚本接入
- `POST /api.php`：统计 API
- `GET /webstats?jsonpCallback=WebStatsCallback&url=...`：JSONP 兼容接口（可选）

---

## 2. 字段含义（重点）

| 字段 | 含义 | 统计范围 |
|---|---|---|
| `webstats_today_pv` | 今日页面访问次数（Page Views） | 当前站点，按北京时间当天 |
| `webstats_today_uv` | 今日独立访客数（Unique Visitors） | 当前站点，按北京时间当天 |
| `webstats_site_pv` | 站点累计访问次数 | 当前站点，全量累计 |
| `webstats_site_uv` | 站点累计独立访客数 | 当前站点，全量累计 |
| `webstats_page_pv` | 当前页面累计访问次数 | 当前页面（URL path+query） |
| `webstats_page_uv` | 当前页面累计独立访客数 | 当前页面（URL path+query） |

说明：

- `pv`：每次请求会增加。
- `uv`：按访客指纹去重（实现里使用 IP + UA 哈希）。
- “today” 以 `Asia/Shanghai`（北京时间）切日。

---

## 3. 目录结构

```text
.
├─ api-worker/      # Cloudflare Worker + D1
├─ docker/          # Docker + SQLite
├─ shared/          # 共享脚本
├─ webstats.min.js  # 脚本入口
├─ README.md
└─ README-EN.md
```

---

## 4. Worker + D1 部署

在 `api-worker/` 目录执行：

```bash
wrangler d1 create webstats
wrangler d1 execute webstats --remote --file=./schema.sql
wrangler deploy
```

验证：

```bash
curl -i "https://your-worker.workers.dev/webstats.min.js"
curl -i -X POST "https://your-worker.workers.dev/api.php" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/","referrer":""}'
```

---

## 5. 迁移旧站点总量（可选）

PowerShell：

```powershell
$site = "example.com"
wrangler d1 execute webstats --remote --command "INSERT INTO site_total(site, pv, uv) VALUES ('$site', 13403, 11692) ON CONFLICT(site) DO UPDATE SET pv = excluded.pv, uv = excluded.uv"
```

Bash：

```bash
site="example.com"
wrangler d1 execute webstats --remote --command \
"INSERT INTO site_total(site, pv, uv) VALUES ('$site', 13403, 11692) ON CONFLICT(site) DO UPDATE SET pv = excluded.pv, uv = excluded.uv"
```

---

## 6. Docker 部署

构建并推送：

```bash
docker login -u <dockerhub-username>
docker buildx build --no-cache -f docker/Dockerfile -t <dockerhub-username>/webstats:v1.0 --push docker
```

本地运行：

```bash
docker run -d --name webstats \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  <dockerhub-username>/webstats:v1.0
```

验证：

```bash
curl -i "http://localhost:8080/"
curl -i "http://localhost:8080/health"
curl -i "http://localhost:8080/webstats.min.js"
```

---

## 7. Claw Cloud 参数

- Image: `<dockerhub-username>/webstats:v1.0`
- Port: `8080`
- Replicas: `1`
- Local Storage: 挂载 `/data`（必须）
- Health Check: `/health` 或 `/webstats.min.js`

说明：若根路径 `/` 返回 404，但 `/webstats.min.js` 和 `/api.php` 正常，统计功能仍可用。

---

## 8. 前端接入

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

## 9. 常见问题

1. 刷新一次 PV 增加 2
- 常见于开发模式双执行或页面存在重复上报逻辑。

2. PowerShell 命令报错
- 不要混用 Bash 语法，PowerShell 变量写法是 `$site = "..."`。

3. `insufficient scopes`
- Docker Hub PAT 权限不足，重新创建带 `Read/Write` 的 PAT 后重新登录。

---

## 致谢

感谢以下平台对本项目部署与运行提供支持：

- [Cloudflare](https://www.cloudflare.com/)
- [Claw Cloud](https://run.claw.cloud/)

---

## License

MIT

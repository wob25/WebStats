CREATE TABLE IF NOT EXISTS uv_seen (
  scope TEXT NOT NULL,          -- 'site' or 'page'
  site TEXT NOT NULL,
  page TEXT NOT NULL,           -- empty string for site scope
  day TEXT NOT NULL,            -- YYYY-MM-DD or '*' for all-time
  visitor TEXT NOT NULL,        -- hashed ip+ua
  PRIMARY KEY (scope, site, page, day, visitor)
);

CREATE TABLE IF NOT EXISTS site_daily (
  site TEXT NOT NULL,
  day TEXT NOT NULL,
  pv INTEGER NOT NULL DEFAULT 0,
  uv INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, day)
);

CREATE TABLE IF NOT EXISTS site_total (
  site TEXT NOT NULL PRIMARY KEY,
  pv INTEGER NOT NULL DEFAULT 0,
  uv INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS page_daily (
  site TEXT NOT NULL,
  page TEXT NOT NULL,
  day TEXT NOT NULL,
  pv INTEGER NOT NULL DEFAULT 0,
  uv INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, page, day)
);

CREATE TABLE IF NOT EXISTS page_total (
  site TEXT NOT NULL,
  page TEXT NOT NULL,
  pv INTEGER NOT NULL DEFAULT 0,
  uv INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, page)
);

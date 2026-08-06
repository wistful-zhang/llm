PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS threads (
  site_id TEXT NOT NULL,
  question_slug TEXT NOT NULL,
  next_floor INTEGER NOT NULL DEFAULT 0 CHECK (next_floor >= 0),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (site_id, question_slug)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  question_slug TEXT NOT NULL,
  floor INTEGER NOT NULL CHECK (floor > 0),
  nickname TEXT NOT NULL CHECK (length(nickname) BETWEEN 2 AND 24),
  body TEXT NOT NULL CHECK (
    (status = 'deleted' AND length(body) = 0)
    OR (status != 'deleted' AND length(body) BETWEEN 2 AND 2000)
  ),
  parent_id TEXT,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  edit_token_hash TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (site_id, question_slug) REFERENCES threads(site_id, question_slug),
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL,
  UNIQUE (site_id, request_id),
  UNIQUE (site_id, question_slug, floor)
);

CREATE INDEX IF NOT EXISTS comments_public_thread_floor
  ON comments(site_id, question_slug, status, floor);
CREATE INDEX IF NOT EXISTS comments_created_at
  ON comments(site_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  question_slug TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 2 AND 500),
  reporter_key TEXT NOT NULL,
  request_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (comment_id) REFERENCES comments(id),
  UNIQUE (site_id, request_id),
  UNIQUE (site_id, comment_id, reporter_key)
);

CREATE INDEX IF NOT EXISTS reports_moderation_queue
  ON reports(site_id, status, created_at);

CREATE TABLE IF NOT EXISTS moderation_log (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'report', 'thread')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS moderation_log_created_at
  ON moderation_log(site_id, created_at DESC);

-- rate_key 是由 HASH_SECRET、UTC 日期、操作范围和来源地址生成的 HMAC。
-- 数据库从不保存原始来源地址或 User-Agent；定时任务会清除过期窗口。
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT NOT NULL,
  window_date TEXT NOT NULL,
  scope TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count > 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (rate_key, window_date, scope)
) WITHOUT ROWID;

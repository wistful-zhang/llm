PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS public_questions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 160),
  category TEXT NOT NULL CHECK (length(category) BETWEEN 1 AND 30),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('待评估', '简单', '中等', '困难')),
  answer_status TEXT NOT NULL CHECK (answer_status IN ('pending', 'complete')),
  answer TEXT NOT NULL CHECK (
    length(answer) <= 50000
    AND (answer_status = 'pending' OR length(answer) > 0)
  ),
  follow_ups_json TEXT NOT NULL DEFAULT '[]' CHECK (
    json_valid(follow_ups_json) AND json_type(follow_ups_json) = 'array'
  ),
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (
    json_valid(tags_json) AND json_type(tags_json) = 'array'
  ),
  source TEXT NOT NULL DEFAULT '' CHECK (length(source) <= 80),
  author TEXT NOT NULL DEFAULT '匿名用户' CHECK (length(author) BETWEEN 2 AND 24),
  local_id TEXT NOT NULL DEFAULT '' CHECK (length(local_id) <= 120),
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  edit_token_hash TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (site_id, request_id)
);

CREATE INDEX IF NOT EXISTS public_questions_visible_updated
  ON public_questions(site_id, status, updated_at DESC, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS public_questions_active_local_id
  ON public_questions(site_id, local_id)
  WHERE local_id != '' AND status IN ('visible', 'hidden');

-- 0001 的审核日志只允许评论、举报和评论区。扩展约束以记录公开题的事后治理。
DROP INDEX IF EXISTS moderation_log_created_at;

CREATE TABLE IF NOT EXISTS moderation_log_next (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'report', 'thread', 'question')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO moderation_log_next
  (id, site_id, action, target_type, target_id, reason, created_at)
SELECT id, site_id, action, target_type, target_id, reason, created_at
FROM moderation_log;

DROP TABLE moderation_log;
ALTER TABLE moderation_log_next RENAME TO moderation_log;

CREATE INDEX IF NOT EXISTS moderation_log_created_at
  ON moderation_log(site_id, created_at DESC);

PRAGMA foreign_keys = ON;

-- 题号属于站点内的稳定追加顺序。列保持可空，以兼容 migration 已应用、
-- 新 Worker 尚未部署时仍按旧列集合写入的请求；下面的触发器会在同一
-- INSERT 事务中补齐号码。
ALTER TABLE public_questions ADD COLUMN library_number INTEGER;

CREATE TRIGGER public_questions_assign_library_number
AFTER INSERT ON public_questions
WHEN NEW.library_number IS NULL
BEGIN
  UPDATE public_questions
  SET library_number = (
    SELECT COALESCE(MAX(existing.library_number), 0) + 1
    FROM public_questions AS existing
    WHERE existing.site_id = NEW.site_id AND existing.id != NEW.id
  )
  WHERE id = NEW.id;
END;

-- 所有历史状态都保留题号：隐藏、删除再恢复时不会被重新编号，后续新增
-- 也不会复用软删除记录占用的最大号码。
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY site_id
      ORDER BY created_at ASC, id ASC
    ) AS library_number
  FROM public_questions
)
UPDATE public_questions
SET library_number = (
  SELECT ranked.library_number
  FROM ranked
  WHERE ranked.id = public_questions.id
);

CREATE UNIQUE INDEX public_questions_site_library_number
  ON public_questions(site_id, library_number);

CREATE INDEX public_questions_visible_library_number
  ON public_questions(site_id, status, library_number);

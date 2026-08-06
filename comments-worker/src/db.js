import { HttpError } from "./validation.js";

const PUBLIC_STATUSES = "('visible', 'deleted')";

export async function getThread(db, siteId, slug) {
  return db
    .prepare("SELECT next_floor, version, locked FROM threads WHERE site_id = ? AND question_slug = ?")
    .bind(siteId, slug)
    .first();
}

export async function ensureThread(db, siteId, slug, now) {
  await db
    .prepare(
      `INSERT INTO threads (site_id, question_slug, next_floor, version, locked, created_at, updated_at)
       VALUES (?, ?, 0, 0, 0, ?, ?)
       ON CONFLICT(site_id, question_slug) DO NOTHING`,
    )
    .bind(siteId, slug, now, now)
    .run();
  return getThread(db, siteId, slug);
}

export async function listComments(db, siteId, slug, cursor, limit) {
  const thread = await getThread(db, siteId, slug);
  const rows = await db
    .prepare(
      `SELECT c.id, c.floor, c.nickname, c.body, c.status, c.created_at, c.updated_at,
              p.id AS parent_id, p.floor AS parent_floor, p.nickname AS parent_nickname,
              p.status AS parent_status
       FROM comments c
       LEFT JOIN comments p ON p.id = c.parent_id
       WHERE c.site_id = ? AND c.question_slug = ?
         AND c.floor > ? AND c.status IN ${PUBLIC_STATUSES}
       ORDER BY c.floor ASC
       LIMIT ?`,
    )
    .bind(siteId, slug, cursor, limit + 1)
    .all();
  const totalRow = await db
    .prepare(
      `SELECT COUNT(*) AS total FROM comments
       WHERE site_id = ? AND question_slug = ? AND status IN ${PUBLIC_STATUSES}`,
    )
    .bind(siteId, slug)
    .first();
  const hasMore = rows.results.length > limit;
  const visibleRows = hasMore ? rows.results.slice(0, limit) : rows.results;
  return {
    comments: visibleRows.map(toPublicComment),
    total: Number(totalRow?.total || 0),
    nextCursor: hasMore ? Number(visibleRows.at(-1).floor) : null,
    locked: Boolean(thread?.locked),
  };
}

export async function countPublicComments(db, siteId, slug) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total FROM comments
       WHERE site_id = ? AND question_slug = ? AND status IN ${PUBLIC_STATUSES}`,
    )
    .bind(siteId, slug)
    .first();
  return Number(row?.total || 0);
}

export async function findIdempotentComment(db, siteId, slug, requestId, editHash) {
  const row = await db
    .prepare(
      `SELECT c.id, c.floor, c.nickname, c.body, c.status, c.created_at, c.updated_at,
              p.id AS parent_id, p.floor AS parent_floor, p.nickname AS parent_nickname,
              p.status AS parent_status
       FROM comments c LEFT JOIN comments p ON p.id = c.parent_id
       WHERE c.site_id = ? AND c.question_slug = ? AND c.request_id = ? AND c.edit_token_hash = ?`,
    )
    .bind(siteId, slug, requestId, editHash)
    .first();
  return row ? toPublicComment(row) : null;
}

export async function requestIdExists(db, siteId, requestId) {
  const row = await db
    .prepare("SELECT 1 AS found FROM comments WHERE site_id = ? AND request_id = ?")
    .bind(siteId, requestId)
    .first();
  return Boolean(row);
}

export async function getReplyParent(db, siteId, slug, parentId) {
  if (!parentId) return null;
  const parent = await db
    .prepare(
      `SELECT id, floor, nickname, parent_id, status FROM comments
       WHERE id = ? AND site_id = ? AND question_slug = ?`,
    )
    .bind(parentId, siteId, slug)
    .first();
  if (!parent || parent.status !== "visible") {
    throw new HttpError(404, "parent_not_found", "要回复的评论不存在或已不可见");
  }
  return parent;
}

export async function consumeRateLimit(db, { key, day, limit, scope, now }) {
  const result = await db
    .prepare(
      `INSERT INTO rate_limits (rate_key, window_date, scope, count, updated_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(rate_key, window_date, scope) DO UPDATE SET
         count = rate_limits.count + 1,
         updated_at = excluded.updated_at
       WHERE rate_limits.count < ?
       RETURNING count`,
    )
    .bind(key, day, scope, now, limit)
    .all();
  if (!result.results.length) {
    throw new HttpError(429, "rate_limited", "今天的操作次数已达上限，请明天再试");
  }
  return Number(result.results[0].count);
}

export async function insertCommentWithFloor(db, comment, maxAttempts = 6) {
  await ensureThread(db, comment.siteId, comment.slug, comment.now);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const thread = await getThread(db, comment.siteId, comment.slug);
    if (!thread) continue;
    if (thread.locked) {
      throw new HttpError(423, "thread_locked", "这道题的评论区已锁定");
    }
    const floor = Number(thread.next_floor) + 1;
    const claimStatement = db.prepare(
      `UPDATE threads SET next_floor = ?, version = version + 1, updated_at = ?
       WHERE site_id = ? AND question_slug = ? AND version = ? AND locked = 0`,
    )
      .bind(floor, comment.now, comment.siteId, comment.slug, thread.version);
    const insertStatement = db.prepare(
      `INSERT INTO comments
        (id, site_id, question_slug, floor, nickname, body, parent_id, status,
         edit_token_hash, request_id, created_at, updated_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, 'visible', ?, ?, ?, ?
       WHERE changes() = 1`,
    )
      .bind(
        comment.id,
        comment.siteId,
        comment.slug,
        floor,
        comment.nickname,
        comment.body,
        comment.parentId,
        comment.editHash,
        comment.requestId,
        comment.now,
        comment.now,
      );
    const [claim, inserted] = await db.batch([claimStatement, insertStatement]);
    if (Number(claim.meta?.changes || 0) !== 1) continue;
    if (Number(inserted.meta?.changes || 0) !== 1) {
      throw new HttpError(500, "floor_insert_failed", "评论楼层写入失败，请重试");
    }
    return getCommentById(db, comment.siteId, comment.id);
  }
  throw new HttpError(409, "floor_conflict", "评论楼层冲突，请重试");
}

export async function getCommentById(db, siteId, id) {
  const row = await db
    .prepare(
      `SELECT c.id, c.floor, c.nickname, c.body, c.status, c.created_at, c.updated_at,
              p.id AS parent_id, p.floor AS parent_floor, p.nickname AS parent_nickname,
              p.status AS parent_status
       FROM comments c LEFT JOIN comments p ON p.id = c.parent_id
       WHERE c.site_id = ? AND c.id = ?`,
    )
    .bind(siteId, id)
    .first();
  return row ? toPublicComment(row) : null;
}

export async function editOwnComment(db, { siteId, id, editHash, body, now }) {
  const result = await db
    .prepare(
      `UPDATE comments SET body = ?, updated_at = ?
       WHERE site_id = ? AND id = ? AND edit_token_hash = ? AND status = 'visible'`
    )
    .bind(body, now, siteId, id, editHash)
    .run();
  if (Number(result.meta?.changes || 0) !== 1) {
    throw new HttpError(403, "edit_denied", "编辑凭证不正确，或评论已不可编辑");
  }
  return getCommentById(db, siteId, id);
}

export async function deleteOwnComment(db, { siteId, id, editHash, now }) {
  const result = await db
    .prepare(
      `UPDATE comments
       SET nickname = '已删除', body = '', status = 'deleted', updated_at = ?, deleted_at = ?
       WHERE site_id = ? AND id = ? AND edit_token_hash = ? AND status = 'visible'`,
    )
    .bind(now, now, siteId, id, editHash)
    .run();
  if (Number(result.meta?.changes || 0) !== 1) {
    throw new HttpError(403, "delete_denied", "删除凭证不正确，或评论已删除");
  }
  return getCommentById(db, siteId, id);
}

export async function findIdempotentReport(db, siteId, requestId) {
  return db
    .prepare("SELECT id, status, created_at FROM reports WHERE site_id = ? AND request_id = ?")
    .bind(siteId, requestId)
    .first();
}

export async function createReport(db, report) {
  const comment = await db
    .prepare(
      `SELECT id, question_slug FROM comments
       WHERE site_id = ? AND id = ? AND status = 'visible'`,
    )
    .bind(report.siteId, report.commentId)
    .first();
  if (!comment) throw new HttpError(404, "comment_not_found", "评论不存在或已不可见");

  try {
    await db
      .prepare(
        `INSERT INTO reports
          (id, comment_id, site_id, question_slug, reason, reporter_key, request_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      )
      .bind(
        report.id,
        report.commentId,
        report.siteId,
        comment.question_slug,
        report.reason,
        report.reporterKey,
        report.requestId,
        report.now,
        report.now,
      )
      .run();
  } catch (error) {
    const existing = await db
      .prepare(
        `SELECT id, status, created_at FROM reports
         WHERE site_id = ? AND comment_id = ? AND reporter_key = ?`,
      )
      .bind(report.siteId, report.commentId, report.reporterKey)
      .first();
    if (existing) return existing;
    throw error;
  }
  return { id: report.id, status: "pending", created_at: report.now };
}

export function toPublicComment(row) {
  const deleted = row.status === "deleted";
  return {
    id: row.id,
    floor: Number(row.floor),
    nickname: deleted ? "已删除" : row.nickname,
    body: deleted ? "" : row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replyTo: row.parent_id
      ? {
          id: row.parent_id,
          floor: Number(row.parent_floor),
          nickname:
            row.parent_status === "visible"
              ? row.parent_nickname
              : row.parent_status === "hidden"
                ? "已隐藏"
                : "已删除",
        }
      : null,
    status: row.status,
  };
}

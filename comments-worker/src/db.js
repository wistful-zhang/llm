import { HttpError } from "./validation.js";

const PUBLIC_STATUSES = "('visible', 'deleted')";
const QUESTION_COLUMNS = `id, library_number, title, category, difficulty, answer_status, answer,
  follow_ups_json, tags_json, source, author, local_id, status, created_at, updated_at`;

export async function listPublicQuestions(db, siteId, cursor, limit) {
  const rows = await db
    .prepare(
      `SELECT ${QUESTION_COLUMNS}
       FROM public_questions
       WHERE site_id = ? AND status = 'visible' AND library_number > ?
       ORDER BY library_number ASC
       LIMIT ?`,
    )
    .bind(siteId, cursor, limit + 1)
    .all();
  const total = await countPublicQuestions(db, siteId);
  const hasMore = rows.results.length > limit;
  const visibleRows = hasMore ? rows.results.slice(0, limit) : rows.results;
  const questions = visibleRows.map(toPublicQuestion);
  return {
    questions,
    total,
    nextCursor: hasMore ? questions.at(-1).libraryNumber : null,
  };
}

export async function listAdminPublicQuestions(db, siteId, cursor, limit) {
  const rows = await db
    .prepare(
      `SELECT ${QUESTION_COLUMNS}
       FROM public_questions
       WHERE site_id = ? AND status IN ('visible', 'hidden')
       ORDER BY updated_at DESC, id DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(siteId, limit + 1, cursor)
    .all();
  const hasMore = rows.results.length > limit;
  const items = hasMore ? rows.results.slice(0, limit) : rows.results;
  return {
    items: items.map(toPublicQuestion),
    nextCursor: hasMore ? cursor + items.length : null,
  };
}

export async function countPublicQuestions(db, siteId) {
  const row = await db
    .prepare("SELECT COUNT(*) AS total FROM public_questions WHERE site_id = ? AND status = 'visible'")
    .bind(siteId)
    .first();
  return Number(row?.total || 0);
}

export async function getPublicQuestionById(db, siteId, id) {
  const row = await db
    .prepare(
      `SELECT ${QUESTION_COLUMNS}
       FROM public_questions WHERE site_id = ? AND id = ? AND status = 'visible'`,
    )
    .bind(siteId, id)
    .first();
  return row ? toPublicQuestion(row) : null;
}

export async function getOwnedQuestion(db, siteId, id, editHash) {
  const row = await db
    .prepare(
      `SELECT ${QUESTION_COLUMNS}
       FROM public_questions
       WHERE site_id = ? AND id = ? AND edit_token_hash = ? AND status IN ('visible', 'hidden')`,
    )
    .bind(siteId, id, editHash)
    .first();
  if (!row) throw new HttpError(403, "question_edit_denied", "编辑凭证不正确，或题目已不可编辑");
  return toQuestionRecord(row);
}

export async function getOwnedQuestionDeletionState(db, siteId, id, editHash) {
  const row = await db
    .prepare(
      `SELECT id, status, updated_at
       FROM public_questions
       WHERE site_id = ? AND id = ? AND edit_token_hash = ?
         AND status IN ('visible', 'hidden', 'deleted')`,
    )
    .bind(siteId, id, editHash)
    .first();
  if (!row) throw new HttpError(403, "question_delete_denied", "删除凭证不正确，或题目不存在");
  return { id: row.id, status: row.status, updatedAt: row.updated_at };
}

export async function findIdempotentQuestion(db, siteId, requestId, editHash) {
  const row = await db
    .prepare(
      `SELECT ${QUESTION_COLUMNS}
       FROM public_questions
       WHERE site_id = ? AND request_id = ? AND edit_token_hash = ?`,
    )
    .bind(siteId, requestId, editHash)
    .first();
  return row ? toPublicQuestion(row) : null;
}

export async function publicQuestionRequestIdExists(db, siteId, requestId) {
  const row = await db
    .prepare("SELECT 1 AS found FROM public_questions WHERE site_id = ? AND request_id = ?")
    .bind(siteId, requestId)
    .first();
  return Boolean(row);
}

export async function findActiveQuestionByLocalId(db, siteId, localId) {
  if (!localId) return null;
  const row = await db
    .prepare(
      `SELECT ${QUESTION_COLUMNS}, edit_token_hash
       FROM public_questions
       WHERE site_id = ? AND local_id = ? AND status IN ('visible', 'hidden')`,
    )
    .bind(siteId, localId)
    .first();
  return row ? { ...toQuestionRecord(row), editHash: row.edit_token_hash } : null;
}

export async function insertPublicQuestion(db, question) {
  await db
    .prepare(
      `INSERT INTO public_questions
        (id, site_id, title, category, difficulty, answer_status, answer, follow_ups_json,
         tags_json, source, author, local_id, status, edit_token_hash, request_id,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'visible', ?, ?, ?, ?)`,
    )
    .bind(
      question.id,
      question.siteId,
      question.title,
      question.category,
      question.difficulty,
      question.answerStatus,
      question.answer,
      JSON.stringify(question.followUps),
      JSON.stringify(question.tags),
      question.source,
      question.author,
      question.localId,
      question.editHash,
      question.requestId,
      question.now,
      question.now,
    )
    .run();
  return getPublicQuestionById(db, question.siteId, question.id);
}

export async function updateOwnQuestion(db, { siteId, id, editHash, fields, now }) {
  let result;
  try {
    result = await db
      .prepare(
        `UPDATE public_questions SET
           title = ?, category = ?, difficulty = ?, answer_status = ?, answer = ?,
           follow_ups_json = ?, tags_json = ?, source = ?, author = ?, local_id = ?, updated_at = ?
         WHERE site_id = ? AND id = ? AND edit_token_hash = ? AND status = 'visible'`,
      )
      .bind(
        fields.title,
        fields.category,
        fields.difficulty,
        fields.answerStatus,
        fields.answer,
        JSON.stringify(fields.followUps),
        JSON.stringify(fields.tags),
        fields.source,
        fields.author,
        fields.localId,
        now,
        siteId,
        id,
        editHash,
      )
      .run();
  } catch (error) {
    if (fields.localId) {
      const conflicting = await findActiveQuestionByLocalId(db, siteId, fields.localId);
      if (conflicting && conflicting.id !== id) {
        throw new HttpError(409, "local_id_conflict", "这道本机题目已经公开发布");
      }
    }
    throw error;
  }
  if (Number(result.meta?.changes || 0) !== 1) {
    throw new HttpError(403, "question_edit_denied", "编辑凭证不正确，或题目已不可编辑");
  }
  return getPublicQuestionById(db, siteId, id);
}

export async function deleteOwnQuestion(db, { siteId, id, editHash, now }) {
  const result = await db
    .prepare(
      `UPDATE public_questions SET
         title = '已删除', category = '待整理', difficulty = '待评估',
         answer_status = 'pending', answer = '', follow_ups_json = '[]', tags_json = '[]',
         source = '', author = '匿名用户', local_id = '', status = 'deleted',
         updated_at = ?, deleted_at = ?
       WHERE site_id = ? AND id = ? AND edit_token_hash = ? AND status IN ('visible', 'hidden')`,
    )
    .bind(now, now, siteId, id, editHash)
    .run();
  if (Number(result.meta?.changes || 0) === 1) {
    return { id, status: "deleted", updatedAt: now };
  }

  // The first DELETE may have committed even when its response was lost. Keep the
  // token hash on the scrubbed tombstone so the same owner can safely retry without
  // exposing any deleted question fields.
  const tombstone = await db
    .prepare(
      `SELECT id, status, updated_at
       FROM public_questions
       WHERE site_id = ? AND id = ? AND edit_token_hash = ? AND status = 'deleted'`,
    )
    .bind(siteId, id, editHash)
    .first();
  if (tombstone) {
    return { id: tombstone.id, status: "deleted", updatedAt: tombstone.updated_at };
  }
  throw new HttpError(403, "question_delete_denied", "删除凭证不正确，或题目不存在");
}

export async function moderatePublicQuestion(db, { siteId, id, action, reason, now }) {
  let statement;
  if (action === "hide") {
    statement = db
      .prepare(
        "UPDATE public_questions SET status = 'hidden', updated_at = ? WHERE site_id = ? AND id = ? AND status = 'visible'",
      )
      .bind(now, siteId, id);
  } else if (action === "show") {
    statement = db
      .prepare(
        "UPDATE public_questions SET status = 'visible', updated_at = ? WHERE site_id = ? AND id = ? AND status = 'hidden'",
      )
      .bind(now, siteId, id);
  } else if (action === "delete") {
    statement = db
      .prepare(
        `UPDATE public_questions SET
           title = '已删除', category = '待整理', difficulty = '待评估',
           answer_status = 'pending', answer = '', follow_ups_json = '[]', tags_json = '[]',
           source = '', author = '匿名用户', local_id = '', status = 'deleted',
           updated_at = ?, deleted_at = ?
         WHERE site_id = ? AND id = ? AND status IN ('visible', 'hidden')`,
      )
      .bind(now, now, siteId, id);
  } else {
    throw new HttpError(400, "invalid_action", "管理操作不合法");
  }
  const log = db
    .prepare(
      `INSERT INTO moderation_log (id, site_id, action, target_type, target_id, reason, created_at)
       SELECT ?, ?, ?, 'question', ?, ?, ? WHERE changes() = 1`,
    )
    .bind(crypto.randomUUID(), siteId, action, id, reason, now);
  const [result] = await db.batch([statement, log]);
  if (Number(result.meta?.changes || 0) !== 1) {
    throw new HttpError(409, "question_moderation_conflict", "题目状态已经变化，请刷新后重试");
  }
  if (action === "delete") return { id, status: "deleted", updatedAt: now };
  const row = await getQuestionRecordById(db, siteId, id);
  return toPublicQuestion(row);
}

async function getQuestionRecordById(db, siteId, id) {
  return db
    .prepare(`SELECT ${QUESTION_COLUMNS} FROM public_questions WHERE site_id = ? AND id = ?`)
    .bind(siteId, id)
    .first();
}

export function toPublicQuestion(row) {
  if (row.status === "deleted") {
    return { id: row.id, status: "deleted", updatedAt: row.updated_at };
  }
  const question = toQuestionRecord(row);
  return {
    id: question.id,
    libraryNumber: question.libraryNumber,
    title: question.title,
    category: question.category,
    difficulty: question.difficulty,
    answerStatus: question.answerStatus,
    answer: question.answer,
    followUps: question.followUps,
    tags: question.tags,
    source: question.source,
    author: question.author,
    localId: question.localId,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    status: question.status,
  };
}

function toQuestionRecord(row) {
  return {
    id: row.id,
    libraryNumber: parseStoredLibraryNumber(row.library_number),
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    answerStatus: row.answer_status,
    answer: row.answer,
    followUps: parseStoredStringList(row.follow_ups_json),
    tags: parseStoredStringList(row.tags_json),
    source: row.source,
    author: row.author,
    localId: row.local_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
  };
}

function parseStoredLibraryNumber(value) {
  const libraryNumber = Number(value);
  if (!Number.isSafeInteger(libraryNumber) || libraryNumber < 1) {
    throw new HttpError(500, "question_number_invalid", "公开题目的固定题号无效");
  }
  return libraryNumber;
}

function parseStoredStringList(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

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

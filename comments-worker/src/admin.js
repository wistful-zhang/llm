import { HttpError, normalizePlainText, validateSlug } from "./validation.js";
import { assertAdmin, jsonResponse, readJson } from "./security.js";

const ADMIN_PAGE_SIZE = 30;

export async function handleAdminApi(request, env, url) {
  await assertAdmin(request, env);
  const method = request.method.toUpperCase();

  if (method === "GET" && url.pathname === "/v1/admin/overview") {
    const [comments, reports, threads] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE site_id = ? AND status = 'visible'")
        .bind(env.SITE_ID)
        .first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM reports WHERE site_id = ? AND status = 'pending'")
        .bind(env.SITE_ID)
        .first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM threads WHERE site_id = ? AND locked = 1")
        .bind(env.SITE_ID)
        .first(),
    ]);
    return jsonResponse(request, env, {
      visibleComments: Number(comments?.count || 0),
      pendingReports: Number(reports?.count || 0),
      lockedThreads: Number(threads?.count || 0),
    });
  }

  if (method === "GET" && url.pathname === "/v1/admin/export") {
    const [threads, comments, reports, moderationLog] = await Promise.all([
      env.DB.prepare(
        `SELECT question_slug, next_floor, locked, created_at, updated_at
         FROM threads WHERE site_id = ? ORDER BY question_slug ASC`,
      )
        .bind(env.SITE_ID)
        .all(),
      env.DB.prepare(
        `SELECT id, question_slug, floor, nickname, body, parent_id, status, created_at, updated_at, deleted_at
         FROM comments WHERE site_id = ? ORDER BY question_slug ASC, floor ASC`,
      )
        .bind(env.SITE_ID)
        .all(),
      env.DB.prepare(
        `SELECT id, comment_id, question_slug, reason, status, created_at, updated_at, resolved_at
         FROM reports WHERE site_id = ? ORDER BY created_at ASC, id ASC`,
      )
        .bind(env.SITE_ID)
        .all(),
      env.DB.prepare(
        `SELECT id, action, target_type, target_id, reason, created_at
         FROM moderation_log WHERE site_id = ? ORDER BY created_at ASC, id ASC`,
      )
        .bind(env.SITE_ID)
        .all(),
    ]);
    const exportedAt = new Date().toISOString();
    return jsonResponse(
      request,
      env,
      {
        version: 1,
        siteId: env.SITE_ID,
        exportedAt,
        threads: threads.results.map((row) => ({
          questionSlug: row.question_slug,
          nextFloor: Number(row.next_floor),
          locked: Boolean(row.locked),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        comments: comments.results.map((row) => ({
          id: row.id,
          questionSlug: row.question_slug,
          floor: Number(row.floor),
          nickname: row.nickname,
          body: row.body,
          parentId: row.parent_id,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        })),
        reports: reports.results.map((row) => ({
          id: row.id,
          commentId: row.comment_id,
          questionSlug: row.question_slug,
          reason: row.reason,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
        })),
        moderationLog: moderationLog.results.map((row) => ({
          id: row.id,
          action: row.action,
          targetType: row.target_type,
          targetId: row.target_id,
          reason: row.reason,
          createdAt: row.created_at,
        })),
      },
      200,
      {
        "content-disposition": `attachment; filename="comments-export-${exportedAt.slice(0, 10)}.json"`,
      },
    );
  }

  if (method === "GET" && url.pathname === "/v1/admin/comments") {
    const cursor = parseAdminCursor(url.searchParams.get("cursor"));
    const status = url.searchParams.get("status");
    const question = url.searchParams.get("question");
    const where = ["c.site_id = ?"];
    const bindings = [env.SITE_ID];
    if (status) {
      if (!["visible", "hidden", "deleted"].includes(status)) {
        throw new HttpError(400, "invalid_status", "评论状态不合法");
      }
      where.push("c.status = ?");
      bindings.push(status);
    }
    if (question) {
      where.push("c.question_slug = ?");
      bindings.push(validateSlug(question));
    }
    const result = await env.DB.prepare(
      `SELECT c.id, c.question_slug, c.floor, c.nickname, c.body, c.status, c.created_at, c.updated_at,
              t.locked AS thread_locked,
              (SELECT COUNT(*) FROM reports r WHERE r.comment_id = c.id AND r.status = 'pending') AS report_count
       FROM comments c
       JOIN threads t ON t.site_id = c.site_id AND t.question_slug = c.question_slug
       WHERE ${where.join(" AND ")}
       ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?`,
    )
      .bind(...bindings, ADMIN_PAGE_SIZE + 1, cursor)
      .all();
    const hasMore = result.results.length > ADMIN_PAGE_SIZE;
    const rows = hasMore ? result.results.slice(0, ADMIN_PAGE_SIZE) : result.results;
    return jsonResponse(request, env, {
      items: rows.map((row) => ({
        id: row.id,
        questionSlug: row.question_slug,
        floor: Number(row.floor),
        nickname: row.nickname,
        body: row.body,
        status: row.status,
        threadLocked: Boolean(row.thread_locked),
        reportCount: Number(row.report_count || 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      nextCursor: hasMore ? cursor + ADMIN_PAGE_SIZE : null,
    });
  }

  if (method === "GET" && url.pathname === "/v1/admin/reports") {
    const cursor = parseAdminCursor(url.searchParams.get("cursor"));
    const status = url.searchParams.get("status") || "pending";
    if (!["pending", "resolved", "dismissed"].includes(status)) {
      throw new HttpError(400, "invalid_status", "举报状态不合法");
    }
    const result = await env.DB.prepare(
      `SELECT r.id, r.question_slug, r.reason, r.status, r.created_at,
              c.id AS comment_id, c.floor, c.nickname, c.body, c.status AS comment_status
       FROM reports r JOIN comments c ON c.id = r.comment_id
       WHERE r.site_id = ? AND r.status = ?
       ORDER BY r.created_at ASC, r.id ASC LIMIT ? OFFSET ?`,
    )
      .bind(env.SITE_ID, status, ADMIN_PAGE_SIZE + 1, cursor)
      .all();
    const hasMore = result.results.length > ADMIN_PAGE_SIZE;
    const rows = hasMore ? result.results.slice(0, ADMIN_PAGE_SIZE) : result.results;
    return jsonResponse(request, env, {
      items: rows.map((row) => ({
        id: row.id,
        questionSlug: row.question_slug,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
        comment: {
          id: row.comment_id,
          floor: Number(row.floor),
          nickname: row.nickname,
          body: row.body,
          status: row.comment_status,
        },
      })),
      nextCursor: hasMore ? cursor + ADMIN_PAGE_SIZE : null,
    });
  }

  const commentMatch = url.pathname.match(/^\/v1\/admin\/comments\/([^/]+)$/);
  if (method === "PATCH" && commentMatch) {
    const commentId = parseUuidPath(commentMatch[1]);
    const input = await readJson(request);
    const action = parseAction(input.action, ["hide", "show", "delete"]);
    const reason = parseOptionalReason(input.reason);
    const now = new Date().toISOString();
    let statement;
    if (action === "hide") {
      statement = env.DB.prepare(
        "UPDATE comments SET status = 'hidden', updated_at = ? WHERE site_id = ? AND id = ? AND status = 'visible'",
      ).bind(now, env.SITE_ID, commentId);
    } else if (action === "show") {
      statement = env.DB.prepare(
        "UPDATE comments SET status = 'visible', updated_at = ? WHERE site_id = ? AND id = ? AND status = 'hidden'",
      ).bind(now, env.SITE_ID, commentId);
    } else {
      statement = env.DB.prepare(
        `UPDATE comments SET nickname = '已删除', body = '', status = 'deleted', updated_at = ?, deleted_at = ?
         WHERE site_id = ? AND id = ? AND status != 'deleted'`,
      ).bind(now, now, env.SITE_ID, commentId);
    }
    const log = moderationLogAfterChange(env, action, "comment", commentId, reason, now);
    const [result] = await env.DB.batch([statement, log]);
    if (Number(result.meta?.changes || 0) !== 1) {
      throw new HttpError(409, "moderation_conflict", "评论状态已变化，请刷新后重试");
    }
    const status = action === "hide" ? "hidden" : action === "show" ? "visible" : "deleted";
    return jsonResponse(request, env, { ok: true, id: commentId, status });
  }

  const reportMatch = url.pathname.match(/^\/v1\/admin\/reports\/([^/]+)$/);
  if (method === "PATCH" && reportMatch) {
    const reportId = parseUuidPath(reportMatch[1]);
    const input = await readJson(request);
    const action = parseAction(input.action, ["hide", "dismiss"]);
    const reason = parseOptionalReason(input.reason);
    const report = await env.DB.prepare(
      "SELECT comment_id, status FROM reports WHERE site_id = ? AND id = ?",
    )
      .bind(env.SITE_ID, reportId)
      .first();
    if (!report || report.status !== "pending") {
      throw new HttpError(409, "report_conflict", "举报不存在或已经处理");
    }
    const now = new Date().toISOString();
    const statements = [
      env.DB.prepare(
        "UPDATE reports SET status = ?, updated_at = ?, resolved_at = ? WHERE site_id = ? AND id = ? AND status = 'pending'",
      ).bind(action === "hide" ? "resolved" : "dismissed", now, now, env.SITE_ID, reportId),
      moderationLogAfterChange(env, action, "report", reportId, reason, now),
    ];
    if (action === "hide") {
      statements.push(
        env.DB.prepare(
          `UPDATE comments SET status = 'hidden', updated_at = ?
           WHERE site_id = ? AND id = ? AND status = 'visible' AND changes() = 1`,
        ).bind(now, env.SITE_ID, report.comment_id),
      );
    }
    const results = await env.DB.batch(statements);
    if (Number(results[0]?.meta?.changes || 0) !== 1) {
      throw new HttpError(409, "report_conflict", "举报已经被其他管理员处理，请刷新后重试");
    }
    return jsonResponse(request, env, { ok: true, id: reportId, status: action });
  }

  const threadMatch = url.pathname.match(/^\/v1\/admin\/questions\/([^/]+)$/);
  if (method === "PATCH" && threadMatch) {
    let decodedSlug;
    try {
      decodedSlug = decodeURIComponent(threadMatch[1]);
    } catch {
      throw new HttpError(400, "invalid_slug", "题目标识不合法");
    }
    const slug = validateSlug(decodedSlug);
    const input = await readJson(request);
    if (typeof input.locked !== "boolean") {
      throw new HttpError(400, "invalid_locked", "locked 必须是布尔值");
    }
    const now = new Date().toISOString();
    const statement = env.DB.prepare(
      `INSERT INTO threads (site_id, question_slug, next_floor, version, locked, created_at, updated_at)
       VALUES (?, ?, 0, 0, ?, ?, ?)
       ON CONFLICT(site_id, question_slug) DO UPDATE SET
         locked = excluded.locked, version = threads.version + 1, updated_at = excluded.updated_at
       WHERE threads.locked != excluded.locked`,
    )
      .bind(env.SITE_ID, slug, input.locked ? 1 : 0, now, now);
    const [result] = await env.DB.batch([
      statement,
      moderationLogAfterChange(env, input.locked ? "lock" : "unlock", "thread", slug, "", now),
    ]);
    if (Number(result.meta?.changes || 0) !== 1) {
      throw new HttpError(409, "thread_state_conflict", input.locked ? "这道题已经锁定" : "这道题已经开放");
    }
    return jsonResponse(request, env, { ok: true, slug, locked: input.locked });
  }

  throw new HttpError(404, "not_found", "管理接口不存在");
}

function moderationLogAfterChange(env, action, targetType, targetId, reason, now) {
  return env.DB.prepare(
    `INSERT INTO moderation_log (id, site_id, action, target_type, target_id, reason, created_at)
     SELECT ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1`,
  ).bind(crypto.randomUUID(), env.SITE_ID, action, targetType, targetId, reason, now);
}

function parseAdminCursor(value) {
  if (value === null || value === "") return 0;
  if (!/^\d+$/.test(value)) throw new HttpError(400, "invalid_cursor", "cursor 不合法");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 100_000) {
    throw new HttpError(400, "invalid_cursor", "cursor 超出范围");
  }
  return parsed;
}

function parseAction(value, allowed) {
  if (!allowed.includes(value)) throw new HttpError(400, "invalid_action", "管理操作不合法");
  return value;
}

function parseOptionalReason(value) {
  if (value === undefined || value === null || value === "") return "";
  return normalizePlainText(value, { field: "reason", maxLength: 500 });
}

function parseUuidPath(value) {
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new HttpError(400, "invalid_id", "ID 不合法");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(decoded)) {
    throw new HttpError(400, "invalid_id", "ID 不合法");
  }
  return decoded.toLowerCase();
}

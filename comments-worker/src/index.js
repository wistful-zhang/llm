import { adminAssetResponse } from "./admin-assets.js";
import { handleAdminApi } from "./admin.js";
import {
  consumeRateLimit,
  countPublicComments,
  createReport,
  deleteOwnComment,
  editOwnComment,
  findIdempotentComment,
  findIdempotentReport,
  getReplyParent,
  getThread,
  insertCommentWithFloor,
  listComments,
  requestIdExists,
} from "./db.js";
import { assertPublishedQuestion } from "./manifest.js";
import {
  assertCors,
  corsHeaders,
  dailyActorKey,
  editTokenHash,
  errorResponse,
  jsonResponse,
  readJson,
  retryAfterUtcMidnight,
  verifyTurnstile,
} from "./security.js";
import {
  HttpError,
  normalizeSiteConfig,
  parseCommentInput,
  parseDeleteInput,
  parseEditInput,
  parsePagination,
  parseReportInput,
  validateRequestId,
  validateSlug,
} from "./validation.js";

const RATE_LIMITS = Object.freeze({
  commentsPerSiteDay: 25,
  commentsPerQuestionDay: 10,
  editsPerDay: 60,
  reportsPerDay: 10,
});

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (!(error instanceof HttpError)) console.error("comments-worker", error?.message || error);
      return errorResponse(request, env, error);
    }
  },

  async scheduled(_controller, env, ctx) {
    const cutoff = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    ctx.waitUntil(
      env.DB.prepare("DELETE FROM rate_limits WHERE window_date < ?").bind(cutoff).run(),
    );
  },
};

async function route(request, env) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const asset = adminAssetResponse(url.pathname);
  if (asset && method === "GET") return asset;

  if (method === "OPTIONS") {
    assertCors(request, env, { mutation: true });
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  const config = normalizeSiteConfig(env);
  if (!config.readable) {
    throw new HttpError(503, "service_unconfigured", "评论服务尚未完成配置");
  }
  assertCors(request, env, { mutation: !["GET", "HEAD"].includes(method) });

  if (url.pathname.startsWith("/v1/admin/")) {
    return handleAdminApi(request, env, url);
  }

  if (method === "GET" && url.pathname === "/v1/config") {
    return jsonResponse(request, env, {
      siteId: config.siteId,
      turnstileSiteKey: config.turnstileSiteKey,
      writeEnabled: config.writeEnabled,
    });
  }

  const questionMatch = url.pathname.match(/^\/v1\/questions\/([^/]+)\/comments$/);
  if (questionMatch) {
    const slug = decodeAndValidateSlug(questionMatch[1]);
    if (method === "GET") return getQuestionComments(request, env, url, slug);
    if (method === "POST") return postQuestionComment(request, env, slug, config);
  }

  const reportMatch = url.pathname.match(/^\/v1\/comments\/([^/]+)\/reports$/);
  if (reportMatch && method === "POST") {
    return postReport(request, env, decodeAndValidateId(reportMatch[1]), config);
  }

  const commentMatch = url.pathname.match(/^\/v1\/comments\/([^/]+)$/);
  if (commentMatch) {
    const id = decodeAndValidateId(commentMatch[1]);
    if (method === "PATCH") return patchComment(request, env, id, config);
    if (method === "DELETE") return deleteComment(request, env, id, config);
  }

  throw new HttpError(404, "not_found", "接口不存在");
}

async function getQuestionComments(request, env, url, slug) {
  const { cursor, limit } = parsePagination(url.searchParams);
  const result = await listComments(env.DB, env.SITE_ID, slug, cursor, limit);
  return jsonResponse(request, env, result);
}

async function postQuestionComment(request, env, slug, config) {
  requireWrites(config);
  const input = parseCommentInput(await readJson(request));
  if (input.website !== "") return honeypotResponse(request, env, input.requestId);

  const editHash = await editTokenHash(env, input.editToken);
  const existing = await findIdempotentComment(
    env.DB,
    env.SITE_ID,
    slug,
    input.requestId,
    editHash,
  );
  if (existing) {
    const total = await countPublicComments(env.DB, env.SITE_ID, slug);
    return jsonResponse(request, env, { comment: existing, total, idempotent: true });
  }
  if (await requestIdExists(env.DB, env.SITE_ID, input.requestId)) {
    throw new HttpError(409, "request_id_conflict", "requestId 已被其他请求使用");
  }
  await assertPublishedQuestion(env, slug);

  const thread = await getThread(env.DB, env.SITE_ID, slug);
  if (thread?.locked) throw new HttpError(423, "thread_locked", "这道题的评论区已锁定");
  await getReplyParent(env.DB, env.SITE_ID, slug, input.parentId);
  await verifyTurnstile({
    env,
    token: input.turnstileToken,
    requestId: input.requestId,
    action: "question-comment",
    request,
  });

  const now = new Date();
  await applyRateLimit(env, request, "comment-site", RATE_LIMITS.commentsPerSiteDay, now);
  await applyRateLimit(
    env,
    request,
    `comment-question:${slug}`,
    RATE_LIMITS.commentsPerQuestionDay,
    now,
  );

  let comment;
  try {
    comment = await insertCommentWithFloor(env.DB, {
      id: crypto.randomUUID(),
      siteId: env.SITE_ID,
      slug,
      nickname: input.nickname,
      body: input.body,
      parentId: input.parentId,
      editHash,
      requestId: input.requestId,
      now: now.toISOString(),
    });
  } catch (error) {
    const retry = await findIdempotentComment(
      env.DB,
      env.SITE_ID,
      slug,
      input.requestId,
      editHash,
    );
    if (!retry) throw error;
    const total = await countPublicComments(env.DB, env.SITE_ID, slug);
    return jsonResponse(request, env, { comment: retry, total, idempotent: true });
  }
  const total = await countPublicComments(env.DB, env.SITE_ID, slug);
  return jsonResponse(request, env, { comment, total, idempotent: false }, 201);
}

async function patchComment(request, env, id, config) {
  requireWrites(config);
  const input = parseEditInput(await readJson(request));
  const now = new Date();
  await applyRateLimit(env, request, "comment-mutation", RATE_LIMITS.editsPerDay, now);
  const comment = await editOwnComment(env.DB, {
    siteId: env.SITE_ID,
    id,
    editHash: await editTokenHash(env, input.editToken),
    body: input.body,
    now: now.toISOString(),
  });
  return jsonResponse(request, env, { comment });
}

async function deleteComment(request, env, id, config) {
  requireWrites(config);
  const input = parseDeleteInput(await readJson(request));
  const now = new Date();
  await applyRateLimit(env, request, "comment-mutation", RATE_LIMITS.editsPerDay, now);
  const comment = await deleteOwnComment(env.DB, {
    siteId: env.SITE_ID,
    id,
    editHash: await editTokenHash(env, input.editToken),
    now: now.toISOString(),
  });
  return jsonResponse(request, env, { comment });
}

async function postReport(request, env, commentId, config) {
  requireWrites(config);
  const input = parseReportInput(await readJson(request));
  if (input.website !== "") return honeypotResponse(request, env, input.requestId);
  const existing = await findIdempotentReport(env.DB, env.SITE_ID, input.requestId);
  if (existing) return jsonResponse(request, env, { report: toPublicReport(existing), idempotent: true });

  await verifyTurnstile({
    env,
    token: input.turnstileToken,
    requestId: input.requestId,
    action: "question-comment",
    request,
  });
  const now = new Date();
  const actor = await applyRateLimit(env, request, "report", RATE_LIMITS.reportsPerDay, now);
  const report = await createReport(env.DB, {
    id: crypto.randomUUID(),
    commentId,
    siteId: env.SITE_ID,
    reason: input.reason,
    reporterKey: actor.key,
    requestId: input.requestId,
    now: now.toISOString(),
  });
  return jsonResponse(request, env, { report: toPublicReport(report), idempotent: false }, 201);
}

async function applyRateLimit(env, request, scope, limit, now) {
  const actor = await dailyActorKey(env, request, scope, now);
  try {
    await consumeRateLimit(env.DB, {
      key: actor.key,
      day: actor.day,
      scope,
      limit,
      now: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 429) {
      error.details = { retryAfter: retryAfterUtcMidnight(now) };
    }
    throw error;
  }
  return actor;
}

function requireWrites(config) {
  if (!config.writeEnabled) {
    throw new HttpError(503, "write_disabled", "评论服务暂未开放发布");
  }
}

function decodeAndValidateSlug(value) {
  try {
    return validateSlug(decodeURIComponent(value));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "invalid_slug", "题目标识不合法");
  }
}

function decodeAndValidateId(value) {
  try {
    return validateRequestId(decodeURIComponent(value));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "invalid_id", "ID 不合法");
  }
}

function honeypotResponse(request, env, requestId) {
  return jsonResponse(request, env, { accepted: true, requestId }, 202);
}

function toPublicReport(row) {
  return { id: row.id, status: row.status, createdAt: row.created_at };
}

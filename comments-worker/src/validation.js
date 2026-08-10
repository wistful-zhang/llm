export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const LIMITS = Object.freeze({
  nickname: 24,
  comment: 2_000,
  reportReason: 500,
  questionTitle: 160,
  questionAnswer: 50_000,
  questionCategory: 30,
  questionSource: 80,
  questionAuthor: 24,
  questionLocalId: 120,
  questionFollowUps: 10,
  questionFollowUp: 300,
  questionTags: 12,
  questionTag: 30,
  jsonBytes: 262_144,
  pageSize: 20,
  maxPageSize: 50,
  questionPageSize: 100,
  maxQuestionPageSize: 100,
});

export const QUESTION_DIFFICULTIES = Object.freeze(["待评估", "简单", "中等", "困难"]);
export const QUESTION_ANSWER_STATUSES = Object.freeze(["pending", "complete"]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{32,172}$/;
const SLUG_RE = /^[\p{L}\p{N}](?:[\p{L}\p{N}._-]{0,199})$/u;
const LOCAL_QUESTION_ID_RE = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,119}$/;
const DISALLOWED_CONTROLS_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const QUESTION_DIFFICULTY_SET = new Set(QUESTION_DIFFICULTIES);
const QUESTION_ANSWER_STATUS_SET = new Set(QUESTION_ANSWER_STATUSES);
const KNOWN_PLACEHOLDERS = new Set([
  "https://example.github.io/llm",
  "replace_with_turnstile_site_key",
  "replace_with_d1_database_id",
  "replace-with-turnstile-secret",
  "replace-with-at-least-32-random-characters",
]);

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

export function validateSlug(value) {
  if (typeof value !== "string" || !SLUG_RE.test(value)) {
    throw new HttpError(400, "invalid_slug", "题目标识不合法");
  }
  return value;
}

export function normalizePlainText(value, { field, minLength = 1, maxLength, allowNewlines = true }) {
  if (typeof value !== "string") {
    throw new HttpError(400, `invalid_${field}`, `${field} 必须是文本`);
  }
  let normalized = value.replace(/\r\n?/g, "\n").normalize("NFC").trim();
  if (!allowNewlines) normalized = normalized.replace(/\s+/gu, " ");
  if (
    normalized.length < minLength
    || normalized.length > maxLength
    || DISALLOWED_CONTROLS_RE.test(normalized)
  ) {
    throw new HttpError(400, `invalid_${field}`, `${field} 长度或内容不合法`);
  }
  return normalized;
}

export function validateRequestId(value) {
  if (!isUuid(value)) {
    throw new HttpError(400, "invalid_request_id", "requestId 必须是 UUID");
  }
  return value.toLowerCase();
}

export function validateEditToken(value) {
  if (typeof value !== "string" || !TOKEN_RE.test(value)) {
    throw new HttpError(400, "invalid_edit_token", "editToken 格式不合法");
  }
  return value;
}

export function parseCommentInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "invalid_body", "请求正文必须是 JSON 对象");
  }
  return {
    nickname: normalizePlainText(input.nickname, {
      field: "nickname",
      minLength: 2,
      maxLength: LIMITS.nickname,
      allowNewlines: false,
    }),
    body: normalizePlainText(input.body, {
      field: "body",
      minLength: 2,
      maxLength: LIMITS.comment,
    }),
    parentId:
      input.parentId === null || input.parentId === undefined || input.parentId === ""
        ? null
        : validateRequestId(input.parentId),
    turnstileToken: normalizeOpaqueToken(input.turnstileToken, "turnstile_token", 2_048),
    requestId: validateRequestId(input.requestId),
    editToken: validateEditToken(input.editToken),
    website: typeof input.website === "string" ? input.website : "invalid",
  };
}

export function parseReportInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "invalid_body", "请求正文必须是 JSON 对象");
  }
  return {
    reason: normalizePlainText(input.reason, {
      field: "reason",
      minLength: 2,
      maxLength: LIMITS.reportReason,
    }),
    turnstileToken: normalizeOpaqueToken(input.turnstileToken, "turnstile_token", 2_048),
    requestId: validateRequestId(input.requestId),
    website: typeof input.website === "string" ? input.website : "invalid",
  };
}

export function parseEditInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "invalid_body", "请求正文必须是 JSON 对象");
  }
  return {
    body: normalizePlainText(input.body, {
      field: "body",
      minLength: 2,
      maxLength: LIMITS.comment,
    }),
    editToken: validateEditToken(input.editToken),
  };
}

export function parseDeleteInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "invalid_body", "请求正文必须是 JSON 对象");
  }
  return { editToken: validateEditToken(input.editToken) };
}

export function normalizeQuestionFields(input) {
  assertJsonObject(input);
  const answer = normalizePlainText(input.answer ?? "", {
    field: "answer",
    minLength: 0,
    maxLength: LIMITS.questionAnswer,
  });
  const answerStatus = normalizeQuestionAnswerStatus(input.answerStatus ?? "pending");
  if (answerStatus === "complete" && !answer) {
    throw new HttpError(400, "answer_required", "答案为空时不能标记为已完成");
  }
  return {
    title: normalizePlainText(input.title, {
      field: "title",
      minLength: 2,
      maxLength: LIMITS.questionTitle,
      allowNewlines: false,
    }),
    category: normalizePlainText(input.category ?? "待整理", {
      field: "category",
      minLength: 1,
      maxLength: LIMITS.questionCategory,
      allowNewlines: false,
    }),
    difficulty: normalizeQuestionDifficulty(input.difficulty ?? "待评估"),
    answerStatus,
    answer,
    followUps: normalizeQuestionList(input.followUps ?? [], {
      field: "follow_ups",
      maxItems: LIMITS.questionFollowUps,
      maxLength: LIMITS.questionFollowUp,
      splitPattern: /\r?\n/u,
    }),
    tags: normalizeQuestionList(input.tags ?? [], {
      field: "tags",
      maxItems: LIMITS.questionTags,
      maxLength: LIMITS.questionTag,
      splitPattern: /[,，、\r\n]+/u,
    }),
    source: normalizePlainText(input.source ?? "", {
      field: "source",
      minLength: 0,
      maxLength: LIMITS.questionSource,
      allowNewlines: false,
    }),
    author: normalizeQuestionAuthor(input.author),
    localId: normalizeQuestionLocalId(input.localId),
  };
}

export function parseQuestionInput(input) {
  assertJsonObject(input);
  return {
    ...normalizeQuestionFields(input),
    turnstileToken: normalizeOpaqueToken(input.turnstileToken, "turnstile_token", 2_048),
    requestId: validateRequestId(input.requestId),
    editToken: validateEditToken(input.editToken),
    website: typeof input.website === "string" ? input.website : "invalid",
  };
}

export function parseQuestionUpdateInput(input) {
  assertJsonObject(input);
  const patch = {};
  if (Object.hasOwn(input, "title")) {
    patch.title = normalizePlainText(input.title, {
      field: "title",
      minLength: 2,
      maxLength: LIMITS.questionTitle,
      allowNewlines: false,
    });
  }
  if (Object.hasOwn(input, "category")) {
    patch.category = normalizePlainText(input.category, {
      field: "category",
      minLength: 1,
      maxLength: LIMITS.questionCategory,
      allowNewlines: false,
    });
  }
  if (Object.hasOwn(input, "difficulty")) {
    patch.difficulty = normalizeQuestionDifficulty(input.difficulty);
  }
  if (Object.hasOwn(input, "answerStatus")) {
    patch.answerStatus = normalizeQuestionAnswerStatus(input.answerStatus);
  }
  if (Object.hasOwn(input, "answer")) {
    patch.answer = normalizePlainText(input.answer, {
      field: "answer",
      minLength: 0,
      maxLength: LIMITS.questionAnswer,
    });
  }
  if (Object.hasOwn(input, "followUps")) {
    patch.followUps = normalizeQuestionList(input.followUps, {
      field: "follow_ups",
      maxItems: LIMITS.questionFollowUps,
      maxLength: LIMITS.questionFollowUp,
      splitPattern: /\r?\n/u,
    });
  }
  if (Object.hasOwn(input, "tags")) {
    patch.tags = normalizeQuestionList(input.tags, {
      field: "tags",
      maxItems: LIMITS.questionTags,
      maxLength: LIMITS.questionTag,
      splitPattern: /[,，、\r\n]+/u,
    });
  }
  if (Object.hasOwn(input, "source")) {
    patch.source = normalizePlainText(input.source, {
      field: "source",
      minLength: 0,
      maxLength: LIMITS.questionSource,
      allowNewlines: false,
    });
  }
  if (Object.hasOwn(input, "author")) patch.author = normalizeQuestionAuthor(input.author);
  if (Object.hasOwn(input, "localId")) patch.localId = normalizeQuestionLocalId(input.localId);
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "empty_question_update", "至少修改一个题目字段");
  }
  return { editToken: validateEditToken(input.editToken), patch };
}

export function validateQuestionId(value) {
  if (!isUuid(value)) throw new HttpError(400, "invalid_question_id", "题目 ID 必须是 UUID");
  return value.toLowerCase();
}

export function parseQuestionPagination(searchParams) {
  const cursorRaw = searchParams.get("cursor") || "0";
  const limitRaw = searchParams.get("limit") || String(LIMITS.questionPageSize);
  if (!/^\d+$/.test(cursorRaw) || !/^\d+$/.test(limitRaw)) {
    throw new HttpError(400, "invalid_pagination", "cursor 和 limit 必须是非负整数");
  }
  const cursor = Number(cursorRaw);
  const requestedLimit = Number(limitRaw);
  if (!Number.isSafeInteger(cursor) || !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
    throw new HttpError(400, "invalid_pagination", "分页参数超出范围");
  }
  return { cursor, limit: Math.min(requestedLimit, LIMITS.maxQuestionPageSize) };
}

export function parsePagination(searchParams) {
  const cursorRaw = searchParams.get("cursor") || "0";
  const limitRaw = searchParams.get("limit") || String(LIMITS.pageSize);
  if (!/^\d+$/.test(cursorRaw) || !/^\d+$/.test(limitRaw)) {
    throw new HttpError(400, "invalid_pagination", "cursor 和 limit 必须是非负整数");
  }
  const cursor = Number(cursorRaw);
  const requestedLimit = Number(limitRaw);
  if (!Number.isSafeInteger(cursor) || !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
    throw new HttpError(400, "invalid_pagination", "分页参数超出范围");
  }
  return { cursor, limit: Math.min(requestedLimit, LIMITS.maxPageSize) };
}

function assertJsonObject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "invalid_body", "请求正文必须是 JSON 对象");
  }
}

function normalizeQuestionDifficulty(value) {
  const difficulty = normalizePlainText(value, {
    field: "difficulty",
    minLength: 1,
    maxLength: 8,
    allowNewlines: false,
  });
  if (!QUESTION_DIFFICULTY_SET.has(difficulty)) {
    throw new HttpError(400, "invalid_difficulty", "difficulty 不在允许范围内");
  }
  return difficulty;
}

function normalizeQuestionAnswerStatus(value) {
  const status = normalizePlainText(value, {
    field: "answer_status",
    minLength: 1,
    maxLength: 16,
    allowNewlines: false,
  });
  if (!QUESTION_ANSWER_STATUS_SET.has(status)) {
    throw new HttpError(400, "invalid_answer_status", "answerStatus 必须是 pending 或 complete");
  }
  return status;
}

function normalizeQuestionAuthor(value) {
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
    return "匿名用户";
  }
  return normalizePlainText(value, {
    field: "author",
    minLength: 2,
    maxLength: LIMITS.questionAuthor,
    allowNewlines: false,
  });
}

function normalizeQuestionLocalId(value) {
  if (value === undefined || value === null || value === "") return "";
  const localId = normalizePlainText(value, {
    field: "local_id",
    minLength: 1,
    maxLength: LIMITS.questionLocalId,
    allowNewlines: false,
  });
  if (!LOCAL_QUESTION_ID_RE.test(localId)) {
    throw new HttpError(400, "invalid_local_id", "localId 格式不合法");
  }
  return localId;
}

function normalizeQuestionList(value, { field, maxItems, maxLength, splitPattern }) {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(splitPattern)
      : null;
  if (!candidates) throw new HttpError(400, `invalid_${field}`, `${field} 必须是文字列表`);
  const result = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      throw new HttpError(400, `invalid_${field}`, `${field} 中的每一项都必须是文字`);
    }
    const item = normalizePlainText(candidate, {
      field,
      minLength: 0,
      maxLength,
      allowNewlines: false,
    });
    if (!item) continue;
    const identity = item.normalize("NFKC").toLocaleLowerCase("zh-CN");
    if (seen.has(identity)) continue;
    seen.add(identity);
    result.push(item);
    if (result.length > maxItems) {
      throw new HttpError(400, `too_many_${field}`, `${field} 数量超出上限`);
    }
  }
  return result;
}

export function parseJsonByteLength(text) {
  return new TextEncoder().encode(text).byteLength;
}

export function isPlaceholderValue(value) {
  if (typeof value !== "string") return false;
  return KNOWN_PLACEHOLDERS.has(value.trim().toLowerCase());
}

export function isConfiguredSecret(value, minLength = 1) {
  return typeof value === "string"
    && value.trim().length >= minLength
    && !isPlaceholderValue(value);
}

export function normalizeSiteConfig(env) {
  let siteUrl = null;
  try {
    siteUrl = new URL(env.SITE_URL);
  } catch {
    // Returned as an incomplete configuration below.
  }
  const siteId = typeof env.SITE_ID === "string" ? env.SITE_ID.trim() : "";
  const siteKey = typeof env.TURNSTILE_SITE_KEY === "string" ? env.TURNSTILE_SITE_KEY.trim() : "";
  const hashSecret = typeof env.HASH_SECRET === "string" ? env.HASH_SECRET : "";
  const turnstileSecret = typeof env.TURNSTILE_SECRET_KEY === "string" ? env.TURNSTILE_SECRET_KEY : "";
  const adminToken = typeof env.ADMIN_TOKEN === "string" ? env.ADMIN_TOKEN : "";
  const localHttp = siteUrl
    && siteUrl.protocol === "http:"
    && (siteUrl.hostname === "localhost" || siteUrl.hostname === "127.0.0.1");
  const safeSiteUrl = Boolean(
    siteUrl
      && (siteUrl.protocol === "https:" || localHttp)
      && !siteUrl.username
      && !siteUrl.password
      && !siteUrl.search
      && !siteUrl.hash
      && siteUrl.hostname.toLowerCase() !== "example.github.io"
      && !isPlaceholderValue(env.SITE_URL),
  );
  const readable = Boolean(
    safeSiteUrl && /^[A-Za-z0-9_-]{8,80}$/.test(siteId) && env.DB,
  );
  const writeEnabled = Boolean(
    readable
      && /^[A-Za-z0-9_-]{10,100}$/.test(siteKey)
      && !isPlaceholderValue(siteKey)
      && isConfiguredSecret(hashSecret, 32)
      && isConfiguredSecret(turnstileSecret)
      && isConfiguredSecret(adminToken, 32),
  );
  return {
    siteId,
    siteUrl,
    siteOrigin: siteUrl?.origin || "",
    turnstileSiteKey: siteKey,
    readable,
    writeEnabled,
  };
}

export function isAllowedOrigin(origin, siteOrigin, workerOrigin) {
  return Boolean(origin && (origin === siteOrigin || origin === workerOrigin));
}

function normalizeOpaqueToken(value, field, maxLength) {
  if (typeof value !== "string" || value.length < 1 || value.length > maxLength) {
    throw new HttpError(400, `invalid_${field}`, `${field} 格式不合法`);
  }
  return value;
}

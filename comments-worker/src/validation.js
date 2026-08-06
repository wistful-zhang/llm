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
  jsonBytes: 16_384,
  pageSize: 20,
  maxPageSize: 50,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{32,172}$/;
const SLUG_RE = /^[\p{L}\p{N}](?:[\p{L}\p{N}._-]{0,199})$/u;
const DISALLOWED_CONTROLS_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

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

export function parseJsonByteLength(text) {
  return new TextEncoder().encode(text).byteLength;
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
      && !siteUrl.hash,
  );
  const readable = Boolean(
    safeSiteUrl && /^[A-Za-z0-9_-]{8,80}$/.test(siteId) && env.DB,
  );
  const writeEnabled = Boolean(
    readable
      && /^[A-Za-z0-9_-]{10,100}$/.test(siteKey)
      && hashSecret.length >= 32
      && turnstileSecret
      && adminToken.length >= 32,
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

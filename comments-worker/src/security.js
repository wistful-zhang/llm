import { HttpError, LIMITS, isAllowedOrigin, normalizeSiteConfig, parseJsonByteLength } from "./validation.js";

const encoder = new TextEncoder();

export async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function editTokenHash(env, token) {
  return hmacHex(env.HASH_SECRET, `edit\n${env.SITE_ID}\n${token}`);
}

export async function dailyActorKey(env, request, scope, now = new Date()) {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) {
    throw new HttpError(503, "actor_unavailable", "暂时无法确认请求来源，请稍后重试");
  }
  const day = now.toISOString().slice(0, 10);
  return {
    day,
    key: await hmacHex(env.HASH_SECRET, `rate\n${env.SITE_ID}\n${day}\n${scope}\n${ip}`),
  };
}

export async function verifyTurnstile({ env, token, requestId, action, request }) {
  const config = normalizeSiteConfig(env);
  if (!config.writeEnabled) {
    throw new HttpError(503, "write_disabled", "评论服务尚未完成写入配置");
  }

  const form = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    idempotency_key: requestId,
  });
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.set("remoteip", ip);

  let response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
  } catch {
    throw new HttpError(503, "turnstile_unavailable", "人机验证服务暂时不可用");
  }
  if (!response.ok) {
    throw new HttpError(503, "turnstile_unavailable", "人机验证服务暂时不可用");
  }
  const result = await response.json();
  const expectedHostname = config.siteUrl.hostname.toLowerCase();
  if (
    result.success !== true ||
    result.action !== action ||
    typeof result.hostname !== "string" ||
    result.hostname.toLowerCase() !== expectedHostname
  ) {
    throw new HttpError(403, "turnstile_failed", "人机验证失败，请刷新后重试");
  }
  return result;
}

export async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "unsupported_media_type", "请使用 application/json");
  }
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > LIMITS.jsonBytes) {
    throw new HttpError(413, "body_too_large", "请求正文过大");
  }
  const text = await request.text();
  if (parseJsonByteLength(text) > LIMITS.jsonBytes) {
    throw new HttpError(413, "body_too_large", "请求正文过大");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "JSON 格式不合法");
  }
}

export function assertCors(request, env, { mutation = false } = {}) {
  const config = normalizeSiteConfig(env);
  const origin = request.headers.get("origin");
  const workerOrigin = new URL(request.url).origin;
  if (origin && !isAllowedOrigin(origin, config.siteOrigin, workerOrigin)) {
    throw new HttpError(403, "origin_denied", "请求来源不被允许");
  }
  if (mutation && !origin) {
    throw new HttpError(403, "origin_required", "写入请求必须包含 Origin");
  }
  return { origin, workerOrigin, config };
}

export function corsHeaders(request, env) {
  const config = normalizeSiteConfig(env);
  const origin = request.headers.get("origin");
  const workerOrigin = new URL(request.url).origin;
  const headers = new Headers({
    vary: "Origin",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  });
  if (isAllowedOrigin(origin, config.siteOrigin, workerOrigin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, POST, PATCH, DELETE, OPTIONS");
    headers.set("access-control-allow-headers", "Content-Type, Authorization");
    headers.set("access-control-max-age", "600");
  }
  return headers;
}

export function jsonResponse(request, env, data, status = 200, extraHeaders = {}) {
  const headers = corsHeaders(request, env);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(request, env, error) {
  const known = error instanceof HttpError;
  const status = known ? error.status : 500;
  const payload = {
    error: {
      code: known ? error.code : "internal_error",
      message: known ? error.message : "服务暂时不可用",
    },
  };
  if (known && error.details !== undefined) payload.error.details = error.details;
  return jsonResponse(request, env, payload, status);
}

export async function assertAdmin(request, env) {
  const configured = typeof env.ADMIN_TOKEN === "string" ? env.ADMIN_TOKEN : "";
  const header = request.headers.get("authorization") || "";
  const candidate = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (configured.length < 32 || !(await constantTimeEqual(candidate, configured))) {
    throw new HttpError(401, "admin_unauthorized", "管理员身份验证失败");
  }
}

export async function constantTimeEqual(left, right) {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const aBytes = new Uint8Array(a);
  const bBytes = new Uint8Array(b);
  let difference = 0;
  for (let index = 0; index < aBytes.length; index += 1) {
    difference |= aBytes[index] ^ bBytes[index];
  }
  return difference === 0;
}

export function retryAfterUtcMidnight(now = new Date()) {
  const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((tomorrow - now.getTime()) / 1_000));
}

import { HttpError, validateSlug } from "./validation.js";

const MANIFEST_TTL_MS = 5 * 60 * 1_000;
const MAX_MANIFEST_BYTES = 1_000_000;
const MAX_QUESTIONS = 20_000;
const cache = new Map();

export function manifestUrlForSite(siteUrl) {
  const base = new URL(siteUrl);
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  base.search = "";
  base.hash = "";
  return new URL("comments-manifest.json", base);
}

export function normalizePublishedManifest(value) {
  if (!value || typeof value !== "object" || value.version !== 1 || !Array.isArray(value.questions)) {
    throw new HttpError(503, "manifest_invalid", "题目发布清单格式不正确");
  }
  if (value.questions.length > MAX_QUESTIONS) {
    throw new HttpError(503, "manifest_invalid", "题目发布清单超出安全上限");
  }
  const questions = new Set();
  for (const rawSlug of value.questions) {
    let slug;
    try {
      slug = validateSlug(rawSlug);
    } catch {
      throw new HttpError(503, "manifest_invalid", "题目发布清单包含非法标识");
    }
    if (questions.has(slug)) {
      throw new HttpError(503, "manifest_invalid", "题目发布清单包含重复标识");
    }
    questions.add(slug);
  }
  return questions;
}

export async function assertPublishedQuestion(env, slug, options = {}) {
  const now = options.now ?? Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;
  const manifestUrl = manifestUrlForSite(env.SITE_URL);
  const cacheKey = `${env.SITE_ID}\n${manifestUrl.href}`;
  let entry = cache.get(cacheKey);
  if (!entry || entry.expiresAt <= now) {
    const pending = loadManifest(manifestUrl, fetchImpl);
    entry = { expiresAt: now + MANIFEST_TTL_MS, pending };
    cache.set(cacheKey, entry);
    try {
      await pending;
    } catch (error) {
      if (cache.get(cacheKey)?.pending === pending) cache.delete(cacheKey);
      throw error;
    }
  }
  const questions = await entry.pending;
  if (!questions.has(slug)) {
    throw new HttpError(404, "question_not_published", "题目不存在或尚未公开，不能创建评论楼层");
  }
}

export function clearManifestCacheForTests() {
  cache.clear();
}

async function loadManifest(manifestUrl, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(manifestUrl, {
      method: "GET",
      headers: { accept: "application/json" },
      redirect: "error",
    });
  } catch {
    throw new HttpError(503, "manifest_unavailable", "暂时无法核对题目发布状态");
  }
  if (!response.ok || new URL(response.url).origin !== manifestUrl.origin) {
    throw new HttpError(503, "manifest_unavailable", "暂时无法核对题目发布状态");
  }
  const declaredLength = Number(response.headers.get("content-length") || "0");
  if (declaredLength > MAX_MANIFEST_BYTES) {
    throw new HttpError(503, "manifest_invalid", "题目发布清单超出安全上限");
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_MANIFEST_BYTES) {
    throw new HttpError(503, "manifest_invalid", "题目发布清单超出安全上限");
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError(503, "manifest_invalid", "题目发布清单格式不正确");
  }
  return normalizePublishedManifest(parsed);
}

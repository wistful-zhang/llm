import assert from "node:assert/strict";
import test from "node:test";

import {
  HttpError,
  isAllowedOrigin,
  isConfiguredSecret,
  isPlaceholderValue,
  isUuid,
  normalizePlainText,
  normalizeSiteConfig,
  parseCommentInput,
  parsePagination,
  parseReportInput,
  validateSlug,
} from "../comments-worker/src/validation.js";
import { assertAdmin } from "../comments-worker/src/security.js";
import {
  assertPublishedQuestion,
  clearManifestCacheForTests,
  manifestUrlForSite,
  normalizePublishedManifest,
} from "../comments-worker/src/manifest.js";

test("评论输入按公开契约规范化，并保持正文为纯文本数据", () => {
  const input = parseCommentInput({
    nickname: "  路人  甲  ",
    body: "  第一行\r\n<script>alert(1)</script>  ",
    parentId: null,
    turnstileToken: "turnstile-token",
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    editToken: "abcdefghijklmnopqrstuvwxyzABCDEF0123456789_-",
    website: "",
  });
  assert.equal(input.nickname, "路人 甲");
  assert.equal(input.body, "第一行\n<script>alert(1)</script>");
  assert.equal(input.parentId, null);
  assert.equal(input.website, "");
});

test("评论输入拒绝弱编辑凭证、非法 UUID 和控制字符", () => {
  const base = {
    nickname: "路人甲",
    body: "正常正文",
    parentId: null,
    turnstileToken: "turnstile-token",
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    editToken: "abcdefghijklmnopqrstuvwxyzABCDEF0123456789_-",
    website: "",
  };
  assert.throws(() => parseCommentInput({ ...base, editToken: "short" }), HttpError);
  assert.throws(() => parseCommentInput({ ...base, requestId: "not-a-uuid" }), HttpError);
  assert.throws(() => parseCommentInput({ ...base, body: "bad\u0000text" }), HttpError);
  assert.throws(() => parseCommentInput({ ...base, nickname: "甲" }), HttpError);
  assert.throws(() => parseCommentInput({ ...base, body: "好" }), HttpError);
  assert.equal(isUuid(base.requestId), true);
});

test("举报、slug 与分页边界经过白名单校验", () => {
  const report = parseReportInput({
    reason: "  垃圾广告  ",
    turnstileToken: "token",
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    website: "",
  });
  assert.equal(report.reason, "垃圾广告");
  assert.equal(validateSlug("transformer-kv-cache"), "transformer-kv-cache");
  assert.throws(() => validateSlug("../admin"), HttpError);
  assert.deepEqual(parsePagination(new URLSearchParams("cursor=17&limit=500")), {
    cursor: 17,
    limit: 50,
  });
  assert.throws(() => parsePagination(new URLSearchParams("cursor=-1")), HttpError);
});

test("昵称压缩空白，正文保留换行，并执行长度限制", () => {
  assert.equal(
    normalizePlainText(" A\t B\nC ", { field: "nickname", maxLength: 24, allowNewlines: false }),
    "A B C",
  );
  assert.equal(normalizePlainText(" A\nB ", { field: "body", maxLength: 10 }), "A\nB");
  assert.throws(
    () => normalizePlainText("x".repeat(11), { field: "body", maxLength: 10 }),
    HttpError,
  );
});

test("单站配置只在数据库和所有写入密钥齐全时开放发布", () => {
  const base = {
    SITE_URL: "https://notes.example.com/llm/",
    SITE_ID: "demo-site",
    TURNSTILE_SITE_KEY: "site-key-123",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    HASH_SECRET: "h".repeat(32),
    ADMIN_TOKEN: "a".repeat(32),
    DB: {},
  };
  const ready = normalizeSiteConfig(base);
  assert.equal(ready.readable, true);
  assert.equal(ready.writeEnabled, true);
  assert.equal(ready.siteOrigin, "https://notes.example.com");
  assert.equal(normalizeSiteConfig({ ...base, HASH_SECRET: "short" }).writeEnabled, false);
  assert.equal(normalizeSiteConfig({ ...base, ADMIN_TOKEN: "short" }).writeEnabled, false);
  assert.equal(normalizeSiteConfig({ ...base, DB: undefined }).readable, false);
});

test("SITE_URL 正式环境强制 HTTPS，允许项目子路径和本机 HTTP 调试", () => {
  const env = {
    SITE_ID: "secure-site",
    TURNSTILE_SITE_KEY: "site-key-123",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    HASH_SECRET: "h".repeat(32),
    ADMIN_TOKEN: "a".repeat(32),
    DB: {},
  };
  assert.equal(normalizeSiteConfig({ ...env, SITE_URL: "https://example.com/project" }).readable, true);
  assert.equal(normalizeSiteConfig({ ...env, SITE_URL: "http://localhost:4000/project" }).readable, true);
  assert.equal(normalizeSiteConfig({ ...env, SITE_URL: "http://127.0.0.1:4000/project" }).readable, true);
  for (const SITE_URL of [
    "http://example.com/project",
    "https://user:password@example.com/project",
    "https://example.com/project?preview=1",
    "https://example.com/project#comments",
  ]) {
    assert.equal(normalizeSiteConfig({ ...env, SITE_URL }).readable, false, SITE_URL);
  }
});

test("Deploy Button placeholders fail closed", async () => {
  const placeholderSecret = "replace-with-at-least-32-random-characters";
  for (const value of [
    "https://example.github.io/llm",
    "REPLACE_WITH_TURNSTILE_SITE_KEY",
    "replace-with-turnstile-secret",
    placeholderSecret,
  ]) {
    assert.equal(isPlaceholderValue(value), true, value);
  }
  assert.equal(isConfiguredSecret(placeholderSecret, 32), false);

  const defaults = {
    SITE_URL: "https://example.github.io/llm",
    SITE_ID: "llm-interview-notes",
    TURNSTILE_SITE_KEY: "REPLACE_WITH_TURNSTILE_SITE_KEY",
    TURNSTILE_SECRET_KEY: "replace-with-turnstile-secret",
    HASH_SECRET: placeholderSecret,
    ADMIN_TOKEN: placeholderSecret,
    DB: {},
  };
  const defaultConfig = normalizeSiteConfig(defaults);
  assert.equal(defaultConfig.readable, false);
  assert.equal(defaultConfig.writeEnabled, false);

  const realSite = { ...defaults, SITE_URL: "https://notes.example.com/llm" };
  assert.equal(normalizeSiteConfig(realSite).readable, true);
  assert.equal(normalizeSiteConfig(realSite).writeEnabled, false);

  await assert.rejects(
    assertAdmin(
      new Request("https://comments.example.com/v1/admin/overview", {
        headers: { authorization: `Bearer ${placeholderSecret}` },
      }),
      { ADMIN_TOKEN: placeholderSecret },
    ),
    (error) => error instanceof HttpError && error.code === "admin_unauthorized",
  );
});

test("CORS 只接受配置站点 origin 或 Worker 自身 origin", () => {
  assert.equal(
    isAllowedOrigin("https://example.github.io", "https://example.github.io", "https://api.workers.dev"),
    true,
  );
  assert.equal(
    isAllowedOrigin("https://api.workers.dev", "https://example.github.io", "https://api.workers.dev"),
    true,
  );
  assert.equal(
    isAllowedOrigin("https://evil.example", "https://example.github.io", "https://api.workers.dev"),
    false,
  );
  assert.equal(isAllowedOrigin(null, "https://example.github.io", "https://api.workers.dev"), false);
});

test("发布清单 URL 保留 GitHub Pages 子目录并固定文件名", () => {
  assert.equal(
    manifestUrlForSite("https://example.github.io/project").href,
    "https://example.github.io/project/comments-manifest.json",
  );
  assert.equal(
    manifestUrlForSite("https://example.com/").href,
    "https://example.com/comments-manifest.json",
  );
});

test("发布清单只接受 version 1、合法且不重复的题目 slug", () => {
  const manifest = normalizePublishedManifest({
    version: 1,
    questions: ["transformer-cache", "RAG_评测.v2"],
  });
  assert.equal(manifest.has("RAG_评测.v2"), true);
  assert.throws(
    () => normalizePublishedManifest({ version: 1, questions: ["same", "same"] }),
    HttpError,
  );
  assert.throws(
    () => normalizePublishedManifest({ version: 2, questions: ["question"] }),
    HttpError,
  );
});

test("新评论按 SITE_URL 清单核对 published slug，并短时复用清单", async () => {
  clearManifestCacheForTests();
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    return {
      ok: true,
      url: url.href,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ version: 1, questions: ["published-question"] }),
    };
  };
  const env = { SITE_ID: "manifest-test", SITE_URL: "https://example.com/notes" };
  await assertPublishedQuestion(env, "published-question", { fetchImpl, now: 1_000 });
  await assertPublishedQuestion(env, "published-question", { fetchImpl, now: 1_001 });
  assert.equal(calls, 1);
  await assert.rejects(
    assertPublishedQuestion(env, "unpublished-question", { fetchImpl, now: 1_002 }),
    (error) => error instanceof HttpError && error.code === "question_not_published",
  );
  assert.equal(calls, 1);
});

test("发布清单可以跟随站内跳转，但最终地址不能离开题库 origin", async () => {
  clearManifestCacheForTests();
  let redirectMode = "";
  await assertPublishedQuestion(
    { SITE_ID: "redirect-test", SITE_URL: "https://example.com/notes" },
    "published-question",
    {
      now: 2_000,
      fetchImpl: async (url, options) => {
        redirectMode = options.redirect;
        return {
          ok: true,
          url: url.href,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () => JSON.stringify({ version: 1, questions: ["published-question"] }),
        };
      },
    },
  );
  assert.equal(redirectMode, "follow");

  clearManifestCacheForTests();
  await assert.rejects(
    assertPublishedQuestion(
      { SITE_ID: "redirect-escape-test", SITE_URL: "https://example.com/notes" },
      "published-question",
      {
        now: 2_001,
        fetchImpl: async () => ({
          ok: true,
          url: "https://attacker.example/comments-manifest.json",
          headers: new Headers({ "content-type": "application/json" }),
          text: async () => JSON.stringify({ version: 1, questions: ["published-question"] }),
        }),
      },
    ),
    (error) => error instanceof HttpError && error.code === "manifest_unavailable",
  );
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("D1 migration 建立评论、举报、审核日志和严格限流约束", async () => {
  const sql = await read("comments-worker/migrations/0001_initial.sql");
  for (const table of ["threads", "comments", "reports", "moderation_log", "rate_limits"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(sql, /UNIQUE \(site_id, question_slug, floor\)/);
  assert.match(sql, /UNIQUE \(site_id, request_id\)/);
  assert.match(sql, /edit_token_hash TEXT NOT NULL/);
  assert.match(sql, /reporter_key TEXT NOT NULL/);
  assert.doesNotMatch(sql, /^\s*(ip|user_agent|ua)\s+TEXT/gim);
});

test("服务端核对 Turnstile action 与 hostname，不信任前端验证结果", async () => {
  const security = await read("comments-worker/src/security.js");
  assert.match(security, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
  assert.match(security, /result\.action !== action/);
  assert.match(security, /result\.hostname\.toLowerCase\(\) !== expectedHostname/);
  assert.match(security, /TURNSTILE_SECRET_KEY/);
  assert.match(security, /CF-Connecting-IP/);
  assert.doesNotMatch(security, /User-Agent/i);
});

test("限流与楼层分配使用 D1 条件写入和 prepare.bind", async () => {
  const db = await read("comments-worker/src/db.js");
  assert.match(db, /WHERE rate_limits\.count < \?/);
  assert.match(db, /RETURNING count/);
  assert.match(db, /version = version \+ 1/);
  assert.match(db, /AND version = \? AND locked = 0/);
  assert.match(db, /db\.batch\(\[claimStatement, insertStatement\]\)/);
  assert.match(db, /INSERT INTO comments[\s\S]*WHERE changes\(\) = 1/);
  assert.match(db, /maxAttempts = 6/);
  assert.match(db, /\.prepare\(/);
  assert.match(db, /\.bind\(/);
  assert.doesNotMatch(db, /nested_reply_not_allowed/);
});

test("公开 API 契约完整，并且跨域响应不使用通配符", async () => {
  const [worker, security] = await Promise.all([
    read("comments-worker/src/index.js"),
    read("comments-worker/src/security.js"),
  ]);
  assert.ok(worker.includes("/v1/config"));
  assert.match(worker, /v1\\\/questions/);
  assert.match(worker, /comments/);
  assert.match(worker, /reports/);
  assert.equal(worker.match(/action: "question-comment"/g)?.length, 2);
  assert.match(security, /access-control-allow-origin/);
  assert.doesNotMatch(security, /access-control-allow-origin["']?\s*[:,]\s*["']\*/i);
  assert.match(security, /mutation && !origin/);
  assert.match(
    worker,
    /await assertPublishedQuestion\(env, slug\);[\s\S]*comment = await insertCommentWithFloor/,
  );
  const postStart = worker.indexOf("async function postQuestionComment");
  const postEnd = worker.indexOf("async function patchComment", postStart);
  const postSection = worker.slice(postStart, postEnd);
  assert.ok(
    postSection.indexOf("findIdempotentComment") < postSection.indexOf("assertPublishedQuestion"),
    "合法幂等重试应先于远程发布清单核验",
  );
});

test("管理页只用 sessionStorage 保存令牌，采用外部脚本和严格 CSP", async () => {
  const assets = await read("comments-worker/src/admin-assets.js");
  assert.match(assets, /sessionStorage\.setItem/);
  assert.match(assets, /sessionStorage\.removeItem/);
  assert.doesNotMatch(assets, /localStorage/);
  assert.match(assets, /<script type="module" src="\/admin\/app\.js"><\/script>/);
  assert.match(assets, /default-src 'none'/);
  assert.match(assets, /frame-ancestors 'none'/);
  assert.doesNotMatch(assets, /\.innerHTML\s*=/);
  assert.match(assets, /id="export"/);
  assert.match(assets, /fetch\("\/v1\/admin\/export"/);
  assert.match(assets, /action==="delete"&&!confirm/);
  assert.match(assets, /if\(prompted===null\)return/);
  assert.match(assets, /锁定此题新评论/);
  assert.match(assets, /重新开放此题/);
  assert.match(assets, /\/v1\/admin\/questions\//);
});

test("公开回复不会泄露已隐藏父楼昵称", async () => {
  const db = await read("comments-worker/src/db.js");
  assert.match(db, /p\.status AS parent_status/);
  assert.match(db, /row\.parent_status === "visible"[\s\S]*row\.parent_nickname/);
  assert.match(db, /row\.parent_status === "hidden"[\s\S]*"已隐藏"/);
});

test("管理员导出需要鉴权、强制下载且排除凭证和 HMAC 数据", async () => {
  const admin = await read("comments-worker/src/admin.js");
  assert.ok(admin.indexOf("await assertAdmin(request, env)") < admin.indexOf('url.pathname === "/v1/admin/export"'));
  const start = admin.indexOf('url.pathname === "/v1/admin/export"');
  const end = admin.indexOf('url.pathname === "/v1/admin/comments"', start);
  const exportSection = admin.slice(start, end);
  assert.match(exportSection, /threads:/);
  assert.match(exportSection, /comments:/);
  assert.match(exportSection, /reports:/);
  assert.match(exportSection, /moderationLog:/);
  assert.match(exportSection, /content-disposition/);
  assert.doesNotMatch(exportSection, /edit_token_hash|reporter_key|request_id|rate_limits/i);
});

test("评论、举报和锁题审核均原子写入日志，零行更新不会产生假日志", async () => {
  const admin = await read("comments-worker/src/admin.js");
  assert.match(admin, /moderationLogAfterChange\(env, action, "comment", commentId/);
  assert.match(admin, /env\.DB\.batch\(\[statement, log\]\)/);
  assert.match(admin, /SELECT \?, \?, \?, \?, \?, \?, \? WHERE changes\(\) = 1/);
  assert.match(admin, /Number\(result\.meta\?\.changes \|\| 0\) !== 1/);
  assert.match(admin, /moderationLogAfterChange\(env, action, "report", reportId/);
  assert.match(admin, /results\[0\]\?\.meta\?\.changes/);
  const reportStart = admin.indexOf("const reportMatch");
  const reportEnd = admin.indexOf("const threadMatch", reportStart);
  const reportSection = admin.slice(reportStart, reportEnd);
  assert.ok(reportSection.indexOf("UPDATE reports SET status") < reportSection.indexOf("UPDATE comments SET status"));
  assert.match(reportSection, /status = 'visible' AND changes\(\) = 1/);
  assert.match(admin, /WHERE threads\.locked != excluded\.locked/);
  assert.match(admin, /moderationLogAfterChange\(env, input\.locked \? "lock" : "unlock", "thread"/);
});

test("部署配置不含私密值并包含迁移、定时清理与独立发布脚本", async () => {
  const [config, packageJsonText, packageLockText, deployScript, secretExample] = await Promise.all([
    read("comments-worker/wrangler.jsonc"),
    read("comments-worker/package.json"),
    read("comments-worker/package-lock.json"),
    read("comments-worker/scripts/deploy.ps1"),
    read("comments-worker/.dev.vars.example"),
  ]);
  const packageJson = JSON.parse(packageJsonText);
  const packageLock = JSON.parse(packageLockText);
  assert.match(config, /"binding": "DB"/);
  assert.match(config, /"migrations_dir": "migrations"/);
  assert.match(config, /"crons"/);
  assert.doesNotMatch(config, /TURNSTILE_SECRET_KEY|HASH_SECRET|ADMIN_TOKEN/);
  assert.match(packageJson.scripts["db:migrate:remote"], /migrations apply DB --remote/);
  assert.match(packageJson.scripts.deploy, /wrangler deploy/);
  assert.equal(packageJson.overrides.undici, "7.29.0");
  assert.equal(packageLock.lockfileVersion, 3);
  for (const binding of [
    "SITE_URL",
    "SITE_ID",
    "TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "HASH_SECRET",
    "ADMIN_TOKEN",
  ]) {
    assert.ok(packageJson.cloudflare.bindings[binding]?.description, `${binding} 缺少部署提示`);
  }
  assert.match(secretExample, /TURNSTILE_SECRET_KEY=/);
  assert.match(secretExample, /HASH_SECRET=/);
  assert.match(secretExample, /ADMIN_TOKEN=/);
  assert.match(deployScript, /d1 migrations apply DB/);
  assert.match(deployScript, /wrangler deploy/);
});

test("编辑凭证摘要确实由 HASH_SECRET HMAC 生成", async () => {
  const security = await read("comments-worker/src/security.js");
  assert.match(security, /hmacHex\(env\.HASH_SECRET, `edit\\n\$\{env\.SITE_ID\}\\n\$\{token\}`\)/);
  assert.match(security, /name: "HMAC", hash: "SHA-256"/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { toPublicQuestion } from "../comments-worker/src/db.js";
import worker from "../comments-worker/src/index.js";
import {
  HttpError,
  normalizeQuestionFields,
  parseQuestionInput,
  parseQuestionPagination,
  parseQuestionUpdateInput,
  validateQuestionId,
} from "../comments-worker/src/validation.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const requestId = "550e8400-e29b-41d4-a716-446655440000";
const editToken = "abcdefghijklmnopqrstuvwxyzABCDEF0123456789_-";

const validQuestion = (overrides = {}) => ({
  title: "LoRA 的微调原理是什么？",
  category: "微调",
  difficulty: "中等",
  answerStatus: "complete",
  answer: "LoRA 冻结原权重，只训练低秩增量矩阵。",
  followUps: ["rank 如何选择？", "rank 如何选择？", "alpha 有什么作用？"],
  tags: "LoRA，微调, LoRA",
  source: "现场面试",
  localId: "question_550e8400-e29b-41d4-a716-446655440000",
  requestId,
  editToken,
  turnstileToken: "turnstile-token",
  website: "",
  ...overrides,
});

test("公开题输入与站内题目字段一致，作者省略时保持极简匿名发布", () => {
  const input = parseQuestionInput(validQuestion());
  assert.equal(input.title, "LoRA 的微调原理是什么？");
  assert.equal(input.author, "匿名用户");
  assert.deepEqual(input.followUps, ["rank 如何选择？", "alpha 有什么作用？"]);
  assert.deepEqual(input.tags, ["LoRA", "微调"]);
  assert.equal(input.answerStatus, "complete");
  assert.equal(input.website, "");

  const minimal = parseQuestionInput(validQuestion({
    answerStatus: undefined,
    answer: undefined,
    category: undefined,
    difficulty: undefined,
    followUps: undefined,
    tags: undefined,
    source: undefined,
    localId: undefined,
  }));
  assert.equal(minimal.answerStatus, "pending");
  assert.equal(minimal.answer, "");
  assert.equal(minimal.category, "待整理");
  assert.equal(minimal.difficulty, "待评估");
  assert.deepEqual(minimal.followUps, []);
  assert.deepEqual(minimal.tags, []);
});

test("公开题拒绝伪完成答案、非法枚举、控制字符、弱凭证和异常本机编号", () => {
  const invalid = [
    { answerStatus: "complete", answer: "" },
    { difficulty: "非常难" },
    { answerStatus: "reviewing" },
    { title: "bad\u0000title" },
    { editToken: "short" },
    { requestId: "not-a-uuid" },
    { localId: "../private" },
    { followUps: Array.from({ length: 11 }, (_, index) => `追问 ${index}`) },
    { tags: Array.from({ length: 13 }, (_, index) => `标签${index}`) },
  ];
  for (const patch of invalid) {
    assert.throws(() => parseQuestionInput(validQuestion(patch)), HttpError, JSON.stringify(patch));
  }
});

test("题目 PATCH 支持单字段修改，并在合并后重新检查答案状态", () => {
  const update = parseQuestionUpdateInput({ editToken, answer: "新的答案" });
  assert.deepEqual(update.patch, { answer: "新的答案" });
  assert.equal(update.editToken, editToken);
  assert.throws(() => parseQuestionUpdateInput({ editToken }), (error) => (
    error instanceof HttpError && error.code === "empty_question_update"
  ));
  assert.throws(() => normalizeQuestionFields({
    ...validQuestion(),
    answerStatus: "complete",
    answer: "",
  }), (error) => error instanceof HttpError && error.code === "answer_required");
});

test("公开题分页最多返回 100 条，题目路径只接受 UUID", () => {
  assert.deepEqual(parseQuestionPagination(new URLSearchParams()), { cursor: 0, limit: 100 });
  assert.deepEqual(parseQuestionPagination(new URLSearchParams("cursor=100&limit=999")), {
    cursor: 100,
    limit: 100,
  });
  assert.throws(() => parseQuestionPagination(new URLSearchParams("cursor=-1")), HttpError);
  assert.equal(validateQuestionId(requestId), requestId);
  assert.throws(() => validateQuestionId("question-local-id"), HttpError);
});

test("D1 行只映射公开字段，删除记录不会再泄露原题内容", () => {
  const row = {
    id: requestId,
    library_number: 17,
    title: "题目",
    category: "基础",
    difficulty: "简单",
    answer_status: "pending",
    answer: "",
    follow_ups_json: '["追问"]',
    tags_json: '["标签"]',
    source: "",
    author: "匿名用户",
    local_id: "question_local",
    status: "visible",
    created_at: "2026-08-07T00:00:00.000Z",
    updated_at: "2026-08-07T00:00:00.000Z",
    edit_token_hash: "must-not-leak",
    request_id: "must-not-leak",
  };
  assert.deepEqual(toPublicQuestion(row), {
    id: requestId,
    libraryNumber: 17,
    title: "题目",
    category: "基础",
    difficulty: "简单",
    answerStatus: "pending",
    answer: "",
    followUps: ["追问"],
    tags: ["标签"],
    source: "",
    author: "匿名用户",
    localId: "question_local",
    createdAt: "2026-08-07T00:00:00.000Z",
    updatedAt: "2026-08-07T00:00:00.000Z",
    status: "visible",
  });
  assert.deepEqual(toPublicQuestion({ ...row, status: "deleted" }), {
    id: requestId,
    status: "deleted",
    updatedAt: "2026-08-07T00:00:00.000Z",
  });
});

test("公开题迁移只有 visible、hidden、deleted，没有发布审核状态", async () => {
  const sql = await read("comments-worker/migrations/0002_public_questions.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public_questions/);
  assert.match(sql, /status TEXT NOT NULL DEFAULT 'visible'/);
  assert.match(sql, /status IN \('visible', 'hidden', 'deleted'\)/);
  const publicationStatusConstraint = sql.match(/status TEXT NOT NULL DEFAULT 'visible'[^\n]+/)?.[0] || "";
  assert.doesNotMatch(publicationStatusConstraint, /pending|review|approved/i);
  assert.match(sql, /UNIQUE \(site_id, request_id\)/);
  assert.match(sql, /public_questions_active_local_id/);
  assert.match(sql, /edit_token_hash TEXT NOT NULL/);
  assert.doesNotMatch(sql, /^\s*edit_token\s+TEXT/gim);
  assert.match(sql, /target_type IN \('comment', 'report', 'thread', 'question'\)/);
});

test("固定题号迁移按站点和创建顺序回填，隐藏删除占号且旧 INSERT 继续递增", async (t) => {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import("node:sqlite"));
  } catch {
    t.skip("当前 Node 版本没有内置 SQLite，保留静态与 HTTP 测试覆盖");
    return;
  }

  const sqlite = new DatabaseSync(":memory:");
  let insertLegacyQuestion;
  const insert = ({ id, siteId = "stable-site", status, createdAt }) => {
    insertLegacyQuestion.run(
      id,
      siteId,
      `题目 ${id.slice(-2)}`,
      status,
      `hash-${id}`,
      id,
      createdAt,
      createdAt,
    );
  };

  try {
    sqlite.exec(await read("comments-worker/migrations/0001_initial.sql"));
    sqlite.exec(await read("comments-worker/migrations/0002_public_questions.sql"));
    insertLegacyQuestion = sqlite.prepare(
      `INSERT INTO public_questions
        (id, site_id, title, category, difficulty, answer_status, answer, follow_ups_json,
         tags_json, source, author, local_id, status, edit_token_hash, request_id,
         created_at, updated_at)
       VALUES (?, ?, ?, '基础', '简单', 'pending', '', '[]', '[]', '', '匿名用户', '', ?, ?, ?, ?, ?)`,
    );
    insert({
      id: "550e8400-e29b-41d4-a716-446655440003",
      status: "visible",
      createdAt: "2026-08-03T00:00:00.000Z",
    });
    insert({
      id: "550e8400-e29b-41d4-a716-446655440001",
      status: "hidden",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    insert({
      id: "550e8400-e29b-41d4-a716-446655440002",
      status: "deleted",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    insert({
      id: "550e8400-e29b-41d4-a716-446655440010",
      siteId: "other-site",
      status: "visible",
      createdAt: "2026-08-02T00:00:00.000Z",
    });

    sqlite.exec(await read("comments-worker/migrations/0003_stable_question_numbers.sql"));
    const backfilled = sqlite.prepare(
      "SELECT id, site_id, status, library_number FROM public_questions ORDER BY site_id, library_number",
    ).all().map((row) => ({ ...row }));
    assert.deepEqual(backfilled, [
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        site_id: "other-site",
        status: "visible",
        library_number: 1,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        site_id: "stable-site",
        status: "hidden",
        library_number: 1,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        site_id: "stable-site",
        status: "deleted",
        library_number: 2,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        site_id: "stable-site",
        status: "visible",
        library_number: 3,
      },
    ]);

    insert({
      id: "550e8400-e29b-41d4-a716-446655440004",
      status: "visible",
      createdAt: "2026-08-04T00:00:00.000Z",
    });
    assert.equal(sqlite.prepare(
      "SELECT library_number FROM public_questions WHERE id = ?",
    ).get("550e8400-e29b-41d4-a716-446655440004").library_number, 4);

    sqlite.prepare("UPDATE public_questions SET status = 'deleted' WHERE id = ?")
      .run("550e8400-e29b-41d4-a716-446655440004");
    insert({
      id: "550e8400-e29b-41d4-a716-446655440005",
      status: "visible",
      createdAt: "2026-08-05T00:00:00.000Z",
    });
    assert.equal(sqlite.prepare(
      "SELECT library_number FROM public_questions WHERE id = ?",
    ).get("550e8400-e29b-41d4-a716-446655440005").library_number, 5);
    assert.throws(() => sqlite.prepare(
      "UPDATE public_questions SET library_number = 1 WHERE id = ?",
    ).run("550e8400-e29b-41d4-a716-446655440005"), /UNIQUE constraint failed/);
  } finally {
    sqlite.close();
  }
});

test("公开题路由发布前完成蜜罐、幂等、Turnstile 和每日限流", async () => {
  const worker = await read("comments-worker/src/index.js");
  assert.match(worker, /url\.pathname === "\/v1\/questions"/);
  assert.match(worker, /\^\\\/v1\\\/questions\\\/\(\[\^\/\]\+\)\$/);
  assert.match(worker, /questionsWriteEnabled: config\.writeEnabled/);
  assert.match(worker, /action: "public-question"/);
  const start = worker.indexOf("async function postQuestion(");
  const end = worker.indexOf("async function patchQuestion(", start);
  const section = worker.slice(start, end);
  assert.ok(section.indexOf('input.website !== ""') < section.indexOf("editTokenHash"));
  assert.ok(section.indexOf("findIdempotentQuestion") < section.indexOf("verifyTurnstile"));
  assert.ok(section.indexOf("verifyTurnstile") < section.indexOf('"question-create"'));
  assert.ok(section.indexOf('"question-create"') < section.indexOf("insertPublicQuestion"));
  assert.doesNotMatch(section, /review|approve|pending approval|审核/i);
});

test("公开读取只返回 visible，作者删除会清空正文，管理员可原子下架与恢复", async () => {
  const [db, admin, adminAssets] = await Promise.all([
    read("comments-worker/src/db.js"),
    read("comments-worker/src/admin.js"),
    read("comments-worker/src/admin-assets.js"),
  ]);
  assert.match(db, /FROM public_questions[\s\S]*status = 'visible' AND library_number > \?[\s\S]*ORDER BY library_number ASC/);
  assert.match(db, /deleteOwnQuestion[\s\S]*title = '已删除'[\s\S]*status = 'deleted'/);
  assert.match(db, /getOwnedQuestionDeletionState[\s\S]*SELECT id, status, updated_at[\s\S]*status IN \('visible', 'hidden', 'deleted'\)/);
  assert.match(db, /deleteOwnQuestion[\s\S]*SELECT id, status, updated_at[\s\S]*status = 'deleted'/);
  assert.match(db, /edit_token_hash = \?/);
  assert.match(db, /moderatePublicQuestion[\s\S]*action === "hide"[\s\S]*action === "show"[\s\S]*action === "delete"/);
  assert.match(db, /target_type, target_id[\s\S]*'question'[\s\S]*WHERE changes\(\) = 1/);
  assert.match(db, /db\.batch\(\[statement, log\]\)/);
  assert.ok(admin.includes("public-questions"));
  assert.match(admin, /\["hide", "show", "delete"\]/);
  assert.match(admin, /listAdminPublicQuestions/);
  assert.match(adminAssets, /data-view="questions"/);
  assert.match(adminAssets, /function renderQuestion/);
  assert.match(adminAssets, /item\.libraryNumber/);
  assert.match(adminAssets, /padStart\(3,"0"\)/);
  assert.match(adminAssets, /\/v1\/admin\/public-questions/);
  assert.match(adminAssets, /下架隐藏/);
  assert.doesNotMatch(adminAssets, /待审核|通过审核|拒绝发布/);
  const exportStart = admin.indexOf('url.pathname === "/v1/admin/export"');
  const exportEnd = admin.indexOf('url.pathname === "/v1/admin/comments"', exportStart);
  const exportSection = admin.slice(exportStart, exportEnd);
  assert.match(exportSection, /publicQuestions:/);
  assert.match(exportSection, /libraryNumber: Number\(row\.library_number\)/);
  assert.match(exportSection, /ORDER BY library_number ASC, id ASC/);
  assert.doesNotMatch(exportSection, /edit_token_hash|request_id/);
});

test("公开题 HTTP 契约端到端完成直发、幂等、修改、事后下架和删除", async (t) => {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import("node:sqlite"));
  } catch {
    t.skip("当前 Node 版本没有内置 SQLite，保留静态与单元测试覆盖");
    return;
  }

  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(await read("comments-worker/migrations/0001_initial.sql"));
  sqlite.prepare(
    `INSERT INTO moderation_log (id, site_id, action, target_type, target_id, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    "550e8400-e29b-41d4-a716-446655440099",
    "question-api-test",
    "hide",
    "comment",
    "550e8400-e29b-41d4-a716-446655440098",
    "升级前记录",
    "2026-08-06T00:00:00.000Z",
  );
  sqlite.exec(await read("comments-worker/migrations/0002_public_questions.sql"));
  sqlite.exec(await read("comments-worker/migrations/0003_stable_question_numbers.sql"));
  const preservedLog = sqlite.prepare(
    "SELECT action, target_type, reason FROM moderation_log WHERE id = ?",
  ).get("550e8400-e29b-41d4-a716-446655440099");
  assert.deepEqual({ ...preservedLog }, {
    action: "hide",
    target_type: "comment",
    reason: "升级前记录",
  });

  class D1Statement {
    constructor(statement) {
      this.statement = statement;
      this.args = [];
    }

    bind(...args) {
      this.args = args;
      return this;
    }

    async run() {
      const result = this.statement.run(...this.args);
      return { meta: { changes: Number(result.changes) } };
    }

    async first() {
      return this.statement.get(...this.args) ?? null;
    }

    async all() {
      return { results: this.statement.all(...this.args) };
    }
  }

  const db = {
    prepare(sql) {
      return new D1Statement(sqlite.prepare(sql));
    },
    async batch(statements) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
  };
  const env = {
    SITE_URL: "https://notes.example.com/llm",
    SITE_ID: "question-api-test",
    TURNSTILE_SITE_KEY: "site-key-123",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    HASH_SECRET: "h".repeat(32),
    ADMIN_TOKEN: "a".repeat(32),
    DB: db,
  };
  const siteHeaders = {
    origin: "https://notes.example.com",
    "content-type": "application/json",
    "CF-Connecting-IP": "192.0.2.10",
  };
  const originalFetch = globalThis.fetch;
  let turnstileCalls = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes("challenges.cloudflare.com/turnstile")) {
      turnstileCalls += 1;
      const token = new URLSearchParams(options.body).get("response");
      return Response.json({
        success: true,
        action: token === "comment-turnstile-token" ? "question-comment" : "public-question",
        hostname: "notes.example.com",
      });
    }
    throw new Error(`unexpected fetch: ${url}`);
  };

  try {
    const postBody = validQuestion({ author: undefined });
    const configResponse = await worker.fetch(new Request("https://api.example.workers.dev/v1/config", {
      headers: { origin: "https://notes.example.com" },
    }), env);
    assert.deepEqual(await configResponse.json(), {
      siteId: "question-api-test",
      turnstileSiteKey: "site-key-123",
      writeEnabled: true,
      questionsWriteEnabled: true,
    });

    const deniedOrigin = await worker.fetch(new Request("https://api.example.workers.dev/v1/questions", {
      method: "POST",
      headers: { ...siteHeaders, origin: "https://evil.example" },
      body: JSON.stringify(postBody),
    }), env);
    assert.equal(deniedOrigin.status, 403);

    const trapped = await worker.fetch(new Request("https://api.example.workers.dev/v1/questions", {
      method: "POST",
      headers: siteHeaders,
      body: JSON.stringify(validQuestion({
        requestId: "550e8400-e29b-41d4-a716-446655440010",
        localId: "question_honeypot",
        website: "https://spam.example",
      })),
    }), env);
    assert.equal(trapped.status, 202);
    assert.equal(turnstileCalls, 0);

    const first = await worker.fetch(new Request("https://api.example.workers.dev/v1/questions", {
      method: "POST",
      headers: siteHeaders,
      body: JSON.stringify(postBody),
    }), env);
    assert.equal(first.status, 201);
    const createdPayload = await first.json();
    assert.equal(createdPayload.question.status, "visible");
    assert.equal(createdPayload.question.author, "匿名用户");
    assert.equal(createdPayload.question.libraryNumber, 1);
    assert.equal(createdPayload.idempotent, false);
    const questionId = createdPayload.question.id;

    const retry = await worker.fetch(new Request("https://api.example.workers.dev/v1/questions", {
      method: "POST",
      headers: siteHeaders,
      body: JSON.stringify(postBody),
    }), env);
    assert.equal(retry.status, 200);
    const retryPayload = await retry.json();
    assert.equal(retryPayload.idempotent, true);
    assert.equal(retryPayload.question.libraryNumber, 1);
    assert.equal(turnstileCalls, 1, "幂等重试不能重复消耗 Turnstile 和限流额度");

    const list = await worker.fetch(new Request("https://api.example.workers.dev/v1/questions", {
      headers: { origin: "https://notes.example.com" },
    }), env);
    const listed = await list.json();
    assert.equal(listed.total, 1);
    assert.equal(listed.questions[0].id, questionId);
    assert.equal(listed.questions[0].libraryNumber, 1);

    const commentResponse = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}/comments`,
      {
        method: "POST",
        headers: siteHeaders,
        body: JSON.stringify({
          nickname: "匿名访客",
          body: "这条评论直接显示在公开题下面。",
          parentId: null,
          turnstileToken: "comment-turnstile-token",
          requestId: "550e8400-e29b-41d4-a716-446655440020",
          editToken: "zyxwvutsrqponmlkjihgfedcbaABCDEF0123456789_-",
          website: "",
        }),
      },
    ), env);
    assert.equal(commentResponse.status, 201);
    const createdComment = await commentResponse.json();
    assert.equal(createdComment.comment.floor, 1);
    assert.equal(createdComment.comment.nickname, "匿名访客");

    const publicComments = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}/comments`,
      { headers: { origin: "https://notes.example.com" } },
    ), env);
    assert.equal(publicComments.status, 200);
    assert.equal((await publicComments.json()).total, 1);

    const wrongToken = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}`,
      {
        method: "PATCH",
        headers: siteHeaders,
        body: JSON.stringify({ editToken: "x".repeat(43), answer: "不能覆盖" }),
      },
    ), env);
    assert.equal(wrongToken.status, 403);

    const edited = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}`,
      {
        method: "PATCH",
        headers: siteHeaders,
        body: JSON.stringify({ editToken, answerStatus: "complete", answer: "低秩增量。" }),
      },
    ), env);
    assert.equal(edited.status, 200);
    const editedQuestion = (await edited.json()).question;
    assert.equal(editedQuestion.answerStatus, "complete");
    assert.equal(editedQuestion.libraryNumber, 1);

    const concurrentBodies = [
      validQuestion({
        title: "第二道公开题",
        localId: "question_second",
        requestId: "550e8400-e29b-41d4-a716-446655440002",
      }),
      validQuestion({
        title: "第三道公开题",
        localId: "question_third",
        requestId: "550e8400-e29b-41d4-a716-446655440003",
      }),
    ];
    const concurrentResponses = await Promise.all(concurrentBodies.map((body) => worker.fetch(
      new Request("https://api.example.workers.dev/v1/questions", {
        method: "POST",
        headers: siteHeaders,
        body: JSON.stringify(body),
      }),
      env,
    )));
    assert.deepEqual(concurrentResponses.map((response) => response.status), [201, 201]);
    const concurrentQuestions = await Promise.all(concurrentResponses.map(async (response) => (
      (await response.json()).question
    )));
    assert.deepEqual(
      concurrentQuestions.map((question) => question.libraryNumber).sort((left, right) => left - right),
      [2, 3],
    );
    const highestQuestion = concurrentQuestions.find((question) => question.libraryNumber === 3);

    const firstPage = await worker.fetch(new Request(
      "https://api.example.workers.dev/v1/questions?cursor=0&limit=1",
      { headers: { origin: "https://notes.example.com" } },
    ), env);
    const firstPagePayload = await firstPage.json();
    assert.equal(firstPagePayload.total, 3);
    assert.deepEqual(firstPagePayload.questions.map((question) => question.libraryNumber), [1]);
    assert.equal(firstPagePayload.nextCursor, 1);

    const hidden = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/admin/public-questions/${questionId}`,
      {
        method: "PATCH",
        headers: {
          origin: "https://api.example.workers.dev",
          authorization: `Bearer ${env.ADMIN_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "hide", reason: "事后治理测试" }),
      },
    ), env);
    assert.equal(hidden.status, 200);
    assert.equal((await hidden.json()).question.status, "hidden");

    const hiddenItem = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}`,
      { headers: { origin: "https://notes.example.com" } },
    ), env);
    assert.equal(hiddenItem.status, 404);

    const hiddenComments = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}/comments`,
      { headers: { origin: "https://notes.example.com" } },
    ), env);
    assert.equal(hiddenComments.status, 404);

    const hiddenList = await worker.fetch(new Request("https://api.example.workers.dev/v1/questions", {
      headers: { origin: "https://notes.example.com" },
    }), env);
    const hiddenListPayload = await hiddenList.json();
    assert.equal(hiddenListPayload.total, 2);
    assert.deepEqual(hiddenListPayload.questions.map((question) => question.libraryNumber), [2, 3]);

    const nextPage = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions?cursor=${firstPagePayload.nextCursor}&limit=1`,
      { headers: { origin: "https://notes.example.com" } },
    ), env);
    const nextPagePayload = await nextPage.json();
    assert.deepEqual(nextPagePayload.questions.map((question) => question.libraryNumber), [2]);
    assert.equal(nextPagePayload.nextCursor, 2, "隐藏前一页题目后，keyset 分页不能跳过下一题");

    const shown = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/admin/public-questions/${questionId}`,
      {
        method: "PATCH",
        headers: {
          origin: "https://api.example.workers.dev",
          authorization: `Bearer ${env.ADMIN_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "show", reason: "恢复测试" }),
      },
    ), env);
    assert.equal(shown.status, 200);
    assert.equal((await shown.json()).question.libraryNumber, 1);

    const removedHighest = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${highestQuestion.id}`,
      {
        method: "DELETE",
        headers: siteHeaders,
        body: JSON.stringify({ editToken }),
      },
    ), env);
    assert.equal(removedHighest.status, 200);
    assert.deepEqual({ ...sqlite.prepare(
      "SELECT library_number, status FROM public_questions WHERE id = ?",
    ).get(highestQuestion.id) }, { library_number: 3, status: "deleted" });

    const fourth = await worker.fetch(new Request("https://api.example.workers.dev/v1/questions", {
      method: "POST",
      headers: siteHeaders,
      body: JSON.stringify(validQuestion({
        title: "删除最大题号后的新增题",
        localId: "question_fourth",
        requestId: "550e8400-e29b-41d4-a716-446655440004",
      })),
    }), env);
    assert.equal(fourth.status, 201);
    assert.equal((await fourth.json()).question.libraryNumber, 4, "软删除的最大题号不能被复用");

    const exported = await worker.fetch(new Request(
      "https://api.example.workers.dev/v1/admin/export",
      {
        headers: {
          origin: "https://api.example.workers.dev",
          authorization: `Bearer ${env.ADMIN_TOKEN}`,
        },
      },
    ), env);
    assert.equal(exported.status, 200);
    const exportPayload = await exported.json();
    assert.deepEqual(
      exportPayload.publicQuestions
        .map((question) => question.libraryNumber)
        .sort((left, right) => left - right),
      [1, 2, 3, 4],
    );

    const removed = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}`,
      {
        method: "DELETE",
        headers: siteHeaders,
        body: JSON.stringify({ editToken }),
      },
    ), env);
    assert.equal(removed.status, 200);
    const removedPayload = await removed.json();
    assert.equal(removedPayload.question.status, "deleted");
    assert.deepEqual(Object.keys(removedPayload.question).sort(), ["id", "status", "updatedAt"]);

    const deletedRow = sqlite.prepare(
      `SELECT library_number, title, answer, follow_ups_json, tags_json, source, local_id, status
       FROM public_questions WHERE id = ?`,
    ).get(questionId);
    assert.deepEqual({ ...deletedRow }, {
      library_number: 1,
      title: "已删除",
      answer: "",
      follow_ups_json: "[]",
      tags_json: "[]",
      source: "",
      local_id: "",
      status: "deleted",
    });
    const mutationCountAfterDelete = Number(sqlite.prepare(
      "SELECT COALESCE(SUM(count), 0) AS total FROM rate_limits WHERE scope = 'question-mutation'",
    ).get().total);

    const lostResponseRetry = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}`,
      {
        method: "DELETE",
        headers: siteHeaders,
        body: JSON.stringify({ editToken }),
      },
    ), env);
    assert.equal(lostResponseRetry.status, 200);
    assert.deepEqual((await lostResponseRetry.json()).question, removedPayload.question);
    assert.equal(Number(sqlite.prepare(
      "SELECT COALESCE(SUM(count), 0) AS total FROM rate_limits WHERE scope = 'question-mutation'",
    ).get().total), mutationCountAfterDelete, "幂等删除重试不应重复消耗变更额度");

    const deniedDeletedQuestion = await worker.fetch(new Request(
      `https://api.example.workers.dev/v1/questions/${questionId}`,
      {
        method: "DELETE",
        headers: siteHeaders,
        body: JSON.stringify({ editToken: "x".repeat(43) }),
      },
    ), env);
    assert.equal(deniedDeletedQuestion.status, 403);
    assert.equal(Number(sqlite.prepare(
      "SELECT COALESCE(SUM(count), 0) AS total FROM rate_limits WHERE scope = 'question-mutation'",
    ).get().total), mutationCountAfterDelete, "错误凭证不应进入删除或限流写入");
  } finally {
    globalThis.fetch = originalFetch;
    sqlite.close();
  }
});

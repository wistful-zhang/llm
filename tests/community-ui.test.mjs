import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildCommunityIssuesApiUrl,
  normalizeCommunityIssues,
} from '../docs/assets/js/community-core.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const fieldSection = (form, id) => {
  const section = form
    .split(/\n(?=  - type:)/)
    .find((block) => new RegExp(`\\n    id: ${id}\\b`).test(`\n${block}`));
  assert.ok(section, `Issue Form 缺少 ${id} 字段`);
  return section;
};

test('社区页提供无需 Markdown 的投稿、校对和评论入口，并适配仓库复用', async () => {
  const [page, layout] = await Promise.all([
    read('../docs/community.html'),
    read('../docs/_layouts/default.html'),
  ]);
  const source = `${page}\n${layout}`;

  assert.match(page, /permalink:\s*\/community\//);
  assert.match(page, /data-community-feed/);
  assert.match(page, /data-repository-nwo="{{\s*site\.github\.repository_nwo/);
  assert.match(page, /data-repository-url="{{\s*site\.github\.repository_url/);
  assert.match(page, /issues\/new\?template=community-question\.yml/);
  assert.match(page, /issues\/new\?template=question-review\.yml/);
  assert.match(page, /评论/);
  assert.match(page, /公开仓库/);
  assert.match(page, /私有仓库/);

  assert.match(layout, /href="{{ '\/community\/' \| relative_url }}"/);
  assert.match(layout, /page\.url == '\/community\/'[\s\S]*?aria-current="page"/);
  assert.match(source, /assets\/js\/community\.js/);

  assert.doesNotMatch(source, /<(?:input|textarea)[^>]+name=["'][^"']*(?:token|password|secret|pat)[^"']*["']/i);
  assert.doesNotMatch(source, /https?:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+/i);
});

test('社区投稿与校对使用结构化 Issue Form，并在公开前要求隐私确认', async () => {
  const [questionForm, reviewForm] = await Promise.all([
    read('../.github/ISSUE_TEMPLATE/community-question.yml'),
    read('../.github/ISSUE_TEMPLATE/question-review.yml'),
  ]);

  assert.match(questionForm, /title:\s*["']?\[社区投稿\]/);
  assert.match(reviewForm, /title:\s*["']?\[题目校对\]/);

  assert.match(fieldSection(questionForm, 'question'), /required:\s*true/);
  assert.doesNotMatch(fieldSection(questionForm, 'answer'), /required:\s*true/);
  assert.match(fieldSection(questionForm, 'category'), /type:\s*dropdown/);
  assert.match(fieldSection(reviewForm, 'question_url'), /required:\s*true/);
  assert.match(fieldSection(reviewForm, 'correction'), /required:\s*true/);

  for (const form of [questionForm, reviewForm]) {
    assert.match(form, /提交后会公开/);
    assert.match(form, /Security/);
    assert.match(fieldSection(form, 'compliance'), /required:\s*true/);
    assert.doesNotMatch(form, /id:\s*(?:token|password|secret|pat)\b/i);
  }
});

test('公开社区列表只请求当前仓库的 Issues API，并拒绝无效仓库标识', () => {
  const url = new URL(buildCommunityIssuesApiUrl('example-owner/example-repo', 12));

  assert.equal(url.origin, 'https://api.github.com');
  assert.equal(url.pathname, '/repos/example-owner/example-repo/issues');
  assert.equal(url.searchParams.get('state'), 'all');
  assert.equal(url.searchParams.get('sort'), 'updated');
  assert.equal(url.searchParams.get('direction'), 'desc');
  assert.equal(url.searchParams.get('per_page'), '12');
  assert.equal(url.searchParams.get('page'), '1');

  for (const value of ['', 'owner', 'owner/repo/extra', '../repo', 'owner/repo?x=1']) {
    assert.throws(() => buildCommunityIssuesApiUrl(value), /仓库|repository/i);
  }
});

test('动态列表只保留社区 Issue，排除 PR 和普通维护 Issue', () => {
  const payload = [
    {
      number: 11,
      title: '[社区投稿] 为什么 KV Cache 能加速推理？',
      user: { login: 'alice' },
      comments: 3,
      state: 'open',
      updated_at: '2026-07-22T08:00:00Z',
    },
    {
      number: 12,
      title: '[题目校对] RoPE 外推说明',
      user: { login: 'bob' },
      comments: 1,
      state: 'closed',
      locked: true,
      updated_at: '2026-07-21T08:00:00Z',
    },
    {
      number: 13,
      title: '[社区投稿] 这是一个 Pull Request',
      user: { login: 'mallory' },
      comments: 9,
      state: 'open',
      pull_request: { url: 'https://api.github.com/repos/example-owner/example-repo/pulls/13' },
    },
    {
      number: 14,
      title: '[Bug] 普通维护问题',
      user: { login: 'maintainer' },
      comments: 2,
      state: 'open',
    },
  ];

  const issues = normalizeCommunityIssues(payload, 'example-owner/example-repo');

  assert.deepEqual(issues.map((issue) => issue.number), [11, 12]);
  assert.deepEqual(issues.map((issue) => issue.kind), ['question', 'review']);
  assert.deepEqual(issues.map((issue) => issue.comments), [3, 1]);
  assert.deepEqual(issues.map((issue) => issue.locked), [false, true]);
  assert.deepEqual(issues.map((issue) => issue.url), [
    'https://github.com/example-owner/example-repo/issues/11',
    'https://github.com/example-owner/example-repo/issues/12',
  ]);
  assert.deepEqual(normalizeCommunityIssues(null, 'example-owner/example-repo'), []);
});

test('社区列表使用安全 DOM API 渲染，并在 API 不可用时保留 GitHub 回退入口', async () => {
  const script = await read('../docs/assets/js/community.js');

  assert.match(script, /buildCommunityIssuesApiUrl/);
  assert.match(script, /normalizeCommunityIssues/);
  assert.match(script, /\bfetch\s*\(/);
  assert.match(script, /response\.ok/);
  assert.match(script, /page <= maxPages/);
  assert.match(script, /foundCount >= visibleLimit/);
  assert.match(script, /\.comments\b/);
  assert.match(script, /issue\.locked/);
  assert.match(script, /createElement\(/);
  assert.match(script, /\.textContent\s*=/);
  assert.match(script, /replaceChildren\(/);
  assert.match(script, /catch\s*(?:\([^)]*\))?\s*\{/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /\bAuthorization\b|localStorage|sessionStorage/i);
});

test('未核验题解可直接发起社区校对，用户看到的是校对状态而不是审核状态', async () => {
  const [home, practice, question] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/practice.html'),
    read('../docs/_layouts/question.html'),
  ]);
  const publicUi = `${home}\n${practice}\n${question}`;

  assert.match(question, /page\.verified != true[\s\S]*?question-review\.yml/);
  assert.match(question, /\[题目校对\]/);
  for (const source of [home, practice, question]) {
    assert.match(source, /参考答案.{0,8}待校对/);
    assert.doesNotMatch(source, /答案待复核|待审核/);
  }
  assert.doesNotMatch(publicUi, /verified:\s*true/);
});

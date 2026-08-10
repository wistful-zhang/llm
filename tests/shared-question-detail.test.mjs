import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildPublicQuestionDetailUrl,
  normalizePublicQuestions,
} from '../docs/assets/js/question-collaboration-core.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const id = '123e4567-e89b-42d3-a456-426614174000';

test('公开题详情链接保留 GitHub Pages 子目录并只携带规范 UUID', () => {
  const url = new URL(buildPublicQuestionDetailUrl(
    '/llm/shared-question/?old=1#answer',
    id.toUpperCase(),
    'https://example.github.io/llm/',
  ));
  assert.equal(url.origin, 'https://example.github.io');
  assert.equal(url.pathname, '/llm/shared-question/');
  assert.equal(url.searchParams.get('id'), id);
  assert.equal([...url.searchParams].length, 1);
  assert.equal(url.hash, '');
  assert.throws(
    () => buildPublicQuestionDetailUrl('/llm/shared-question/', 'issue-39', 'https://example.github.io/llm/'),
    /编号无效/,
  );
  assert.throws(
    () => buildPublicQuestionDetailUrl('https://attacker.example/view', id, 'https://example.github.io/llm/'),
    /同源/,
  );
});

test('使用者公开题不会伪装成待重整层级或资料已核验题', () => {
  const [question] = normalizePublicQuestions({
    questions: [{
      id,
      title: 'LoRA 的原理是什么？',
      answerStatus: 'complete',
      answer: '只训练低秩增量。',
      status: 'visible',
    }],
  });
  assert.equal(question.studyTier, 'unclassified');
  assert.equal(question.verified, false);
});

test('首页公开题整卡进入稳定详情页，记题页也提供查看入口', async () => {
  const [home, capture, publicScript, captureScript] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/capture.html'),
    read('../docs/assets/js/public-questions.js'),
    read('../docs/assets/js/question-capture.js'),
  ]);
  assert.match(home, /data-question-detail-url="\{\{ '\/shared-question\/' \| relative_url \}\}"/);
  assert.match(capture, /data-question-detail-url="\{\{ '\/shared-question\/' \| relative_url \}\}"/);
  assert.match(publicScript, /makeElement\('a', 'question-card question-card-public'\)/);
  assert.match(publicScript, /card\.href = detailUrl\(question\.id\)/);
  assert.match(publicScript, /buildPublicQuestionDetailUrl/);
  assert.match(publicScript, /网友答法 · 未核验/);
  assert.doesNotMatch(publicScript, /makeElement\('details'|public-question-details/);
  assert.match(captureScript, /查看公开页面 ↗/);
  assert.match(captureScript, /publicQuestionDetailUrl\(question\.remoteId\)/);
});

test('公开题详情壳覆盖加载、成功、下架、重试、公式、编辑和分享状态', async () => {
  const [page, script, share, stylesheet] = await Promise.all([
    read('../docs/shared-question.html'),
    read('../docs/assets/js/shared-question.js'),
    read('../docs/assets/js/share.js'),
    read('../docs/assets/css/style.css'),
  ]);
  assert.match(page, /permalink: \/shared-question\//);
  assert.match(page, /data-questions-api-url="\{\{ site\.data\.question_runtime\.api_url/);
  assert.match(page, /data-shared-question-loading/);
  assert.match(page, /data-shared-question-error/);
  assert.match(page, /data-shared-question-content hidden/);
  assert.match(page, /data-shared-question-owner-actions hidden/);
  assert.match(page, /assets\/js\/shared-question\.js/);
  assert.match(page, /assets\/js\/question-coach\.js/);
  assert.match(page, /assets\/js\/share\.js/);

  assert.match(script, /new URLSearchParams\(window\.location\.search\)\.get\('id'\)/);
  assert.match(script, /buildPublicQuestionApiUrl\(apiBaseUrl, questionId\)/);
  assert.match(script, /cache: 'no-store'/);
  assert.match(script, /AbortController/);
  assert.match(script, /PUBLIC_QUESTIONS_TIMEOUT_MS/);
  assert.match(script, /response\.status === 404/);
  assert.match(script, /normalizePublicQuestionResponse/);
  assert.match(script, /retryButton\.addEventListener/);
  assert.match(script, /window\.history\.replaceState/);
  assert.match(script, /link\[rel="canonical"\]/);
  assert.match(script, /question\.remoteId === remoteId/);
  assert.match(script, /editLink\.href = editUrl\(owned\.id\)/);
  assert.match(script, /网友答法 · 未核验/);
  assert.match(script, /面试场景：/);
  assert.match(script, /\.textContent\s*=/);
  assert.match(script, /\.replaceChildren\(/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /editToken|Authorization|question\.localId/);
  assert.match(share, /const currentTitle = \(\)/);
  assert.match(share, /const currentUrl = \(\)/);
  assert.match(stylesheet, /\.shared-question-state \{/);
  assert.match(stylesheet, /\.shared-question-answer-text \{[^}]*white-space: pre-wrap/);
});

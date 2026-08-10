import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const importCore = () => import('../docs/assets/js/question-collaboration-core.mjs');

test('评论实现保留但站点默认关闭，共享题服务可独立加入 CSP', async () => {
  const [layout, defaultLayout, script, settings, cms] = await Promise.all([
    read('../docs/_layouts/question.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/question-comments.js'),
    read('../docs/_data/settings.yml'),
    read('../.pages.yml'),
  ]);

  assert.match(layout, /data-question-comments/);
  assert.match(layout, /\{%\s*if comments_enabled\s*%\}[\s\S]*<section id="question-comments"/);
  assert.match(layout, /data-comments-api="{{\s*comments_api_url\s*\|\s*escape\s*}}"/);
  assert.match(settings, /^comments_enabled:\s*false$/m);
  assert.match(cms, /name:\s*comments_enabled[\s\S]*default:\s*false/);
  assert.match(script, /turnstile\.render|state\.turnstile\.render/);
  assert.doesNotMatch(script, /api\.github\.com|utteranc/i);

  const csp = defaultLayout.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
  assert.match(defaultLayout, /assign questions_api_url = site\.data\.question_runtime\.api_url/);
  assert.match(defaultLayout, /if questions_api_url != empty[\s\S]*assign turnstile_enabled = true/);
  assert.match(csp, /frame-src \{% if turnstile_enabled %\}https:\/\/challenges\.cloudflare\.com/);
  assert.match(csp, /\{% if questions_api_url != empty %\} {{ questions_api_url \| escape }}/);
  assert.doesNotMatch(csp, /utteranc\.es|frame-src https:;/);
});

test('共享 API 公开题直接显示在统一题库，不再存在 Issue 或审核链路', async () => {
  const [home, layout, publicScript, localScript, captureScript] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/public-questions.js'),
    read('../docs/assets/js/local-questions.js'),
    read('../docs/assets/js/question-capture.js'),
  ]);
  const listStart = home.indexOf('<div id="question-list"');
  const listEnd = home.indexOf('<div class="library-results-bar">', listStart);
  const questionList = home.slice(listStart, listEnd);

  assert.ok(listStart >= 0 && listEnd > listStart);
  assert.equal(home.match(/id="question-list"/g)?.length, 1);
  assert.match(home, /data-questions-api-url="{{ site\.data\.question_runtime\.api_url/);
  assert.match(questionList, /data-local-questions-list/);
  assert.match(questionList, /data-public-questions-list/);
  assert.match(home, /选择公开并保存后，题目会立即出现在这里/);
  assert.match(layout, /page\.url == '\/'[\s\S]*assets\/js\/public-questions\.js/);

  assert.match(publicScript, /buildPublicQuestionsApiUrl/);
  assert.match(publicScript, /fetchAllQuestions/);
  assert.match(publicScript, /question-card question-card-public/);
  assert.match(publicScript, /question-library:public-loaded/);
  assert.match(publicScript, /remoteIds:/);
  assert.match(publicScript, /getPendingQuestionPublication\(publicationTokens, question\.id\)/);
  assert.match(localScript, /publishedRemoteIds/);
  assert.match(localScript, /question\.remoteId/);
  assert.match(localScript, /公开失败 · 仅此浏览器/);
  assert.match(publicScript, /validateKramdownMath\(source\)\.length === 0/);
  assert.match(publicScript, /prepareKramdownMath\(element, options\)/);
  assert.match(publicScript, /void renderMath\(list\)/);
  assert.doesNotMatch(`${publicScript}\n${captureScript}`, /api\.github\.com|issues\/new|buildIssueLaunch|loadPublicIssueMatches|open-submitted-issue|open-issue/);
  assert.doesNotMatch(`${publicScript}\n${localScript}`, /\.innerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
});

test('公开题共享 API 地址与响应执行白名单清洗', async () => {
  const {
    buildPublicQuestionApiUrl,
    buildPublicQuestionsApiUrl,
    normalizePublicQuestions,
    PUBLIC_QUESTIONS_TIMEOUT_MS,
  } = await importCore();
  const url = new URL(buildPublicQuestionsApiUrl('https://questions.example.com', 20, 50));
  assert.equal(url.pathname, '/v1/questions');
  assert.equal(url.searchParams.get('cursor'), '20');
  assert.equal(url.searchParams.get('limit'), '50');
  assert.equal(PUBLIC_QUESTIONS_TIMEOUT_MS, 15_000);
  assert.equal(
    new URL(buildPublicQuestionApiUrl(
      'https://questions.example.com',
      '123e4567-e89b-42d3-a456-426614174000',
    )).pathname,
    '/v1/questions/123e4567-e89b-42d3-a456-426614174000',
  );
  assert.throws(() => buildPublicQuestionsApiUrl('https://questions.example.com/path'), /共享服务|根/);
  assert.throws(
    () => buildPublicQuestionApiUrl('https://questions.example.com', 'issue-39'),
    /编号无效/,
  );

  const questions = normalizePublicQuestions({
    questions: [{
      id: '123e4567-e89b-42d3-a456-426614174000',
      title: '为什么 KV Cache 能加速推理？',
      category: 'LLM 基础',
      difficulty: '中等',
      answerStatus: 'complete',
      answer: '缓存历史 token 的 K/V，避免重复计算。',
      followUps: ['缓存何时失效？'],
      tags: ['推理', '缓存'],
      source: '应用岗',
      author: '匿名用户',
      localId: 'question_local_1',
      status: 'visible',
    }, {
      id: '123e4567-e89b-42d3-a456-426614174001',
      title: '已删除题',
      status: 'deleted',
    }],
  });
  assert.equal(questions.length, 1);
  assert.equal(questions[0].answerStatus, 'complete');
  assert.equal(questions[0].followUps[0], '缓存何时失效？');
  assert.equal(questions[0].localId, 'question_local_1');
  assert.equal(Object.hasOwn(questions[0], 'url'), false);
});

test('公开保存直接 POST，修改与删除使用编辑凭证且响应丢失可幂等重试', async () => {
  const [page, captureScript, tokenCore, workflow] = await Promise.all([
    read('../docs/capture.html'),
    read('../docs/assets/js/question-capture.js'),
    read('../docs/assets/js/question-publication-tokens.mjs'),
    read('../.github/workflows/pages.yml'),
  ]);

  assert.match(page, /data-questions-api-url="{{ site\.data\.question_runtime\.api_url/);
  assert.match(page, /保存成功后立即进入共享题库，所有人可见/);
  assert.match(page, /question-public-challenge-widget/);
  assert.match(captureScript, /method: 'POST'/);
  assert.match(captureScript, /method: 'PATCH'/);
  assert.match(captureScript, /method: 'DELETE'/);
  assert.match(captureScript, /buildPublicQuestionsCollectionApiUrl\(questionsApiUrl\)/);
  assert.match(captureScript, /buildPublicQuestionApiUrl\(questionsApiUrl, question\.remoteId\)/);
  assert.match(captureScript, /appearance: 'interaction-only'/);
  assert.match(captureScript, /requestId: pending\.requestId/);
  assert.match(captureScript, /rememberPendingPublication\(question\.id, pending\)/);
  assert.match(captureScript, /completePendingPublication\(question\.id, published\.id, pending\.editToken\)/);
  assert.match(captureScript, /公开发布失败：[\s\S]*题目仍在当前浏览器，可以重新发布/);
  assert.match(captureScript, /button\('重新发布', 'retry-public'/);
  assert.match(captureScript, /'从公开题库撤回并删除'/);
  assert.doesNotMatch(captureScript, /window\.open\(|issues\/new|Issue #|公开题 #/);
  assert.match(tokenCore, /pending:/);
  assert.match(tokenCore, /completePendingQuestionPublication/);
  assert.match(workflow, /QUESTIONS_API_URL: \$\{\{ vars\.QUESTIONS_API_URL \}\}/);
  assert.match(workflow, /node scripts\/build-question-config\.mjs/);
});

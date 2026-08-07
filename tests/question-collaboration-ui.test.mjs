import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const importCore = () => import('../docs/assets/js/question-collaboration-core.mjs');

const fieldSection = (form, id) => {
  const section = form
    .split(/\n(?=  - type:)/)
    .find((block) => new RegExp(`\\n    id: ${id}\\b`).test(`\n${block}`));
  assert.ok(section, `Issue Form 缺少 ${id} 字段`);
  return section;
};

const assertNoCredentialField = (source) => {
  assert.doesNotMatch(source, /^\s+id:\s*(?:token|password|secret|pat|api_key|access_token)\b/im);
  assert.doesNotMatch(source, /<(?:input|textarea)[^>]+name=["'][^"']*(?:token|password|secret|pat)[^"']*["']/i);
  assert.doesNotMatch(source, /type:\s*password\b/i);
};

test('评论实现保留但站点默认关闭，题目页只在开关开启时渲染评论区', async () => {
  const [layout, defaultLayout, script, settings, cms] = await Promise.all([
    read('../docs/_layouts/question.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/question-comments.js'),
    read('../docs/_data/settings.yml'),
    read('../.pages.yml'),
  ]);

  assert.match(layout, /data-question-comments/);
  assert.match(layout, /\{%\s*if comments_enabled\s*%\}[\s\S]*<section id="question-comments"/);
  assert.match(layout, /comments_enabled == nil\s*%\}\{% assign comments_enabled = false/);
  assert.match(layout, /data-question-slug="{{\s*page\.slug\s*\|\s*escape\s*}}"/);
  assert.match(layout, /data-comments-api="{{\s*comments_api_url\s*\|\s*escape\s*}}"/);
  assert.match(layout, /question-answer[\s\S]*data-question-comments/);
  assert.match(layout, /data-question-comments-jump[^>]+href="#question-comments"/);
  assert.match(layout, /data-comment-form[\s\S]*data-comment-nickname[\s\S]*data-comment-body/);
  assert.match(layout, /data-comment-list-region[\s\S]*data-comment-list/);
  assert.match(layout, /无需注册 · 原地交流/);
  assert.match(layout, /不需要 GitHub 账号/);
  assert.match(layout, /assets\/js\/question-comments\.js/);
  assert.doesNotMatch(layout, /utteranc|data-comment-issue-term|登录 GitHub/);
  assert.doesNotMatch(layout, /issues\/new\?template=question-comment/);
  assert.match(settings, /^comments_enabled:\s*false$/m);
  assert.match(cms, /name:\s*comments_enabled[\s\S]*type:\s*boolean/);
  assert.match(cms, /name:\s*comments_enabled[\s\S]*default:\s*false/);

  assert.match(script, /buildCommentsUrl/);
  assert.match(script, /turnstile\.render|state\.turnstile\.render/);
  assert.match(script, /textContent = comment\.body/);
  assert.match(script, /reportComment/);
  assert.match(script, /replyTo/);
  assert.match(script, /editToken/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /api\.github\.com|utteranc/i);

  const csp = defaultLayout.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
  assert.match(csp, /frame-src \{% if comments_enabled and comments_api_url != empty %\}https:\/\/challenges\.cloudflare\.com\{% else %\}'none'/);
  assert.match(csp, /connect-src 'self' https:\/\/api\.github\.com https:\/\/cdn\.jsdelivr\.net\{% if comments_enabled and comments_api_url != empty %\} {{ comments_api_url \| escape }}/);
  assert.doesNotMatch(csp, /utteranc\.es|frame-src https:;|connect-src[^;]+\shttps:\s/);
});

test('公开 Issue 直接显示为统一题库卡片，站点没有审核分区', async () => {
  const [home, layout, script, manage] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/public-questions.js'),
    read('../docs/manage.md'),
  ]);
  const navigation = `${home}\n${layout}`;

  const listStart = home.indexOf('<div id="question-list"');
  const listEnd = home.indexOf('<div class="library-results-bar">', listStart);
  assert.ok(listStart >= 0 && listEnd > listStart, '首页应有统一 #question-list');
  const questionList = home.slice(listStart, listEnd);

  assert.equal(home.match(/id="question-list"/g)?.length, 1);
  assert.match(home, /data-public-questions/);
  assert.match(questionList, /data-public-questions-list/);
  assert.match(questionList, /data-local-questions-list/);
  assert.match(questionList, /<a class="question-card"/);
  assert.match(home, /直接出现在这里，不需要审核/);
  assert.doesNotMatch(home, /访客公开补充|正式收录|待审核|审核通过/);
  assert.match(home, /data-repository-nwo="{{\s*site\.github\.repository_nwo\s*\|\s*escape\s*}}"/);
  assert.match(layout, /page\.url == '\/'[\s\S]*assets\/js\/public-questions\.js/);
  assert.doesNotMatch(
    layout,
    /\{%\s*if page\.url == '\/manage\/'\s*%\}<script[^>]+assets\/js\/public-questions\.js/,
  );
  assert.doesNotMatch(navigation, /href="{{\s*['"]\/community\//);
  assert.doesNotMatch(layout, />\s*(?:面经)?社区\s*</);

  assert.doesNotMatch(manage, /id="public-question-review"|data-public-questions-view="manage"/);
  assert.match(manage, /公开题自动发布/);
  assert.match(manage, /不需要站主查重、批准或再次收录/);
  assert.match(manage, /管理公开题/);

  assert.match(script, /buildPublicQuestionsApiUrl/);
  assert.match(script, /normalizePublicQuestions/);
  assert.match(script, /\bfetch\s*\(/);
  assert.match(script, /response\.ok/);
  assert.match(script, /createElement\(/);
  assert.match(script, /\.textContent\s*=/);
  assert.match(script, /replaceChildren\(/);
  assert.match(script, /window\.addEventListener\('focus'/);
  assert.match(script, /document\.addEventListener\('visibilitychange'/);
  assert.match(script, /makeElement\('a', 'question-card question-card-public'\)/);
  assert.match(script, /question-visibility-public', '公开'/);
  assert.match(script, /直接发布的公开题目/);
  assert.doesNotMatch(script, /待处理|审核|正式收录/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /\bAuthorization\b|localStorage|sessionStorage/i);
});

test('公开题 API 只接收带标签、勾选公开确认且仍为 open 的 Issue', async () => {
  const {
    buildPublicQuestionsApiUrl,
    normalizePublicQuestions,
    PUBLIC_QUESTIONS_TIMEOUT_MS,
  } = await importCore();
  const url = new URL(buildPublicQuestionsApiUrl('example-owner/example-repo', 20, 2));

  assert.equal(url.origin, 'https://api.github.com');
  assert.equal(url.pathname, '/repos/example-owner/example-repo/issues');
  assert.equal(url.searchParams.get('state'), 'open');
  assert.equal(url.searchParams.get('labels'), 'public-question');
  assert.equal(url.searchParams.get('per_page'), '20');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(PUBLIC_QUESTIONS_TIMEOUT_MS, 15_000);
  assert.equal(new URL(buildPublicQuestionsApiUrl('owner/repo', 100, 1, 'all')).searchParams.get('state'), 'all');
  assert.throws(() => buildPublicQuestionsApiUrl('owner/repo', 30, 1, 'closed'), /open 或 all/);

  const payload = [
    {
      number: 31,
      title: '[新增题目] 为什么 KV Cache 能加速推理？',
      labels: [{ name: 'public-question' }],
      user: { login: 'alice' },
      comments: 3,
      state: 'open',
      created_at: '2026-07-22T08:00:00Z',
      updated_at: '2026-07-22T09:00:00Z',
      html_url: 'https://attacker.example/issues/31',
      body: [
        '### 已从网站带入的题目内容',
        '',
        '题目：为什么 KV Cache 能加速推理？',
        '站内题目编号：local-question-31',
        '可见性：公开',
        '答案状态：已完成',
        '分类：LLM 基础',
        '难度：中等',
        '标签：推理、缓存',
        '',
        '参考答案 / 当前思路：',
        '缓存历史 token 的 K/V，避免每步重复计算。<script>只能作为文本</script>',
        '',
        '追问记录（每行一条）：',
        '缓存何时失效？',
        '',
        '### 最终公开确认',
        '',
        '- [x] 我确认公开',
      ].join('\n'),
    },
    {
      number: 32,
      title: '带相同标签的 PR',
      labels: [{ name: 'public-question' }],
      pull_request: { url: 'https://api.github.com/repos/example-owner/example-repo/pulls/32' },
    },
    {
      number: 33,
      title: '[新增题目] 只有标题像投稿',
      labels: [{ name: 'enhancement' }],
      state: 'open',
      body: '### 公开确认\n\n- [x] 我确认公开',
    },
    {
      number: 34,
      title: '[新增题目] 没有勾选公开确认',
      labels: [{ name: 'public-question' }],
      state: 'open',
      body: '### 公开确认\n\n- [ ] 我确认公开',
    },
    {
      number: 35,
      title: '[新增题目] 已关闭的公开题',
      labels: [{ name: 'public-question' }],
      state: 'closed',
      body: '### 公开确认\n\n- [x] 我确认公开',
    },
  ];

  const questions = normalizePublicQuestions(payload, 'example-owner/example-repo');
  assert.equal(questions.length, 1);
  assert.equal(questions[0].number, 31);
  // 页面只显示题目本身，不把 GitHub 工作流前缀暴露给普通读者。
  assert.equal(questions[0].title, '为什么 KV Cache 能加速推理？');
  assert.equal(questions[0].author, 'alice');
  assert.equal(questions[0].comments, 3);
  assert.equal(questions[0].category, 'LLM 基础');
  assert.equal(questions[0].difficulty, '中等');
  assert.equal(questions[0].answerStatus, 'complete');
  assert.equal(questions[0].followUps[0], '缓存何时失效？');
  assert.deepEqual(questions[0].tags, ['推理', '缓存']);
  assert.equal(questions[0].localId, 'local-question-31');
  assert.equal(questions[0].url, 'https://github.com/example-owner/example-repo/issues/31');
  assert.equal(Object.hasOwn(questions[0], 'body'), false);
  const publicScript = await read('../docs/assets/js/public-questions.js');
  assert.doesNotMatch(publicScript, /已整理/);
});

test('公开表单直接发布并携带本机 ID，工作流不再按标题自动贴标签', async () => {
  const [questionForm, prefilledForm, workflow, captureScript] = await Promise.all([
    read('../.github/ISSUE_TEMPLATE/public-question.yml'),
    read('../.github/ISSUE_TEMPLATE/public-question-from-web.yml'),
    read('../.github/workflows/question-collaboration.yml'),
    read('../docs/assets/js/question-capture.js'),
  ]);

  assert.match(questionForm, /title:\s*["']?\[新增题目\]/);
  assert.match(questionForm, /labels:\s*\[["']public-question["']\]/);
  assert.match(fieldSection(questionForm, 'question'), /required:\s*true/);
  assert.doesNotMatch(fieldSection(questionForm, 'answer'), /required:\s*true/);
  assert.match(fieldSection(questionForm, 'category'), /- type:\s*dropdown/);
  assert.match(fieldSection(questionForm, 'difficulty'), /- type:\s*input/);

  assert.match(questionForm, /立即作为公开题目显示在统一题库中，不经过人工审核/);
  assert.match(fieldSection(questionForm, 'compliance'), /required:\s*true/);
  assert.match(fieldSection(questionForm, 'compliance'), /题目和 GitHub 用户名会公开到统一题库/);
  assertNoCredentialField(questionForm);

  assert.match(prefilledForm, /title:\s*["']?\[新增题目\]/);
  assert.match(prefilledForm, /labels:\s*\[["']public-question["']\]/);
  assert.match(fieldSection(prefilledForm, 'details'), /- type:\s*textarea/);
  assert.match(fieldSection(prefilledForm, 'details'), /required:\s*true/);
  assert.match(prefilledForm, /分类和难度已经由网站带入/);
  assert.match(prefilledForm, /立即作为公开题目显示在统一题库中，不经过人工审核/);
  assert.match(fieldSection(prefilledForm, 'compliance'), /required:\s*true/);
  assert.match(fieldSection(prefilledForm, 'compliance'), /题目和 GitHub 用户名提交后会公开到统一题库/);
  assert.doesNotMatch(prefilledForm, /\bid:\s*(?:category|difficulty)\b/);
  assertNoCredentialField(prefilledForm);

  assert.match(captureScript, /`站内题目编号：\$\{question\.id\}`/);
  assert.match(captureScript, /template: 'public-question-from-web\.yml'/);
  assert.match(captureScript, /params\.set\('details', contributionText\(question, included\)\)/);
  assert.doesNotMatch(captureScript, /\bAuthorization\b|\.innerHTML\b|insertAdjacentHTML/);

  assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /issues:\s*write/);
  assert.match(workflow, /gh label create public-question/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
  assert.match(workflow, /queue:\s*max/);
  assert.doesNotMatch(workflow, /github\.event\.issue\.title|github\.event\.issue\.body/);
  assert.doesNotMatch(workflow, /gh issue edit[^\n]*--add-label|--add-label[^\n]*\[新增题目\]/);
  assert.doesNotMatch(workflow, /gh label create duplicate/);
  assert.doesNotMatch(workflow, /question-comments|\[题目评论\]|gh issue comment/);
});

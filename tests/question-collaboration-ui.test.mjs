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

test('公开补充提交后立即展示，站主管理页提供明确处理入口', async () => {
  const [home, layout, script, manage] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/public-questions.js'),
    read('../docs/manage.md'),
  ]);
  const navigation = `${home}\n${layout}`;

  assert.match(home, /访客公开补充/);
  assert.match(home, /提交后立即公开 · 内容未核验/);
  assert.match(home, /提交后不用等待审核/);
  assert.match(home, /正式题库、搜索、分类统计和模拟面试/);
  assert.match(home, /data-public-questions/);
  assert.ok(home.indexOf('data-public-questions') < home.indexOf('id="question-list-section"'), '公开补充应在正式题库之前出现');
  assert.match(home, /查看 \/ 处理全部补充/);
  assert.match(home, /data-repository-nwo="{{\s*site\.github\.repository_nwo\s*\|\s*escape\s*}}"/);
  assert.match(layout, /page\.url == '\/manage\/'[\s\S]*assets\/js\/public-questions\.js/);
  assert.doesNotMatch(navigation, /href="{{\s*['"]\/community\//);
  assert.doesNotMatch(layout, />\s*(?:面经)?社区\s*</);

  assert.match(manage, /id="public-question-review"/);
  assert.match(manage, /data-public-questions-view="manage"/);
  assert.match(manage, /公开补充在这里处理/);
  assert.match(manage, /提交后会立即显示在首页/);
  assert.match(manage, /is%3Aissue\+is%3Aopen\+label%3Apublic-question/);
  assert.match(manage, /is%3Aissue\+is%3Aclosed\+label%3Apublic-question/);
  assert.match(manage, /自己的题：直接入库/);
  assert.match(manage, /不让所有投稿直接混入正式题库/);

  assert.match(script, /buildPublicQuestionsApiUrl/);
  assert.match(script, /normalizePublicQuestions/);
  assert.match(script, /\bfetch\s*\(/);
  assert.match(script, /response\.ok/);
  assert.match(script, /createElement\(/);
  assert.match(script, /\.textContent\s*=/);
  assert.match(script, /replaceChildren\(/);
  assert.match(script, /window\.addEventListener\('focus'/);
  assert.match(script, /document\.addEventListener\('visibilitychange'/);
  assert.match(script, /查看公开补充/);
  assert.match(script, /打开 Issue 处理/);
  assert.match(script, /目前没有待处理公开补充/);
  assert.doesNotMatch(script, /回答或评论|条评论/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /\bAuthorization\b|localStorage|sessionStorage/i);
});

test('公开题 API 使用不可由投稿者修改的标签过滤，并排除 PR 和普通 Issue', async () => {
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
      body: '### 分类\n\nLLM 基础\n\n<script>不应直接送入卡片 HTML</script>',
    },
    {
      number: 32,
      title: '带相同标签的 PR',
      labels: [{ name: 'public-question' }],
      pull_request: { url: 'https://api.github.com/repos/example-owner/example-repo/pulls/32' },
    },
    {
      number: 33,
      title: '普通维护 Issue',
      labels: [{ name: 'enhancement' }],
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
  assert.equal(questions[0].url, 'https://github.com/example-owner/example-repo/issues/31');
  assert.equal(Object.hasOwn(questions[0], 'body'), false);
  const publicScript = await read('../docs/assets/js/public-questions.js');
  assert.doesNotMatch(publicScript, /已整理/);
});

test('公开补题保留分类下拉，网页已填投稿只需最终确认', async () => {
  const [questionForm, prefilledForm, workflow] = await Promise.all([
    read('../.github/ISSUE_TEMPLATE/public-question.yml'),
    read('../.github/ISSUE_TEMPLATE/public-question-from-web.yml'),
    read('../.github/workflows/question-collaboration.yml'),
  ]);

  assert.match(questionForm, /title:\s*["']?\[新增题目\]/);
  assert.match(questionForm, /labels:\s*\[["']public-question["']\]/);
  assert.match(fieldSection(questionForm, 'question'), /required:\s*true/);
  assert.doesNotMatch(fieldSection(questionForm, 'answer'), /required:\s*true/);
  assert.match(fieldSection(questionForm, 'category'), /- type:\s*dropdown/);
  assert.match(fieldSection(questionForm, 'difficulty'), /- type:\s*input/);

  assert.match(questionForm, /提交后会立即显示在网站的公开补充区/);
  assert.match(fieldSection(questionForm, 'compliance'), /required:\s*true/);
  assertNoCredentialField(questionForm);

  assert.match(prefilledForm, /title:\s*["']?\[新增题目\]/);
  assert.match(prefilledForm, /labels:\s*\[["']public-question["']\]/);
  assert.match(fieldSection(prefilledForm, 'details'), /- type:\s*textarea/);
  assert.match(fieldSection(prefilledForm, 'details'), /required:\s*true/);
  assert.match(prefilledForm, /分类和难度已经由网站带入/);
  assert.match(prefilledForm, /立即显示在网站的公开补充区，不用等待审核/);
  assert.match(fieldSection(prefilledForm, 'compliance'), /required:\s*true/);
  assert.doesNotMatch(prefilledForm, /\bid:\s*(?:category|difficulty)\b/);
  assertNoCredentialField(prefilledForm);

  assert.match(workflow, /issues:\s*\n\s+types:\s*\[opened\]/);
  assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /issues:\s*write/);
  assert.match(workflow, /gh label create public-question/);
  assert.match(workflow, /gh label create duplicate/);
  assert.match(workflow, /gh issue edit "\$ISSUE_NUMBER" --add-label "\$LABEL"/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
  assert.match(workflow, /queue:\s*max/);
  assert.doesNotMatch(workflow, /question-comments|\[题目评论\]|gh issue comment/);
});

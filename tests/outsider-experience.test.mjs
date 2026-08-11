import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseWorkerRoot, workerRootsMatch } from '../docs/assets/js/setup-check-core.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('配置自检要求公开题与评论复用同一个 Worker 根网址', () => {
  assert.equal(workerRootsMatch(
    'https://service.example.workers.dev',
    'https://service.example.workers.dev/',
  ), true);
  assert.equal(workerRootsMatch(
    'https://questions.example.workers.dev',
    'https://comments.example.workers.dev',
  ), false);
  assert.equal(parseWorkerRoot('https://service.example.workers.dev/').pathname, '/');
  assert.throws(() => parseWorkerRoot('https://service.example.workers.dev/v1'), /根网址/);
  assert.throws(() => parseWorkerRoot('http://service.example.workers.dev/'), /HTTPS/);
});

test('创建入口会区分当前模板、基础模板和 Fork 当前题库', async () => {
  const [start, home, script] = await Promise.all([
    read('../docs/start.md'),
    read('../docs/index.html'),
    read('../docs/assets/js/search.js'),
  ]);

  assert.match(start, /data-template-repository=/);
  assert.match(start, /\/fork/);
  assert.match(start, /模板用于建立完全独立的个人题库/);
  assert.match(home, /复制成我的题库/);
  assert.match(script, /current\.is_template/);
  assert.match(script, /current\.template_repository/);
  assert.match(script, /current\.parent/);
  assert.match(script, /不含本站新增内容/);
});

test('Pages CMS 提供手动检查按钮，工作流接受 CMS payload', async () => {
  const [cms, workflow] = await Promise.all([
    read('../.pages.yml'),
    read('../.github/workflows/pages.yml'),
  ]);

  assert.match(cms, /name: validate-and-publish/);
  assert.match(cms, /workflow: pages\.yml/);
  assert.match(workflow, /workflow_dispatch:\s*\n\s+inputs:\s*\n\s+payload:/);
  assert.match(workflow, /ALLOW_PRIVATE_PAGES_DEPLOYMENT/);
  assert.match(workflow, /github\.event\.repository\.default_branch/);
  assert.match(workflow, /github\.ref_type == 'branch'/);
  assert.doesNotMatch(workflow, /vars\.ENABLE_PAGES/);
});

test('任何使用者都能在网页只填问题并直接选择公开或私人', async () => {
  const [page, script] = await Promise.all([
    read('../docs/capture.html'),
    read('../docs/assets/js/question-capture.js'),
  ]);
  const answerField = page.match(/<textarea[^>]+id="question-answer"[\s\S]*?<\/textarea>/)?.[0] || '';

  assert.match(page, /答案和追问都可以留空/);
  assert.match(page, /value="private"/);
  assert.match(page, /value="public"/);
  assert.doesNotMatch(answerField, /\brequired\b/);
  assert.match(script, /method: 'POST'/);
  assert.doesNotMatch(script, /api\.github\.com|issues\/new|Issue #/);
});

test('公开内容页提供分享、复制链接和反馈入口', async () => {
  const [question, experience, script] = await Promise.all([
    read('../docs/_layouts/question.html'),
    read('../docs/_layouts/experience.html'),
    read('../docs/assets/js/share.js'),
  ]);

  [question, experience].forEach((layout) => {
    assert.match(layout, /data-share-controls/);
    assert.match(layout, /data-copy-page-link/);
    assert.doesNotMatch(layout, /content-utility-status sr-only/);
    assert.match(layout, /issues\/new\?template=bug\.yml/);
  });
  assert.match(script, /navigator\.share/);
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /document\.execCommand\('copy'\)/);
  assert.doesNotMatch(script, /aria-hidden/);
  assert.match(experience, /security\/policy/);
  assert.match(experience, /反馈内容错误/);
});

test('公开发布在站内完成并提示隐私边界，不再提供题目 Issue 表单', async () => {
  const [forms, capture, privacy] = await Promise.all([
    Promise.all([
    read('../.github/ISSUE_TEMPLATE/bug.yml'),
    read('../.github/ISSUE_TEMPLATE/feature.yml'),
    ]),
    read('../docs/capture.html'),
    read('../docs/privacy.md'),
  ]);

  forms.forEach((form) => {
    assert.match(form, /提交后[\s\S]{0,100}公开/);
    assert.match(form, /Security/);
  });
  await assert.rejects(read('../.github/ISSUE_TEMPLATE/public-question.yml'), /ENOENT/);
  await assert.rejects(read('../.github/ISSUE_TEMPLATE/public-question-from-web.yml'), /ENOENT/);
  assert.match(capture, /保存成功后立即进入共享题库，所有人都能看到/);
  assert.match(privacy, /公开题/);
  assert.doesNotMatch(capture, /Issue|待审核|审核队列|正式收录|公开补充/);
});

test('隐私说明准确描述浏览器存储而不是账号级私有', async () => {
  const [privacy, readme] = await Promise.all([
    read('../docs/privacy.md'),
    read('../README.md'),
  ]);

  assert.match(privacy, /同一个 `username\.github\.io` 域名下的其他项目/);
  assert.match(privacy, /未加密明文文件/);
  assert.match(privacy, /Installed GitHub Apps/);
  assert.match(readme, /不是账号隔离、加密或云同步/);
});

test('公开页面源码不绑定维护者用户名或生产域名', async () => {
  const files = await Promise.all([
    read('../docs/_layouts/default.html'),
    read('../docs/index.html'),
    read('../docs/start.md'),
    read('../docs/manage.md'),
    read('../docs/assets/js/search.js'),
    read('../.pages.yml'),
  ]);
  const source = files.join('\n').toLowerCase();

  assert.doesNotMatch(source, /https?:\/\/github\.com\/(?!apps(?:\/|$))[a-z0-9_.-]+\/[a-z0-9_.-]+/i);
  assert.doesNotMatch(source, /https?:\/\/[a-z0-9_.-]+\.github\.io\/[a-z0-9_.-]+/i);
});

test('公开仓库配置自检不收集 Token，并提供可执行修复入口', async () => {
  const [page, script] = await Promise.all([
    read('../docs/setup-check.md'),
    read('../docs/assets/js/setup-check.js'),
  ]);

  assert.match(page, /无需 Token/);
  assert.doesNotMatch(page, /type="password"/);
  assert.match(script, /api\.github\.com\/repos/);
  assert.match(script, /repo\.has_pages/);
  assert.match(script, /repo\.default_branch/);
  assert.match(script, /actions\/workflows\/pages\.yml/);
  assert.match(script, /inspectQuestions/);
  assert.match(script, /questionsWriteEnabled/);
  assert.match(script, /\/v1\/questions\?cursor=0&limit=1/);
  assert.match(script, /Array\.isArray\(questionsPage\?\.questions\)/);
  assert.match(script, /QUESTIONS_API_URL/);
  assert.doesNotMatch(script, /repo\.has_issues|question-collaboration\.yml/);
  assert.match(script, /settings\/pages/);
  assert.match(script, /workflowResponse\.status === 403/);
  assert.match(script, /workflowResponse\.status === 404/);
  assert.match(script, /\['push', 'workflow_dispatch'\]\.includes\(run\.event\)/);
  assert.match(script, /run\.head_branch === repo\.default_branch/);
  assert.match(script, /打开推测网站地址/);
  assert.match(script, /safeHttpUrl\(repo\.homepage\)/);
});

test('统一题库不依赖静态题目数量，始终接纳公开题和私人题', async () => {
  const home = await read('../docs/index.html');
  assert.match(home, /id="question-list-section"[\s\S]*data-local-questions[\s\S]*data-public-questions/);
  assert.match(home, /一个题库 · 两种可见性/);
  assert.match(home, /公开题所有人都能看到[\s\S]*“私人”的题只保存在当前浏览器/);
  assert.match(home, /data-local-questions-list/);
  assert.match(home, /data-public-questions-list/);
  assert.doesNotMatch(home, /还没有发布题目/);
  assert.match(home, /＋ 增加题目/);
  assert.match(home, /href="{{ '\/capture\/' \| relative_url }}"/);
});

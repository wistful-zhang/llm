import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const between = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `找不到代码区段：${startMarker}`);
  return source.slice(start, end);
};

test('面试记录页提供逐行题目速记与准确的本地存储提示', async () => {
  const page = await read('../docs/interviews.html');

  assert.match(page, /id="interview-questions"\s+name="questions"/);
  assert.match(page, /每行一道，最多 20 道，每道不超过 160 字/);
  assert.match(page, /<legend>分享计划<\/legend>/);
  assert.match(page, /仅当前浏览器/);
  assert.match(page, /准备匿名分享/);
  assert.match(page, /同一 github\.io 域名下的其他项目页面/);
  assert.match(page, /同一浏览器资料的用户/);
  assert.doesNotMatch(page, /面试经历可见性|<strong>仅自己<\/strong>|<strong>可整理公开<\/strong>/);
});

test('题目批量整理必须由用户主动复制，公开预览也只在主动打开后带入题目', async () => {
  const script = await read('../docs/assets/js/interview-tracker.js');

  assert.match(script, /'copy-questions'/);
  assert.match(script, /buildQuestionBatchDraft\(view\)/);
  assert.match(script, /round\.questions\.forEach/);
  assert.match(script, /openPublicationPanel[\s\S]*buildPublicExperienceDraft\(view, \{ includeQuestions: true \}\)/);
  assert.match(script, /makeElement\('pre', 'interview-publication-preview'\)/);
  assert.doesNotMatch(script, /makeElement\('pre', 'interview-publication-preview', buildPublicExperienceDraft/);
  assert.match(script, /仍未上传或发布/);
});

test('加入本机题目必须由用户显式触发，并提供后续整理入口', async () => {
  const [page, script] = await Promise.all([
    read('../docs/interviews.html'),
    read('../docs/assets/js/interview-tracker.js'),
  ]);

  assert.match(script, /`加入本机题目（\$\{questionCount\}）`[\s\S]*?'save-questions-locally'/);
  assert.match(script, /if \(action === 'save-questions-locally'\) saveQuestionBatchLocally\(applicationId\)/);
  assert.match(script, /“加入本机题目”只复制题目文字/);
  assert.match(page, /题目不会自动进入题库或上传 GitHub/);
  assert.match(page, /可以在流程卡片中点击“加入本机题目”/);
  assert.match(page, /href="{{ '\/capture\/' \| relative_url }}">直接在网页记题<\/a>/);
  assert.match(page, /href="{{ '\/capture\/' \| relative_url }}">打开本机题目<\/a>/);
});

test('从面试记录生成的草稿只额外带题目字段，不复制公司、岗位、来源或复盘字段', async () => {
  const script = await read('../docs/assets/js/interview-tracker.js');
  const saveBlock = between(
    script,
    'const saveQuestionBatchLocally = (applicationId) => {',
    'const showSaveSuccess = (message) => {',
  );

  assert.match(saveBlock, /const questionTitles = view\.rounds\.flatMap\(\(round\) => round\.questions\)/);
  assert.match(saveBlock, /addQuestionDraft\(next, \{\s*title,\s*answer: '',\s*answerStatus: 'pending',\s*category: '待整理',\s*difficulty: '待评估',\s*tags: \[\],\s*source: '',\s*\}/);
  assert.doesNotMatch(saveBlock, /view\.company|view\.application\.(?:role|source)|round\.reflection/);
  assert.match(script, /只复制题目文字，不额外带入公司、岗位、来源或复盘等流程字段/);
  assert.match(script, /请仍检查题目原文是否含敏感信息/);
});

test('面试题目与快速记题页共用按仓库隔离的 storage key 和严格数据格式', async () => {
  const [page, script] = await Promise.all([
    read('../docs/interviews.html'),
    read('../docs/assets/js/interview-tracker.js'),
  ]);

  assert.match(page, /data-question-repository-id="{{ site\.github\.repository_nwo \| default: 'local\/llm-interview-notes' \| escape }}"/);
  assert.match(script, /const questionRepositoryId = root\.dataset\.questionRepositoryId \|\| 'local\/llm-interview-notes'/);
  assert.match(script, /const questionStorageKey = questionDraftsStorageKey\(questionRepositoryId\)/);
  assert.match(script, /storage\.getItem\(questionStorageKey\)/);
  assert.match(script, /parseQuestionDraftsJson\(originalRaw, \{ repositoryId: questionRepositoryId \}\)/);
  assert.match(script, /serializeQuestionDrafts\(next, \{ repositoryId: questionRepositoryId \}\)/);
  assert.match(script, /localDate: localDate\(\)/);
  assert.match(script, /storage\.setItem\(\s*questionStorageKey,/);
});

test('写入前再次读取并拒绝并发覆盖，读取或写入失败会给出可执行提示', async () => {
  const script = await read('../docs/assets/js/interview-tracker.js');
  const source = between(
    script,
    'const saveQuestionBatchLocally = (applicationId) => {',
    'const showSaveSuccess = (message) => {',
  );

  const initialRead = source.indexOf('originalRaw = storage.getItem(questionStorageKey)');
  const latestRead = source.indexOf('const latestRaw = storage.getItem(questionStorageKey)');
  const conflictCheck = source.indexOf('if (latestRaw !== originalRaw)');
  const write = source.indexOf('storage.setItem(');
  assert.ok(initialRead >= 0 && latestRead > initialRead, '写入前应重新读取当前 storage');
  assert.ok(conflictCheck > latestRead && write > conflictCheck, '必须先检查并发变化再写入');

  assert.match(source, /另一个页面刚刚更新了本机题目，本次没有写入/);
  assert.match(source, /本机题目数据无法读取，已停止写入以免覆盖原数据/);
  assert.match(source, /浏览器不允许读取本机题目，未添加任何内容/);
  assert.match(source, /浏览器保存空间不足或已禁用站点存储，本次没有加入题目/);
  assert.match(source, /本机题目已达到 500 道上限/);
  assert.match(source, /本机题目没有改变，也没有上传 GitHub/);
});

test('成功加入只代表保存到浏览器，明确提示仍未上传 GitHub', async () => {
  const script = await read('../docs/assets/js/interview-tracker.js');

  assert.match(script, /已加入 \$\{added\} 道本机题目[\s\S]*只保存到当前浏览器，仍未上传 GitHub/);
  assert.match(script, /announce\(`已加入 \$\{added\} 道本机题目，仍未上传 GitHub。`\)/);
  assert.match(script, /跳过\$\{skipped\.join\('、'\)\}/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|\bAuthorization\b/);
});

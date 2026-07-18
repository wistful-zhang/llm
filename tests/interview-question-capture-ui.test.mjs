import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

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

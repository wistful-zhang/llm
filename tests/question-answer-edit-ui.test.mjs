import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('题目页把当前文件直接交给 Pages CMS 可视化编辑，不要求寻找源码', async () => {
  const [layout, cms, manage] = await Promise.all([
    read('../docs/_layouts/question.html'),
    read('../.pages.yml'),
    read('../docs/manage.md'),
  ]);

  assert.match(layout, /cms_branch = site\.github\.source\.branch \| default: 'main'/);
  assert.match(layout, /cms_question_path %}docs\/{{\s*page\.path\s*}}/);
  assert.match(
    layout,
    /https:\/\/app\.pagescms\.org\/{{\s*site\.github\.repository_nwo\s*}}\/{{\s*cms_branch\s*\|\s*url_encode\s*}}\/collection\/questions\/edit\/{{\s*cms_question_path\s*\|\s*strip\s*\|\s*url_encode\s*}}/,
  );
  assert.match(layout, /question-answer[\s\S]*answer-edit-bar/);
  assert.match(layout, /题库主人：修改答案/);
  assert.match(layout, /题库主人：直接补答案/);
  assert.match(layout, /其他人：提出修改建议/);
  assert.match(layout, /page\.verified == true[\s\S]*修改正文时请先在表单关闭核验开关/);
  assert.match(layout, /data-copy-controls hidden>[\s\S]*?<\/div>\s*<div class="unanswered-actions unanswered-permanent-actions">[\s\S]*题库主人：直接补答案/);
  assert.equal((layout.match(/data-cms-edit-answer/g) || []).length, 4);
  assert.equal((layout.match(/data-cms-question-list/g) || []).length, 2);
  assert.match(layout, /data-cms-edit-answer[^>]+target="_blank"[^>]+rel="noopener noreferrer"/);
  assert.match(layout, /cms_questions_url %}https:\/\/app\.pagescms\.org\/[\s\S]*\/collection\/questions/);
  assert.doesNotMatch(layout, /github\.com[^"']+\/edit\//);
  assert.doesNotMatch(layout, /(?:password|access[_ -]?token|personal access token|PAT)["']?\s*[:=]/i);

  assert.match(cms, /name:\s*body[\s\S]*label:\s*答案正文（待解答时可以留空）[\s\S]*type:\s*rich-text/);
  assert.match(cms, /name:\s*answer_status[\s\S]*待解答（只显示问题）[\s\S]*已完成（显示答案并进入模拟）/);
  assert.match(cms, /name:\s*body[\s\S]*name:\s*verified[\s\S]*修改过答案？请重新确认资料核验状态[\s\S]*type:\s*boolean[\s\S]*修改答案正文时请先关闭/);
  assert.match(manage, /题目阅读页[\s\S]*题库主人：修改答案/);
});

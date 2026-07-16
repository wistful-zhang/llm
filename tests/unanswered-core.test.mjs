import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAnswerPrompt,
  normalizeQuestionTitle,
} from '../docs/assets/js/unanswered-core.mjs';

test('清理题目中的多余空白', () => {
  assert.equal(normalizeQuestionTitle('  为什么   KV Cache 能加速？\n'), '为什么 KV Cache 能加速？');
});

test('补答指令包含题目、结构要求与真实性约束', () => {
  const prompt = buildAnswerPrompt('为什么 KV Cache 能加速？');

  assert.match(prompt, /《为什么 KV Cache 能加速？》/);
  assert.match(prompt, /80～240 字/);
  assert.match(prompt, /不编造公司.*项目经历或指标/);
  assert.match(prompt, /answer_status 改为 complete/);
  assert.match(prompt, /未完成则保持 pending/);
  assert.match(prompt, /至少 3 个/);
  assert.match(prompt, /同步到 GitHub/);
  assert.match(prompt, /GitHub 已完成身份验证/);
  assert.match(prompt, /远端仓库允许写入/);
  assert.match(prompt, /否则只完成本地修改/);
});

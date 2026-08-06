import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { findDuplicateQuestionSlugErrors } from '../scripts/validate-content.mjs';

test('不同子目录下同名 .md 和 .markdown 会触发全局 slug 冲突', () => {
  const first = join('foundation', 'same-question.md');
  const second = join('rag', 'same-question.markdown');
  const errors = findDuplicateQuestionSlugErrors([first, second]);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /same-question/);
  assert.ok(errors[0].includes(first));
  assert.ok(errors[0].includes(second));
  assert.match(errors[0], /permalink 使用 :name/);
  assert.match(errors[0], /所有子目录中全局唯一/);
});

test('目录不同但文件名 slug 不同不会误报', () => {
  const errors = findDuplicateQuestionSlugErrors([
    join('foundation', 'self-attention.md'),
    join('rag', 'retrieval-evaluation.markdown'),
    join('agent', 'tool-calling.md'),
  ]);

  assert.deepEqual(errors, []);
});

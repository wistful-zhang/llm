import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANSWER_STATUSES,
  getEffectiveAnswerStatus,
  getPublicationState,
  hasCompleteAnswer,
  hasMeaningfulAnswer,
} from '../scripts/publication-state.mjs';

test('空白、注释和空段落都视为没有答案', () => {
  assert.equal(hasMeaningfulAnswer(''), false);
  assert.equal(hasMeaningfulAnswer('  \n'), false);
  assert.equal(hasMeaningfulAnswer('<!-- 稍后补 -->'), false);
  assert.equal(hasMeaningfulAnswer('<p><br></p>'), false);
  assert.equal(hasMeaningfulAnswer('## 核心回答\n\n内容'), true);
});

test('显式答案状态优先，缺省状态按正文向后兼容', () => {
  assert.equal(getEffectiveAnswerStatus({ answerStatus: 'pending', body: '已有半成品正文' }), ANSWER_STATUSES.pending);
  assert.equal(getEffectiveAnswerStatus({ answerStatus: 'complete', body: '' }), ANSWER_STATUSES.complete);
  assert.equal(getEffectiveAnswerStatus({ body: '旧题目的完整正文' }), ANSWER_STATUSES.complete);
  assert.equal(getEffectiveAnswerStatus({ body: '' }), ANSWER_STATUSES.pending);
  assert.equal(getEffectiveAnswerStatus({ answerStatus: 'unknown', body: '正文' }), null);
});

test('complete 只有同时包含有效正文时才算可展示答案', () => {
  assert.equal(hasCompleteAnswer({ answerStatus: 'complete', body: '## 核心回答\n\n内容' }), true);
  assert.equal(hasCompleteAnswer({ answerStatus: 'complete', body: '<p><br></p>' }), false);
  assert.equal(hasCompleteAnswer({ answerStatus: 'pending', body: '半成品正文' }), false);
  assert.equal(hasCompleteAnswer({ body: '旧题目的完整正文' }), true);
});

test('公开状态只在有效 complete 答案上显示 answered 或 verified', () => {
  assert.equal(getPublicationState({ published: false, verified: false, body: '' }), 'draft');
  assert.equal(getPublicationState({ published: true, verified: false, body: '' }), 'question-only');
  assert.equal(getPublicationState({ published: true, verified: false, body: '答案' }), 'answered');
  assert.equal(getPublicationState({ published: true, verified: true, body: '答案' }), 'verified');
  assert.equal(getPublicationState({ published: true, verified: false, answerStatus: 'pending', body: '半成品' }), 'question-only');
  assert.equal(getPublicationState({ published: true, verified: true, answerStatus: 'pending', body: '半成品' }), 'question-only');
  assert.equal(getPublicationState({ published: true, verified: true, answerStatus: 'complete', body: '' }), 'question-only');
  assert.equal(getPublicationState({ published: true, verified: false, answerStatus: 'invalid', body: '正文' }), 'invalid');
});

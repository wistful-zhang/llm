import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANSWER_MARKER,
  hasDirectorLanguage,
  hasValidSpokenAnswerLength,
  parseAnswerGuide,
} from '../scripts/answer-guide-style.mjs';

test('只把“可以这样答”之后的引用当作参考口述', () => {
  const parsed = parseAnswerGuide(`提示里的例子：\n\n> 这不是口述答案。\n\n${ANSWER_MARKER}\n\n> 这是正式参考口述。`);

  assert.equal(parsed.markerCount, 1);
  assert.equal(parsed.spokenAnswer, '这是正式参考口述。');
  assert.equal(parsed.guidanceText, '提示里的例子：');
});

test('marker 缺失或重复时能被调用方识别', () => {
  assert.equal(parseAnswerGuide('> marker 前的引用').markerCount, 0);
  assert.equal(parseAnswerGuide('> marker 前的引用').spokenAnswer, '');
  assert.equal(parseAnswerGuide(`${ANSWER_MARKER}\n> 一\n${ANSWER_MARKER}\n> 二`).markerCount, 2);
});

test('参考口述长度包含上下边界', () => {
  assert.equal(hasValidSpokenAnswerLength('答'.repeat(79)), false);
  assert.equal(hasValidSpokenAnswerLength('答'.repeat(80)), true);
  assert.equal(hasValidSpokenAnswerLength('答'.repeat(240)), true);
  assert.equal(hasValidSpokenAnswerLength('答'.repeat(241)), false);
});

test('拦截导演式停顿话术，但允许语音题讨论静音停顿', () => {
  assert.equal(hasDirectorLanguage('这里停顿，再等面试官追问。'), true);
  assert.equal(hasDirectorLanguage('VAD 把超过 500ms 的静音停顿视为分段边界。'), false);
});

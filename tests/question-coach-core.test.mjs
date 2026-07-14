import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_ANSWER_SECONDS,
  formatCountdown,
} from '../docs/assets/js/question-coach-core.mjs';

test('默认口述时间为 60 秒', () => {
  assert.equal(DEFAULT_ANSWER_SECONDS, 60);
  assert.equal(formatCountdown(DEFAULT_ANSWER_SECONDS), '01:00');
});

test('倒计时格式支持分钟并清理非法值', () => {
  assert.equal(formatCountdown(125), '02:05');
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(-3), '00:00');
  assert.equal(formatCountdown(Number.NaN), '00:00');
});

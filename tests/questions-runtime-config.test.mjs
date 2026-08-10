import assert from 'node:assert/strict';
import test from 'node:test';

import {
  renderQuestionsRuntimeConfig,
  validateQuestionsApiUrl,
} from '../scripts/build-question-config.mjs';

test('公开题共享服务只接受 HTTPS 根网址', () => {
  assert.equal(validateQuestionsApiUrl('https://questions.example.com/'), 'https://questions.example.com');
  assert.throws(() => validateQuestionsApiUrl('http://questions.example.com'), /HTTPS/);
  assert.throws(() => validateQuestionsApiUrl('https://user:pass@example.com'), /账号/);
  assert.throws(() => validateQuestionsApiUrl('https://example.com/v1/questions'), /根网址/);
});

test('模板副本默认不继承共享题库地址', () => {
  assert.match(renderQuestionsRuntimeConfig(''), /api_url: ""/);
  assert.match(renderQuestionsRuntimeConfig('https://questions.example.com'), /api_url: "https:\/\/questions\.example\.com"/);
});

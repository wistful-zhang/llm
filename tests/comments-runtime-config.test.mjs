import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderCommentsRuntimeConfig,
  validateCommentsApiUrl,
} from '../scripts/build-comments-config.mjs';

test('构建变量只接受 HTTPS Worker 根网址', () => {
  assert.equal(validateCommentsApiUrl(''), '');
  assert.equal(validateCommentsApiUrl('https://comments.example.com/'), 'https://comments.example.com');
  assert.equal(validateCommentsApiUrl('http://127.0.0.1:8787', { allowLocalhost: true }), 'http://127.0.0.1:8787');
  for (const value of [
    'http://comments.example.com',
    'https://comments.example.com/v1',
    'https://comments.example.com?q=1',
    'https://user:secret@comments.example.com',
    'https://comments.example.com/\nconnect-src https:',
  ]) assert.throws(() => validateCommentsApiUrl(value));
});

test('未配置的模板副本生成空配置，不会继承主站评论数据库', () => {
  assert.match(renderCommentsRuntimeConfig(''), /^#.+\napi_url: ""\n$/);
  const configured = renderCommentsRuntimeConfig('https://comments.example.com');
  assert.match(configured, /api_url: "https:\/\/comments\.example\.com"/);
  assert.doesNotMatch(configured, /token|password|secret|service[_-]?role/i);
});

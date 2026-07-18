import test from 'node:test';
import assert from 'node:assert/strict';

import { findSensitivePublicContent } from '../scripts/public-content-privacy.mjs';

test('畸形百分号不会阻断后续邮箱和会议链接解码', () => {
  const labels = findSensitivePublicContent(
    '普通百分比 95%，畸形编码 %ZZ，联系 person%40example.com，会议 https%3A%2F%2Fzoom.us%2Fj%2F123456。',
  );
  assert.ok(labels.includes('疑似邮箱地址'));
  assert.ok(labels.includes('疑似会议链接'));
});

test('没有分号的 HTML 数字实体仍按浏览器可见文本检查', () => {
  assert.ok(findSensitivePublicContent('联系 person&#64example.com').includes('疑似邮箱地址'));
  assert.ok(findSensitivePublicContent('联系 person&#x40example.com').includes('疑似邮箱地址'));
});

test('普通百分比和不完整编码本身不会被误报成隐私信息', () => {
  assert.deepEqual(findSensitivePublicContent('成功率 95%，这里讨论 URL 编码 %ZZ 和 HTTPS 协议。'), []);
});

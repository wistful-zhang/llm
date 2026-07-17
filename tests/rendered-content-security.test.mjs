import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  extractMarkedArticle,
  hasRenderedQuestionMarker,
  validateRenderedPublicArticleHtml,
} from '../scripts/rendered-content-security.mjs';

const question = (body) => `<main><article class="question-page" data-public-question="true">${body}</article></main>`;

test('只扫描带固定标记的公开文章', () => {
  assert.equal(hasRenderedQuestionMarker(question('<p>安全答案</p>')), true);
  assert.equal(hasRenderedQuestionMarker('<article><script>alert(1)</script></article>'), false);
  assert.match(extractMarkedArticle(question('<p>答案</p>'), 'data-public-question'), /答案/);
});

test('渲染后拒绝脚本元素、事件属性和样式属性', () => {
  assert.ok(validateRenderedPublicArticleHtml(question('<script>alert(1)</script>'), 'q.html').length > 0);
  assert.ok(validateRenderedPublicArticleHtml(question('<img src="x" onerror="alert(1)">'), 'q.html').length > 0);
  assert.ok(validateRenderedPublicArticleHtml(question('<a style="color:red" href="/">链接</a>'), 'q.html').length > 0);
});

test('危险 URL 的实体、百分号和空白混淆也会被拒绝', () => {
  const payloads = [
    '<a href="javascript:alert(1)">x</a>',
    '<a href="java&#x73;cript&#58;alert(1)">x</a>',
    '<a href="%6a%61%76%61%73%63%72%69%70%74%3aalert(1)">x</a>',
    '<a href="java\nscript:alert(1)">x</a>',
    '<img srcset="/safe.png 1x, data:text/html,payload 2x">',
  ];
  payloads.forEach((payload) => {
    assert.ok(validateRenderedPublicArticleHtml(question(payload), 'q.html').some((error) => error.includes('危险 URL')));
  });
});

test('普通站内链接、HTTPS 资料和图片可以通过', () => {
  const html = question('<p><a href="/start/">指南</a><a href="https://example.com/paper">论文</a><img src="/assets/demo.png" alt="示例"></p>');
  assert.deepEqual(validateRenderedPublicArticleHtml(html, 'q.html'), []);
});

test('页面 CSP 允许 MathJax 使用同源 Blob Worker', () => {
  const layout = readFileSync(new URL('../docs/_layouts/default.html', import.meta.url), 'utf8');
  assert.match(layout, /worker-src 'self' blob:/);
});

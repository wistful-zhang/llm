import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildCommentActionUrl,
  buildCommentsUrl,
  createClientSecret,
  normalizeComment,
  normalizeCommentsConfig,
  normalizeCommentsPage,
  validateApiUrl,
  validateCommentDraft,
  validateQuestionSlug,
} from '../docs/assets/js/native-comments-core.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('评论接口只接受没有账号、查询参数或片段的 HTTPS 根网址', () => {
  assert.equal(validateApiUrl('https://comments.example.com').origin, 'https://comments.example.com');
  assert.equal(validateApiUrl('https://demo.workers.dev/').origin, 'https://demo.workers.dev');
  for (const value of [
    '',
    'http://comments.example.com',
    'https://user:pass@comments.example.com',
    'https://comments.example.com/v1',
    'https://comments.example.com/?secret=1',
    'javascript:alert(1)',
  ]) assert.equal(validateApiUrl(value), null);
});

test('评论 URL 编码稳定题目标识并限制分页参数', () => {
  assert.equal(validateQuestionSlug('为什么-kv-cache'), '为什么-kv-cache');
  assert.equal(validateQuestionSlug('../escape'), null);
  const url = buildCommentsUrl('https://comments.example.com/', '为什么-kv-cache', {
    cursor: 12,
    limit: 500,
  });
  assert.equal(url.origin, 'https://comments.example.com');
  assert.equal(decodeURIComponent(url.pathname), '/v1/questions/为什么-kv-cache/comments');
  assert.equal(url.searchParams.get('cursor'), '12');
  assert.equal(url.searchParams.get('limit'), '50');
  assert.equal(
    buildCommentActionUrl('https://comments.example.com', '550e8400-e29b-41d4-a716-446655440000', 'reports').pathname,
    '/v1/comments/550e8400-e29b-41d4-a716-446655440000/reports',
  );
});

test('评论草稿清理控制字符并执行昵称和正文长度限制', () => {
  assert.deepEqual(validateCommentDraft({ nickname: '  小 张  ', body: '  第一行\r\n第二行\u0000  ' }), {
    nickname: '小 张',
    body: '第一行\n第二行',
    errors: [],
  });
  assert.ok(validateCommentDraft({ nickname: 'A', body: '可以' }).errors.length > 0);
  assert.ok(validateCommentDraft({ nickname: '访客', body: 'A'.repeat(2001) }).errors.length > 0);
});

test('后端评论响应只保留纯文本字段、稳定楼层和扁平回复引用', () => {
  const comment = normalizeComment({
    id: '550e8400-e29b-41d4-a716-446655440000',
    floor: 8,
    nickname: '<img onerror=alert(1)>',
    body: '<script>alert(1)</script>',
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt: '2026-08-06T00:01:00.000Z',
    replyTo: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      floor: 3,
      nickname: '前一位',
    },
  });
  assert.equal(comment.floor, 8);
  assert.equal(comment.body, '<script>alert(1)</script>');
  assert.deepEqual(comment.replyTo, {
    id: '550e8400-e29b-41d4-a716-446655440001',
    floor: 3,
    nickname: '前一位',
  });
  assert.deepEqual(normalizeCommentsPage({ comments: [comment], total: 1, nextCursor: null, locked: false }).comments, [comment]);
});

test('本机评论修改凭据使用 256 位随机值且不进入 URL', () => {
  const first = createClientSecret();
  const second = createClientSecret();
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
});

test('只读评论服务无需 Turnstile site key，开放写入时必须提供有效 key', () => {
  assert.deepEqual(normalizeCommentsConfig({
    siteId: 'example-site',
    turnstileSiteKey: '',
    writeEnabled: false,
  }), {
    siteId: 'example-site',
    turnstileSiteKey: '',
    writeEnabled: false,
  });
  assert.throws(() => normalizeCommentsConfig({
    siteId: 'example-site',
    turnstileSiteKey: '',
    writeEnabled: true,
  }), /尚未完成配置/);
});

test('评论实现保留安全 DOM，默认关闭时也不会开放外部连接', async () => {
  const [layout, script, defaultLayout, runtime, manifest] = await Promise.all([
    read('../docs/_layouts/question.html'),
    read('../docs/assets/js/question-comments.js'),
    read('../docs/_layouts/default.html'),
    read('../docs/_data/comment_runtime.yml'),
    read('../docs/comments-manifest.json'),
  ]);
  assert.match(layout, /data-comment-form/);
  assert.match(layout, /data-comment-list/);
  assert.match(layout, /data-comment-reply-context/);
  assert.match(layout, /无需注册 · 原地交流/);
  assert.match(layout, /不需要 GitHub 账号/);
  assert.match(layout, /站内评论尚未开通/);
  assert.doesNotMatch(layout, /utteranc|data-comment-issue-term|登录 GitHub/);
  assert.match(script, /textContent = comment\.body/);
  assert.match(script, /data-comment-report|reportComment/);
  assert.match(script, /comment\.status === 'visible' && state\.writeEnabled/);
  assert.match(script, /if \(!state\.locked\) \{[\s\S]*createButton\('回复'/);
  assert.match(script, /仍可举报，自己发布的内容仍可编辑或删除/);
  assert.match(script, /question-comment-edited[\s\S]*已编辑/);
  assert.match(script, /captchaBusy/);
  assert.match(script, /MAX_SAVED_EDIT_TOKENS = 1000/);
  assert.match(script, /if \(state\.pendingReport\) \{[\s\S]*submitButton\.disabled = true;[\s\S]*reportComment/);
  assert.match(script, /await loadComments\(\{ reset: true \}\);[\s\S]*await configure\(\);/);
  assert.doesNotMatch(script, /\.innerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /api\.github\.com|utteranc|\b(?:password|personal access token|PAT)\b/i);
  assert.doesNotMatch(defaultLayout, /utteranc\.es/);
  assert.match(layout, /comments_enabled == nil\s*%\}\{% assign comments_enabled = false/);
  assert.match(defaultLayout, /assign questions_api_url = site\.data\.question_runtime\.api_url/);
  assert.match(defaultLayout, /if questions_api_url != empty[\s\S]*assign turnstile_enabled = true/);
  assert.match(defaultLayout, /frame-src \{% if turnstile_enabled %\}https:\/\/challenges\.cloudflare\.com/);
  assert.match(defaultLayout, /\{% if questions_api_url != empty %\} \{\{ questions_api_url \| escape \}\}/);
  assert.match(runtime, /^api_url:\s*""$/m);
  assert.match(manifest, /permalink:\s*\/comments-manifest\.json/);
  assert.match(manifest, /site\.questions\s*\|\s*where:\s*'published',\s*true/);
  assert.match(manifest, /question\.slug\s*\|\s*jsonify/);
});

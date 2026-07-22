import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const importCore = () => import('../docs/assets/js/question-collaboration-core.mjs');

const fieldSection = (form, id) => {
  const section = form
    .split(/\n(?=  - type:)/)
    .find((block) => new RegExp(`\\n    id: ${id}\\b`).test(`\n${block}`));
  assert.ok(section, `Issue Form 缺少 ${id} 字段`);
  return section;
};

const assertNoCredentialField = (source) => {
  assert.doesNotMatch(source, /^\s+id:\s*(?:token|password|secret|pat|api_key|access_token)\b/im);
  assert.doesNotMatch(source, /<(?:input|textarea)[^>]+name=["'][^"']*(?:token|password|secret|pat)[^"']*["']/i);
  assert.doesNotMatch(source, /type:\s*password\b/i);
};

test('每个正式题目页都在答案下方提供按稳定 slug 映射的评论区', async () => {
  const layout = await read('../docs/_layouts/question.html');

  assert.match(layout, /data-question-comments/);
  assert.match(layout, /data-question-slug="{{\s*page\.slug\s*\|\s*escape\s*}}"/);
  assert.match(layout, /data-repository-nwo="{{\s*site\.github\.repository_nwo\s*\|\s*escape\s*}}"/);
  assert.match(layout, /question-answer[\s\S]*data-question-comments/);
  assert.match(layout, /data-question-comments-jump[^>]+href="#question-comments"/);
  assert.match(layout, /data-question-comments-confirm-empty/);
  assert.match(layout, /assets\/js\/question-comments\.js/);
  assert.doesNotMatch(layout, /data-question-slug="{{\s*page\.title/);
  assert.doesNotMatch(layout, /discussion_query[\s\S]*page\.title/);
  assert.doesNotMatch(layout, /查看已有社区评论|在社区补充答案/);
});

test('讨论搜索 API 只查询当前仓库和稳定题目 slug，不依赖自定义标签', async () => {
  const { buildQuestionDiscussionSearchApiUrl } = await importCore();
  const url = new URL(buildQuestionDiscussionSearchApiUrl(
    'example-owner/example-repo',
    'kv-cache-inference',
  ));

  assert.equal(url.origin, 'https://api.github.com');
  assert.equal(url.pathname, '/search/issues');
  const query = url.searchParams.get('q') || '';
  assert.match(query, /repo:example-owner\/example-repo/);
  assert.match(query, /is:issue/);
  assert.match(query, /is:open/);
  assert.match(query, /question:kv-cache-inference/);
  assert.doesNotMatch(query, /label:/);
  assert.equal(url.searchParams.get('sort'), 'created');
  assert.equal(url.searchParams.get('order'), 'asc');
  assert.equal(url.searchParams.get('per_page'), '100');
  assert.doesNotThrow(() => buildQuestionDiscussionSearchApiUrl(
    'example-owner/example-repo',
    '为什么-kv-cache-能加速推理',
  ));

  for (const repository of ['', 'owner', 'owner/repo/extra', '../repo', 'owner/repo?x=1']) {
    assert.throws(
      () => buildQuestionDiscussionSearchApiUrl(repository, 'kv-cache-inference'),
      /仓库|repository/i,
    );
  }
  for (const slug of ['', '../kv-cache', 'kv cache', 'kv-cache?x=1']) {
    assert.throws(
      () => buildQuestionDiscussionSearchApiUrl('example-owner/example-repo', slug),
      /slug|题目/i,
    );
  }
});

test('讨论匹配排除 PR、其他题目和伪前缀，优先选择可继续评论的规范 Issue', async () => {
  const { normalizeQuestionDiscussion } = await importCore();
  const repository = 'example-owner/example-repo';
  const slug = 'kv-cache-inference';
  const payload = {
    items: [
      {
        number: 23,
        title: '[题目评论] question:kv-cache-inference',
        pull_request: { url: 'https://api.github.com/repos/example-owner/example-repo/pulls/23' },
      },
      {
        number: 22,
        title: '[题目评论] question:rope-extrapolation · 另一道题',
      },
      {
        number: 21,
        title: '[题目评论] question:kv-cache-inference-extra · 伪前缀',
      },
      {
        number: 20,
        title: '[题目评论] question:kv-cache-inference',
        state: 'open',
        body: '### 题目页面\nhttps://example.com/questions/kv-cache/\n\n### 你的评论、补充或纠错\n先说明带宽瓶颈。\n\n### 原理\n这里仍属于评论正文。\n\n### 公开确认\n- [x] 已确认',
        user: { login: 'bob' },
        created_at: '2026-07-22T10:00:00Z',
        updated_at: '2026-07-22T11:00:00Z',
      },
      {
        number: 18,
        title: '[题目评论] question:kv-cache-inference',
        state: 'closed',
        locked: true,
        body: '### 题目页面\nhttps://example.com/questions/kv-cache/\n\n### 你的评论、补充或纠错\n可以再说明显存带宽这一层。\n\n### 公开确认\n- [x] 已确认',
        user: { login: 'alice' },
        created_at: '2026-07-22T08:00:00Z',
        updated_at: '2026-07-22T09:00:00Z',
        html_url: 'https://attacker.example/issues/18',
      },
    ],
  };

  const discussion = normalizeQuestionDiscussion(payload, repository, slug);

  assert.equal(discussion.number, 20);
  assert.equal(discussion.state, 'open');
  assert.equal(discussion.locked, false);
  assert.equal(discussion.url, 'https://github.com/example-owner/example-repo/issues/20');
  assert.deepEqual(discussion.openingComment, {
    id: 'issue-20',
    author: 'bob',
    body: '先说明带宽瓶颈。\n\n### 原理\n这里仍属于评论正文。',
    createdAt: '2026-07-22T10:00:00Z',
    updatedAt: '2026-07-22T11:00:00Z',
    url: 'https://github.com/example-owner/example-repo/issues/20',
  });
  assert.equal(normalizeQuestionDiscussion({ items: [] }, repository, slug), null);
  assert.equal(normalizeQuestionDiscussion(null, repository, slug), null);
});

test('评论 API 只读取已匹配 Issue，校验分页和仓库参数', async () => {
  const { buildQuestionCommentsApiUrl } = await importCore();
  const url = new URL(buildQuestionCommentsApiUrl('example-owner/example-repo', 18, 50, 2));

  assert.equal(url.origin, 'https://api.github.com');
  assert.equal(url.pathname, '/repos/example-owner/example-repo/issues/18/comments');
  assert.equal(url.searchParams.get('per_page'), '50');
  assert.equal(url.searchParams.get('page'), '2');

  for (const issueNumber of [0, -1, 1.5, Number.NaN, '18x']) {
    assert.throws(
      () => buildQuestionCommentsApiUrl('example-owner/example-repo', issueNumber),
      /Issue|编号|number/i,
    );
  }
  assert.throws(
    () => buildQuestionCommentsApiUrl('example-owner/example-repo', 18, 101),
    /分页|每页|per.?page/i,
  );
});

test('评论规范化过滤空内容和异常记录，并只生成当前仓库的可信链接', async () => {
  const { normalizeQuestionComments } = await importCore();
  const payload = [
    {
      id: 101,
      body: '<img src=x onerror="alert(1)"> 这是普通评论文本',
      user: { login: 'alice' },
      created_at: '2026-07-22T08:00:00Z',
      updated_at: '2026-07-22T09:00:00Z',
      html_url: 'https://attacker.example/steal',
    },
    {
      id: 102,
      body: '   ',
      user: { login: 'empty-comment' },
    },
    {
      id: 'not-an-id',
      body: '异常编号',
      user: { login: 'mallory' },
    },
    null,
  ];

  const comments = normalizeQuestionComments(
    payload,
    'example-owner/example-repo',
    18,
  );

  assert.equal(comments.length, 1);
  assert.deepEqual(comments[0], {
    id: 101,
    author: 'alice',
    body: '<img src=x onerror="alert(1)"> 这是普通评论文本',
    createdAt: '2026-07-22T08:00:00Z',
    updatedAt: '2026-07-22T09:00:00Z',
    url: 'https://github.com/example-owner/example-repo/issues/18#issuecomment-101',
  });
  assert.deepEqual(normalizeQuestionComments([], 'example-owner/example-repo', 18), []);
});

test('题目评论脚本分两步读取讨论和评论，并使用安全 DOM API 渲染', async () => {
  const script = await read('../docs/assets/js/question-comments.js');

  assert.match(script, /buildQuestionDiscussionSearchApiUrl/);
  assert.match(script, /normalizeQuestionDiscussion/);
  assert.match(script, /buildQuestionCommentsApiUrl/);
  assert.match(script, /normalizeQuestionComments/);
  assert.match(script, /dataset\.questionSlug/);
  assert.match(script, /\bfetch\s*\(/);
  assert.match(script, /(?:discussion|comments)Response\.ok/);
  assert.match(script, /createElement\(/);
  assert.match(script, /\.textContent\s*=/);
  assert.match(script, /replaceChildren\(/);
  assert.match(script, /data-question-comments-confirm-empty/);
  assert.match(script, /GitHub API 暂时没有确认评论状态/);
  assert.match(script, /discussion\.comments > replies\.length/);
  assert.match(script, /catch\s*(?:\([^)]*\))?\s*\{/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /\bAuthorization\b|localStorage|sessionStorage/i);
});

test('首页把公开投稿并入题库体验，不再提供独立社区导航', async () => {
  const [home, layout, script] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/public-questions.js'),
  ]);
  const navigation = `${home}\n${layout}`;

  assert.match(home, /使用者新增的题目/);
  assert.match(home, /data-public-questions/);
  assert.ok(home.indexOf('data-public-questions') < home.indexOf('id="question-list"'), '公开补充应在正式长列表之前出现');
  assert.match(home, /查看全部公开补充/);
  assert.match(home, /data-repository-nwo="{{\s*site\.github\.repository_nwo\s*\|\s*escape\s*}}"/);
  assert.match(navigation, /assets\/js\/public-questions\.js/);
  assert.doesNotMatch(navigation, /href="{{\s*['"]\/community\//);
  assert.doesNotMatch(layout, />\s*(?:面经)?社区\s*</);

  assert.match(script, /buildPublicQuestionsApiUrl/);
  assert.match(script, /normalizePublicQuestions/);
  assert.match(script, /\bfetch\s*\(/);
  assert.match(script, /response\.ok/);
  assert.match(script, /createElement\(/);
  assert.match(script, /\.textContent\s*=/);
  assert.match(script, /replaceChildren\(/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /\bAuthorization\b|localStorage|sessionStorage/i);
});

test('公开题 API 使用不可由投稿者修改的标签过滤，并排除 PR 和普通 Issue', async () => {
  const {
    buildPublicQuestionsApiUrl,
    normalizePublicQuestions,
  } = await importCore();
  const url = new URL(buildPublicQuestionsApiUrl('example-owner/example-repo', 20, 2));

  assert.equal(url.origin, 'https://api.github.com');
  assert.equal(url.pathname, '/repos/example-owner/example-repo/issues');
  assert.equal(url.searchParams.get('state'), 'open');
  assert.equal(url.searchParams.get('labels'), 'public-question');
  assert.equal(url.searchParams.get('per_page'), '20');
  assert.equal(url.searchParams.get('page'), '2');

  const payload = [
    {
      number: 31,
      title: '[新增题目] 为什么 KV Cache 能加速推理？',
      labels: [{ name: 'public-question' }],
      user: { login: 'alice' },
      comments: 3,
      state: 'open',
      created_at: '2026-07-22T08:00:00Z',
      updated_at: '2026-07-22T09:00:00Z',
      html_url: 'https://attacker.example/issues/31',
      body: '<script>不应直接送入卡片 HTML</script>',
    },
    {
      number: 32,
      title: '带相同标签的 PR',
      labels: [{ name: 'public-question' }],
      pull_request: { url: 'https://api.github.com/repos/example-owner/example-repo/pulls/32' },
    },
    {
      number: 33,
      title: '普通维护 Issue',
      labels: [{ name: 'enhancement' }],
    },
  ];

  const questions = normalizePublicQuestions(payload, 'example-owner/example-repo');
  assert.equal(questions.length, 1);
  assert.equal(questions[0].number, 31);
  // 页面只显示题目本身，不把 GitHub 工作流前缀暴露给普通读者。
  assert.equal(questions[0].title, '为什么 KV Cache 能加速推理？');
  assert.equal(questions[0].author, 'alice');
  assert.equal(questions[0].comments, 3);
  assert.equal(questions[0].url, 'https://github.com/example-owner/example-repo/issues/31');
  assert.equal(Object.hasOwn(questions[0], 'body'), false);
  const publicScript = await read('../docs/assets/js/public-questions.js');
  assert.doesNotMatch(publicScript, /已整理/);
});

test('公开题和题目评论使用独立可视化表单，且绝不索要 GitHub 凭据', async () => {
  const [questionForm, commentForm, workflow] = await Promise.all([
    read('../.github/ISSUE_TEMPLATE/public-question.yml'),
    read('../.github/ISSUE_TEMPLATE/question-comment.yml'),
    read('../.github/workflows/question-collaboration.yml'),
  ]);

  assert.match(questionForm, /title:\s*["']?\[新增题目\]/);
  assert.match(questionForm, /labels:\s*\[["']public-question["']\]/);
  assert.match(fieldSection(questionForm, 'question'), /required:\s*true/);
  assert.doesNotMatch(fieldSection(questionForm, 'answer'), /required:\s*true/);
  assert.match(fieldSection(questionForm, 'category'), /- type:\s*input/);
  assert.match(fieldSection(questionForm, 'difficulty'), /- type:\s*input/);

  assert.match(commentForm, /title:\s*["']?\[题目评论\]/);
  assert.match(commentForm, /labels:\s*\[["']question-comments["']\]/);
  assert.match(fieldSection(commentForm, 'comment'), /required:\s*true/);

  for (const form of [questionForm, commentForm]) {
    assert.match(form, /提交后会公开/);
    assert.match(fieldSection(form, 'compliance'), /required:\s*true/);
    assertNoCredentialField(form);
  }

  assert.match(workflow, /issues:\s*\n\s+types:\s*\[opened\]/);
  assert.match(workflow, /issues:\s*write/);
  assert.match(workflow, /gh label create public-question/);
  assert.match(workflow, /gh label create question-comments/);
  assert.match(workflow, /gh label create duplicate/);
  assert.match(workflow, /gh issue edit "\$ISSUE_NUMBER" --add-label "\$LABEL"/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
  assert.match(workflow, /queue:\s*max/);
  assert.match(workflow, /gh api --paginate --slurp/);
  assert.doesNotMatch(workflow, /issues\?state=open&labels=question-comments/);
  assert.match(workflow, /\.title == \$title/);
  assert.match(workflow, /gh issue close "\$ISSUE_NUMBER" --reason "not planned"/);
});

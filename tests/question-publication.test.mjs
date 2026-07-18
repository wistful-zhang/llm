import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isQuestionDocumentPath,
  parseQuestionDocument,
} from '../scripts/question-publication.mjs';

const document = ({ published = 'true', body = '这是一段普通的公开题目答案。' } = {}) => `---
title: "Transformer 为什么使用多头注意力？"
source: "公开题库整理"
verified: true
category: "Transformer"
difficulty: "中等"
tags:
  - Attention
  - Transformer
review_status: "待复习"
published: ${published}
answer_status: complete
date: 2026-07-18
---

${body}
`;

test('安全题目 frontmatter 可以解析，支持两种 Markdown 扩展名和嵌套路径', () => {
  const result = parseQuestionDocument(document(), 'nested/example.markdown');
  assert.deepEqual(result.errors, []);
  assert.equal(result.values.get('published'), true);
  assert.deepEqual(result.values.get('tags'), ['Attention', 'Transformer']);
  assert.equal(isQuestionDocumentPath('nested/example.md'), true);
  assert.equal(isQuestionDocumentPath('nested/example.markdown'), true);
  assert.equal(isQuestionDocumentPath('nested/example.txt'), false);
});

test('网页后台新建题目时 verified 可以省略并按未核验处理', () => {
  const source = document().replace('verified: true\n', '');
  const result = parseQuestionDocument(source, 'cms-created.md');
  assert.deepEqual(result.errors, []);
  assert.equal(result.values.has('verified'), false);
});

test('重复字段和可覆盖布局或网址的未知字段会被拒绝', () => {
  const duplicate = document().replace('published: true', 'published: false\npublished: true');
  const injected = document().replace('category: "Transformer"', 'category: "Transformer"\nlayout: experience\npermalink: /admin/');
  assert.ok(parseQuestionDocument(duplicate).errors.some((message) => message.includes('字段 published 重复')));
  const errors = parseQuestionDocument(injected).errors;
  assert.ok(errors.some((message) => message.includes('字段 layout 不允许')));
  assert.ok(errors.some((message) => message.includes('字段 permalink 不允许')));
});

test('复杂 YAML 键、折叠标量、锚点和转义字符串不能制造解析歧义', () => {
  const complexKey = document().replace('published: true', 'published: false\n"published": true');
  const folded = document().replace('title: "Transformer 为什么使用多头注意力？"', 'title: >-\n  隐藏标题');
  const anchored = document().replace('category: "Transformer"', 'category: &category "Transformer"');
  const escaped = document().replace('公开题库整理', 'person\\u0040example.com');
  assert.ok(parseQuestionDocument(complexKey).errors.some((message) => message.includes('复杂 YAML 键')));
  assert.ok(parseQuestionDocument(folded).errors.some((message) => message.includes('折叠标量')));
  assert.ok(parseQuestionDocument(anchored).errors.some((message) => message.includes('复杂 YAML')));
  assert.ok(parseQuestionDocument(escaped).errors.some((message) => message.includes('转义字符')));
});

test('公开题目拒绝原始 HTML、Liquid 和 Kramdown 属性列表', () => {
  const attacks = [
    ['<script>alert(1)</script>', '原始 HTML'],
    ['{{ site.github.owner_name }}', 'Liquid'],
    ['[查看](https://example.com){: onclick="alert(1)"}', 'Kramdown 属性列表'],
  ];
  attacks.forEach(([body, reason]) => {
    assert.ok(parseQuestionDocument(document({ body })).errors.some((message) => message.includes(reason)));
  });
});

test('公开题目拒绝危险协议及实体、百分号和隐形字符变体', () => {
  const attacks = [
    '[点击](javascript:alert(1))',
    '[点击](java&#x73;cript&#58;alert(1))',
    '[点击](java%73cript%3Aalert(1))',
    '[点击](java%26%23x73%3Bcript%26colon%3Balert(1))',
    '[点击](javascript\\:alert(1))',
    '[点击](java\u2060script:alert(1))',
    '[点击](vbscript:msgbox(1))',
    '[点击](data:text/html,hello)',
    '[点击](file:///etc/passwd)',
    '[点击](blob:https://example.com/id)',
  ];
  attacks.forEach((body) => {
    assert.ok(parseQuestionDocument(document({ body })).errors.some((message) => message.includes('危险 URL 协议')), body);
  });
});

test('公开题目会扫描标题、来源、标签、正文和文件名中的隐私信息', () => {
  const cases = [
    [
      document().replace('Transformer 为什么使用多头注意力？', '联系 person%40example.com'),
      'safe-title.md',
      '邮箱地址',
    ],
    [
      document().replace('公开题库整理', 'person&#64;example&#46;com'),
      'safe-source.md',
      '邮箱地址',
    ],
    [
      document().replace('  - Attention', '  - 13800**138**000'),
      'safe-tag.md',
      '手机号码',
    ],
    [
      document({ body: '联系号码是 13800\u2060138000，会议 https%3A%2F%2Fzoom.us%2Fj%2F123456。' }),
      'safe-body.md',
      '会议链接',
    ],
    [document(), 'nested/person%40example.com.md', '文件名或路径'],
  ];

  cases.forEach(([source, filename, reason]) => {
    assert.ok(parseQuestionDocument(source, filename).errors.some((message) => message.includes(reason)), `${filename}: ${reason}`);
  });
  const bodyErrors = parseQuestionDocument(cases[3][0], cases[3][1]).errors;
  assert.ok(bodyErrors.some((message) => message.includes('手机号码')));
});

test('公开题目中的畸形百分号和无分号实体不能掩盖联系方式', () => {
  const bodies = [
    '先讨论成功率 95% 和畸形编码 %ZZ，再联系 person%40example.com。',
    '浏览器可见的联系方式是 person&#64example.com。',
    '混合十六进制实体后的联系方式是 person&#x40example.com。',
  ];
  bodies.forEach((body) => {
    assert.ok(
      parseQuestionDocument(document({ body }), 'safe-question.md').errors
        .some((message) => message.includes('邮箱地址')),
      body,
    );
  });
});

test('公开题目拒绝行内、引用式和本地 Markdown 图片', () => {
  const images = [
    '![面试截图](https://example.com/interview.png)',
    '![架构图](/assets/private.png)',
    '![流程图][diagram]\n\n[diagram]: https://example.com/diagram.png',
    '![可能的引用式图片]',
  ];
  images.forEach((body) => {
    assert.ok(parseQuestionDocument(document({ body })).errors.some((message) => message.includes('图片或截图')), body);
  });
});

test('自定义元素也属于原始 HTML，不能靠陌生标签名绕过', () => {
  const result = parseQuestionDocument(document({ body: '<malicious-widget>内容</malicious-widget>' }));
  assert.ok(result.errors.some((message) => message.includes('原始 HTML')));
});

test('代码块和行内代码可以讲解不安全写法，普通特殊 Token 不会被当作 HTML', () => {
  const body = `可以把 \`javascript:alert(1)\` 当作反例说明，也可以展示特殊 Token \`<unk>\` 和普通协议 \`https://example.com/path\`。

\`\`\`html
<script>alert(1)</script>
{{ liquid.example }}
[点击](data:text/html,bad){: onclick="alert(1)"}
![代码中的图片语法](https://example.com/example.png)
\`\`\``;
  assert.deepEqual(parseQuestionDocument(document({ body })).errors, []);
});

test('非法反引号 fence 不能把后续危险链接伪装成代码', () => {
  const body = '``` ```\n[点击](javascript:alert(1))\n```';
  assert.ok(parseQuestionDocument(document({ body })).errors.some((message) => message.includes('危险 URL 协议')));
});

test('Kramdown 视为字面量的空格反引号不能隐藏危险链接', () => {
  const body = '` [点击](javascript:alert(1)) `';
  assert.ok(parseQuestionDocument(document({ body })).errors.some((message) => message.includes('危险 URL 协议')));
});

test('紧接普通段落的四空格缩进不能隐藏危险链接', () => {
  const body = '普通段落\n    [点击](javascript:alert(1))';
  assert.ok(parseQuestionDocument(document({ body })).errors.some((message) => message.includes('危险 URL 协议')));
});

test('未发布草稿不会被当作公开页面拦截正文示例', () => {
  const body = '<script>仅供本地草稿示例</script> person@example.com 13800138000 ![截图](https://example.com/private.png)';
  const result = parseQuestionDocument(document({ published: 'false', body }), 'person@example.com.md');
  assert.deepEqual(result.errors, []);
});

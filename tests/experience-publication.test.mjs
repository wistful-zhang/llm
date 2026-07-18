import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPublishedExperienceFrontmatter,
  hasRenderedExperienceMarker,
  isExperienceDocumentPath,
  validateExperienceDocument,
  validateRenderedExperienceHtml,
} from '../scripts/experience-publication.mjs';

const document = ({
  published = 'true',
  consent = 'true',
  body = '这次面试主要围绕检索增强生成、服务稳定性和项目取舍展开。公开版本只保留通用问题与回答思路，不包含面试官身份、联系方式、会议安排或公司内部资料。复盘重点是先说明约束，再给出指标和失败处理。',
} = {}) => `---
title: "某公司 · 大模型应用岗二面复盘"
published: ${published}
consent_to_publish: ${consent}
company_alias: "某公司"
role: "大模型应用工程师"
interview_month: 2026-07
round_summary: "两轮技术面"
---

${body}
`;

test('匿名且明确确认的公开面经可以通过校验', () => {
  assert.deepEqual(validateExperienceDocument(document()), []);
});

test('没有确认匿名授权时不能公开', () => {
  const errors = validateExperienceDocument(document({ consent: 'false' }));
  assert.ok(errors.some((message) => message.includes('consent_to_publish: true')));
});

test('草稿可以保持未发布且正文留待后续整理', () => {
  assert.deepEqual(validateExperienceDocument(document({ published: 'false', consent: 'false', body: '' })), []);
});

test('公开内容会拦截常见联系方式和会议链接', () => {
  const body = `${'公开内容需要先匿名整理。'.repeat(12)} 联系我：13800138000，会议 https://zoom.us/j/123456，备用 https://meet.google.com/abc-defg-hij。`;
  const errors = validateExperienceDocument(document({ body }));
  assert.ok(errors.some((message) => message.includes('手机号码')));
  assert.ok(errors.some((message) => message.includes('会议链接')));
});

test('公开面经中的畸形百分号和无分号实体不能掩盖联系方式', () => {
  const prefix = '公开内容已经完成基础匿名处理，但仍需要自动检查联系方式。'.repeat(8);
  const bodies = [
    `${prefix} 干扰内容 %ZZ，联系 person%40example.com。`,
    `${prefix} 联系 person&#64example.com。`,
    `${prefix} 混合十六进制实体后的联系方式是 person&#x40example.com。`,
  ];
  bodies.forEach((body) => {
    assert.ok(
      validateExperienceDocument(document({ body })).some((message) => message.includes('邮箱地址')),
      body,
    );
  });
});

test('重复的公开字段会被拒绝，不能利用 YAML 末值绕过校验', () => {
  const source = document().replace('published: true', 'published: false\npublished: true');
  const errors = validateExperienceDocument(source);
  assert.ok(errors.some((message) => message.includes('字段 published 重复')));
});

test('拒绝带引号或复杂写法的顶层键，避免语义相同的重复键绕过', () => {
  const source = document().replace('published: true', 'published: false\n"published": true');
  const errors = validateExperienceDocument(source);
  assert.ok(errors.some((message) => message.includes('不支持的复杂 YAML 键')));
});

test('公开面经只接受有效月份，避免在仓库源文件里保留精确日期', () => {
  const source = document().replace('interview_month: 2026-07', 'interview_month: 2026-13');
  const errors = validateExperienceDocument(source);
  assert.ok(errors.some((message) => message.includes('有效的 YYYY-MM 月份')));
});

test('递归扫描接受 Markdown 的两种常见扩展名', () => {
  assert.equal(isExperienceDocumentPath('nested/example.md'), true);
  assert.equal(isExperienceDocumentPath('nested/example.markdown'), true);
  assert.equal(isExperienceDocumentPath('nested/example.txt'), false);
});

test('拒绝折叠标量、转义字符串和 YAML 锚点，避免与 Jekyll 解析语义不一致', () => {
  const folded = document().replace('title: "某公司 · 大模型应用岗二面复盘"', 'title: >-\n  person@example.com');
  const escaped = document().replace('某公司 · 大模型应用岗二面复盘', 'person\\u0040example.com');
  const anchored = document().replace('role: "大模型应用工程师"', 'role: &role "大模型应用工程师"');
  assert.ok(validateExperienceDocument(folded).some((message) => message.includes('折叠标量')));
  assert.ok(validateExperienceDocument(escaped).some((message) => message.includes('转义字符')));
  assert.ok(validateExperienceDocument(anchored).some((message) => message.includes('复杂 YAML')));
});

test('只允许公开面经字段，不能覆盖布局、网址或注入额外可见字段', () => {
  const source = document().replace('role: "大模型应用工程师"', 'role: "大模型应用工程师"\nlayout: question\nsource: person@example.com');
  const errors = validateExperienceDocument(source);
  assert.ok(errors.some((message) => message.includes('字段 layout 不允许')));
  assert.ok(errors.some((message) => message.includes('字段 source 不允许')));
});

test('标签中的隐私信息和 Markdown 分段号码都会被拦截', () => {
  const tagged = document().replace('round_summary: "两轮技术面"', 'round_summary: "两轮技术面"\ntags:\n  - RAG\n  - 13800138000');
  const splitPhoneBody = '这是一段已经完成匿名处理的公开复盘。'.repeat(12) + ' 联系号码是 13800**138**000。';
  assert.ok(validateExperienceDocument(tagged).some((message) => message.includes('手机号码')));
  assert.ok(validateExperienceDocument(document({ body: splitPhoneBody })).some((message) => message.includes('手机号码')));
});

test('普通标签列表可以发布，但图片和截图会被拒绝', () => {
  const tagged = document().replace('round_summary: "两轮技术面"', 'round_summary: "两轮技术面"\ntags:\n  - RAG\n  - Agent');
  const imageBody = '这是一段已经完成匿名处理的公开复盘。'.repeat(12) + ' ![面试截图](https://example.com/interview.png)';
  const referenceImageBody = '这是一段已经完成匿名处理的公开复盘。'.repeat(12) + '\n![面试截图][shot]\n[shot]: https://example.com/interview.png';
  assert.deepEqual(validateExperienceDocument(tagged), []);
  assert.ok(validateExperienceDocument(document({ body: imageBody })).some((message) => message.includes('图片或截图')));
  assert.ok(validateExperienceDocument(document({ body: referenceImageBody })).some((message) => message.includes('图片或截图')));
});

test('渲染后扫描覆盖标签、HTML 分段号码和实体编码邮箱', () => {
  const html = '<article data-public-experience="true"><span>13800<strong>138</strong>000</span><p>person&#64;example.com</p><a href="https://example.webex.com/meet/room">进入会议</a></article>';
  assert.equal(hasRenderedExperienceMarker(html), true);
  const errors = validateRenderedExperienceHtml(html, 'experiences/example/index.html');
  assert.ok(errors.some((message) => message.includes('手机号码')));
  assert.ok(errors.some((message) => message.includes('邮箱地址')));
  assert.ok(errors.some((message) => message.includes('会议链接')));
  assert.deepEqual(validateRenderedExperienceHtml('<main>普通页面</main>'), []);
});

test('文件名、最终 URL 和 Unicode 隐形字符不能绕过隐私扫描', () => {
  const invisiblePhoneBody = '这是一段已经完成匿名处理的公开复盘。'.repeat(12) + ' 联系号码是 13800\u2060138000。';
  assert.ok(validateExperienceDocument(document(), 'person@example.com.md').some((message) => message.includes('文件名或路径')));
  assert.ok(validateExperienceDocument(document(), 'person%40example.com.md').some((message) => message.includes('文件名或路径')));
  assert.ok(validateExperienceDocument(document({ body: invisiblePhoneBody })).some((message) => message.includes('手机号码')));

  const html = '<article data-public-experience="true"><p>匿名内容</p></article>';
  const pathErrors = validateRenderedExperienceHtml(html, 'experiences/person@example.com/index.html');
  assert.ok(pathErrors.some((message) => message.includes('邮箱地址')));
});

test('构建产物计数只读取 frontmatter，不会把正文示例误认为已发布', () => {
  const draft = document({ published: 'false', consent: 'false', body: '正文示例：\npublished: true' });
  assert.equal(hasPublishedExperienceFrontmatter(draft), false);
  assert.equal(hasPublishedExperienceFrontmatter(document()), true);
});

test('公开面经拒绝危险协议、Kramdown 属性列表和原始 HTML', () => {
  const prefix = '这是一段已经完成匿名处理的公开复盘。'.repeat(12);
  const attacks = [
    [`${prefix}\n[点击](javascript:alert(1))`, '危险 URL 协议'],
    [`${prefix}\n[点击](https://example.com){: onclick="alert(1)"}`, 'Kramdown 属性列表'],
    [`${prefix}\n<script>alert(1)</script>`, '原始 HTML'],
  ];
  attacks.forEach(([body, reason]) => {
    assert.ok(validateExperienceDocument(document({ body })).some((message) => message.includes(reason)));
  });
});

test('公开面经允许在代码块和行内代码中讲解被禁止的写法', () => {
  const body = `${'这是一段已经完成匿名处理的公开复盘。'.repeat(12)}

行内反例：\`javascript:alert(1)\`。

\`\`\`html
<script>alert(1)</script>
{{ liquid.example }}
\`\`\``;
  assert.deepEqual(validateExperienceDocument(document({ body })), []);
});

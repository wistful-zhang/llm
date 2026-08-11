import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COMMENT_MATH_LIMITS,
  analyzeCommentMath,
  splitCommentMath,
} from '../docs/assets/js/comment-math-core.mjs';

test('评论中的行内与独立公式会拆成安全的独立渲染片段', () => {
  const source = String.raw`点积维度是 $$d_k$$。
$$
\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)
$$`;
  const result = splitCommentMath(source);

  assert.equal(result.renderable, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.segments.length, 2);
  assert.equal(result.segments[0].display, false);
  assert.equal(result.segments[1].display, true);
  assert.equal(result.parts.filter(({ type }) => type === 'math').length, 2);
  assert.equal(result.parts.map(({ value }) => value).join(''), source);
});

test('普通金额与代码示例保持文字，只有通过校验的公式进入渲染片段', () => {
  const source = '价格是 $19.99，<img onerror=alert(1)>，代码 `\\(literal\\)`，公式是 $$\\sqrt{d_k}$$。';
  const result = splitCommentMath(source);

  assert.equal(result.renderable, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.parts.filter(({ type }) => type === 'math').map(({ content }) => content),
    [String.raw`\sqrt{d_k}`],
  );
  assert.match(result.parts.filter(({ type }) => type === 'text').map(({ value }) => value).join(''), /<img onerror/);
  assert.match(result.parts.filter(({ type }) => type === 'text').map(({ value }) => value).join(''), /\\\(literal\\\)/);
});

test('畸形或超预算评论完全按原文显示，不会把部分内容交给 MathJax', () => {
  const samples = [
    '未闭合 $$x',
    String.raw`不要直接写 \(x\)`,
    `${Array.from({ length: COMMENT_MATH_LIMITS.formulas + 1 }, (_, index) => `$$x_${index}$$`).join(' ')}`,
    `$$${'x'.repeat(COMMENT_MATH_LIMITS.formulaLength + 1)}$$`,
    `$$${'{'.repeat(COMMENT_MATH_LIMITS.braceDepth + 1)}x${'}'.repeat(COMMENT_MATH_LIMITS.braceDepth + 1)}$$`,
    `$$${String.raw`\begin{x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth + 1)}x${String.raw`\end{x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth + 1)}$$`,
    `$$${String.raw`\begin {x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth + 1)}x${String.raw`\end {x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth + 1)}$$`,
    `$$${"\\begin\t{x}".repeat(COMMENT_MATH_LIMITS.environmentDepth + 1)}x${"\\end\t{x}".repeat(COMMENT_MATH_LIMITS.environmentDepth + 1)}$$`,
    String.raw`$$\begin% comment
{matrix}x\end{matrix}$$`,
    String.raw`$$\DeclareMathOperator{\sqrt}{EVIL}$$`,
    String.raw`$$x\label{same}$$`,
    String.raw`$$x\tag{1}$$`,
    String.raw`$$\href{javascript:alert(1)}{x}$$`,
    String.raw`$$\newcommand{\x}{y}$$`,
  ];

  samples.forEach((source) => {
    const analysis = analyzeCommentMath(source);
    const split = splitCommentMath(source);
    assert.ok(analysis.errors.length > 0, source.slice(0, 80));
    assert.equal(split.renderable, false);
    assert.deepEqual(split.parts, [{ type: 'text', value: source }]);
  });
});

test('定义型控制词大小写与边界都会拒绝，普通 operatorname 不受影响', () => {
  for (const source of [
    String.raw`$$\DeclareMathOperator{\evil}{EVIL}$$`,
    String.raw`$$\declaremathoperator{\evil}{EVIL}$$`,
    String.raw`$$x\LABEL{same}$$`,
    String.raw`$$x\eqref{same}$$`,
  ]) {
    assert.ok(analyzeCommentMath(source).errors
      .includes('公式不支持定义宏、标签、链接或动态扩展命令'));
  }
  assert.deepEqual(analyzeCommentMath(String.raw`$$\operatorname{Attention}(Q,K,V)$$`).errors, []);
  assert.deepEqual(analyzeCommentMath(String.raw`$$\\DeclareMathOperator+x$$`).errors, []);
});

test('评论公式的数量与嵌套上限边界可以正常通过', () => {
  const formulas = Array.from(
    { length: COMMENT_MATH_LIMITS.formulas },
    (_, index) => `$$x_${index}$$`,
  ).join(' ');
  const nestedBraces = `${'{'.repeat(COMMENT_MATH_LIMITS.braceDepth)}x${'}'.repeat(COMMENT_MATH_LIMITS.braceDepth)}`;
  const nestedEnvironments = `${String.raw`\begin{x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth)}x${String.raw`\end{x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth)}`;
  const spacedEnvironments = `${String.raw`\begin {x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth)}x${String.raw`\end {x}`.repeat(COMMENT_MATH_LIMITS.environmentDepth)}`;

  assert.deepEqual(analyzeCommentMath(formulas).errors, []);
  assert.deepEqual(analyzeCommentMath(`$$${nestedBraces}$$`).errors, []);
  assert.deepEqual(analyzeCommentMath(`$$${nestedEnvironments}$$`).errors, []);
  assert.deepEqual(analyzeCommentMath(`$$${spacedEnvironments}$$`).errors, []);
});

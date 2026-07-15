import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractMathSegments,
  validateMathFormatting,
} from '../scripts/math-format.mjs';

test('accepts inline and display Kramdown math', () => {
  const source = String.raw`
行内公式 $$x_t = x_{t-1}+1$$。

$$
\begin{aligned}
y &= Ax+b \\
z &= \operatorname{softmax}(y)
\end{aligned}
$$
`;

  assert.deepEqual(validateMathFormatting(source), []);
  assert.equal(extractMathSegments(source).length, 2);
});

test('rejects unpaired delimiters, braces and environments', () => {
  assert.deepEqual(validateMathFormatting('正文 $$x+y'), ['公式分隔符 $$ 未成对']);
  assert.ok(validateMathFormatting('$$x_{t$$').includes('公式中的 TeX 花括号未配对'));
  assert.ok(validateMathFormatting(String.raw`$$\begin{aligned}x=1\end{matrix}$$`)
    .includes('公式中的 TeX begin/end 环境未配对'));
});

test('keeps text examples but rejects formulas disguised as text code', () => {
  const textExample = '```text\n输入: [BOS, A]\n目标: [A, EOS]\n```';
  const formulaExample = '```text\nloss = -sum(log p)\n```';

  assert.deepEqual(validateMathFormatting(textExample), []);
  assert.ok(validateMathFormatting(formulaExample)
    .includes('数学公式不能放在 ```text 代码块中，请改用 $$'));
});

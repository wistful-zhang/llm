import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_LATEX_FORMULAS,
  MAX_LATEX_FORMULA_LENGTH,
  insertLatexTemplate,
  kramdownMathToMathJax,
  parseKramdownMath,
  validateKramdownMath,
} from '../docs/assets/js/latex-input-core.mjs';

test('识别 Kramdown 行内和独立公式，并为 MathJax 预览转换分隔符', () => {
  const source = String.raw`复杂度是 $$O(n^2)$$。

$$
\operatorname{Attention}(Q,K,V)
= \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$`;
  const parsed = parseKramdownMath(source);

  assert.equal(parsed.segments.length, 2);
  assert.equal(parsed.segments[0].display, false);
  assert.equal(parsed.segments[1].display, true);
  assert.equal(kramdownMathToMathJax(source), String.raw`复杂度是 \(O(n^2)\)。

\[
\operatorname{Attention}(Q,K,V)
= \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
\]`);
});

test('金额、行内代码和围栏代码不会被当成公式', () => {
  const source = [
    '价格是 $19.99，代码是 `const marker = "$$"`。',
    '',
    '```js',
    'const marker = "$$";',
    '```',
  ].join('\n');

  assert.equal(parseKramdownMath(source).segments.length, 0);
  assert.deepEqual(validateKramdownMath(source), []);
  assert.equal(kramdownMathToMathJax(source), source);
});

test('行内代码必须由等长反引号闭合，不能借更长反引号绕过公式限制', () => {
  const unmatchedCodeSpan = ['`', ' $$x$$ ', '``'].join('');
  const validLongCodeSpan = ['``', 'const marker = `$$`', '``'].join('');
  const bypassAttempt = ['` ', '$$x$$'.repeat(MAX_LATEX_FORMULAS + 1), ' ``'].join('');

  assert.equal(parseKramdownMath(unmatchedCodeSpan).segments.length, 1);
  assert.equal(parseKramdownMath(validLongCodeSpan).segments.length, 0);
  assert.ok(validateKramdownMath(bypassAttempt)
    .includes(`每个输入项最多包含 ${MAX_LATEX_FORMULAS} 个公式`));
});

test('公式校验提示未闭合、空公式、花括号和环境错误', () => {
  assert.deepEqual(validateKramdownMath('正文 $$x+y'), ['公式分隔符 $$ 未成对']);
  assert.ok(validateKramdownMath('正文 $$$$').includes('存在空的 $$ 公式'));
  assert.ok(validateKramdownMath(String.raw`正文 $$x_{t$$`).includes('公式中的 TeX 花括号未配对'));
  assert.ok(validateKramdownMath(String.raw`$$\begin{aligned}x=1\end{matrix}$$`)
    .includes('公式中的 TeX begin/end 环境未配对'));
});

test('拒绝直接输入构建后的 MathJax 分隔符，但代码示例不误报', () => {
  const message = '请使用 $$ 包住公式，不要直接输入 \\(...\\) 或 \\[...\\]';
  assert.ok(validateKramdownMath(String.raw`正文 \(x_i\)`).includes(message));
  assert.ok(validateKramdownMath(String.raw`\[x_i\]`).includes(message));
  assert.ok(validateKramdownMath(String.raw`正文 \\(x_i\\)`).includes(message));
  assert.deepEqual(validateKramdownMath('代码 `\\(x_i\\)`'), []);
});

test('拒绝会被 Kramdown 还原成公式分隔符的美元转义', () => {
  const message = '单个 $ 不需要反斜杠转义；公式请直接使用成对的 $$';
  assert.ok(validateKramdownMath(String.raw`\$\$x\$\$`).includes(message));
  assert.deepEqual(validateKramdownMath(String.raw`价格 $19.99，公式 $$\$100+x$$`), []);
  assert.deepEqual(validateKramdownMath('代码 `\\$\\$x\\$\\$`'), []);
});

test('拒绝可在浏览器中解码成公式分隔符的 HTML 实体，但允许代码示例', () => {
  const message = '公式分隔符中的 $ 或 \\ 不能使用 HTML 实体编码';
  assert.ok(validateKramdownMath('&#36;&#36;x&#36;&#36;').includes(message));
  assert.ok(validateKramdownMath('&#x24;&#x24;x&#x24;&#x24;').includes(message));
  assert.ok(validateKramdownMath('&#92;(x&#92;)').includes(message));
  assert.ok(validateKramdownMath('&bsol;[x&bsol;]').includes(message));
  assert.deepEqual(validateKramdownMath('代码 `&#36;&#36;x&#36;&#36;`'), []);
});

test('限制单个输入项的公式数量与单个公式长度', () => {
  const tooMany = '$$x$$'.repeat(MAX_LATEX_FORMULAS + 1);
  const tooLong = `$$${'x'.repeat(MAX_LATEX_FORMULA_LENGTH + 1)}$$`;

  assert.ok(validateKramdownMath(tooMany)
    .includes(`每个输入项最多包含 ${MAX_LATEX_FORMULAS} 个公式`));
  assert.ok(validateKramdownMath(tooLong)
    .includes(`单个公式不能超过 ${MAX_LATEX_FORMULA_LENGTH} 个字符`));
});

test('插入按钮包裹选中文字，并选中默认占位内容', () => {
  assert.deepEqual(insertLatexTemplate('复杂度 O(n)', 4, 8, 'inline'), {
    value: '复杂度 $$O(n)$$',
    selectionStart: 6,
    selectionEnd: 10,
  });
  assert.deepEqual(insertLatexTemplate('答案：', 3, 3, 'inline'), {
    value: '答案：$$x$$',
    selectionStart: 5,
    selectionEnd: 6,
  });

  const display = insertLatexTemplate('先写结论。后写公式。', 5, 5, 'display');
  assert.equal(display.value, String.raw`先写结论。

$$
\frac{a}{b}
$$

后写公式。`);
  assert.equal(display.value.slice(display.selectionStart, display.selectionEnd), String.raw`\frac{a}{b}`);
});

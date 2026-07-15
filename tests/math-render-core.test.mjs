import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MATHJAX_INTEGRITY,
  MATHJAX_SOURCE,
  containsRenderableMath,
  createMathJaxConfig,
  hasMathDelimiters,
} from '../docs/assets/js/math-render-core.mjs';

const text = (nodeValue) => ({ nodeType: 3, nodeValue });
const element = (tagName, ...childNodes) => ({ nodeType: 1, tagName, childNodes });

test('detects Kramdown MathJax inline and display delimiters', () => {
  assert.equal(hasMathDelimiters('before \\(x_1 + y\\) after'), true);
  assert.equal(hasMathDelimiters('before \\[x^2 + y^2\\] after'), true);
  assert.equal(hasMathDelimiters('ordinary text and $19.99'), false);
  assert.equal(hasMathDelimiters('an unmatched \\( delimiter'), false);
});

test('ignores formula-like text inside code and pre elements', () => {
  const root = element('DIV',
    element('P', text('ordinary text')),
    element('CODE', text('\\(not rendered\\)')),
    element('PRE', text('\\[also not rendered\\]')),
  );

  assert.equal(containsRenderableMath(root), false);
  root.childNodes.push(element('P', text('render \\(x\\) here')));
  assert.equal(containsRenderableMath(root), true);
});

test('creates a lazy MathJax 4 CommonHTML configuration', () => {
  const config = createMathJaxConfig({ tex: { macros: { RR: '{\\mathbb R}' } } });

  assert.match(MATHJAX_SOURCE, /mathjax@4\.0\.0\/tex-chtml\.js$/);
  assert.match(MATHJAX_INTEGRITY, /^sha384-[A-Za-z0-9+/=]+$/);
  assert.equal(config.startup.typeset, false);
  assert.equal(config.tex.processEscapes, true);
  assert.deepEqual(config.tex.macros, { RR: '{\\mathbb R}' });
  assert.equal(config.output.displayOverflow, 'scroll');
  assert.equal(config.output.mtextInheritFont, true);
  assert.equal(config.output.merrorInheritFont, true);
  assert.equal(config.output.linebreaks.inline, true);
  assert.ok(config.options.skipHtmlTags.includes('code'));
  assert.ok(config.options.skipHtmlTags.includes('mjx-container'));
});

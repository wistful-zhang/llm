import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  MATHJAX_INTEGRITY,
  MATHJAX_SOURCE,
  containsRenderableMath,
  createMathJaxConfig,
  hasMathDelimiters,
} from '../docs/assets/js/math-render-core.mjs';
import { prepareKramdownMath } from '../docs/assets/js/math-render.mjs';

const text = (nodeValue) => ({ nodeType: 3, nodeValue });
const element = (tagName, ...childNodes) => ({ nodeType: 1, tagName, childNodes });
const browserLoader = readFileSync(new URL('../docs/assets/js/math-render.mjs', import.meta.url), 'utf8');

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
  const config = createMathJaxConfig({
    loader: { load: ['ui/safe'] },
    tex: {
      macros: { RR: '{\\mathbb R}' },
      packages: {
        '[+]': ['ams', 'require', 'texhtml'],
        '[-]': ['autoload'],
      },
    },
  });

  assert.match(MATHJAX_SOURCE, /mathjax@4\.1\.3\/tex-chtml\.js$/);
  assert.match(MATHJAX_INTEGRITY, /^sha384-[A-Za-z0-9+/=]+$/);
  assert.deepEqual(config.loader.load, ['ui/safe']);
  assert.equal(config.startup.typeset, false);
  assert.equal(config.tex.processEscapes, true);
  assert.equal(config.tex.processEnvironments, false);
  assert.equal(config.tex.processRefs, false);
  assert.equal(config.tex.maxBuffer, 5 * 1024);
  assert.equal(config.tex.maxTemplateSubtitutions, 1000);
  assert.deepEqual(config.tex.inlineMath, [['\\(', '\\)']]);
  assert.deepEqual(config.tex.displayMath, [['\\[', '\\]']]);
  assert.deepEqual(config.tex.packages['[-]'], ['autoload', 'require', 'texhtml']);
  assert.deepEqual(config.tex.packages['[+]'], ['ams']);
  assert.deepEqual(config.tex.macros, { RR: '{\\mathbb R}' });
  assert.deepEqual(config.options.safeOptions.allow, {
    URLs: 'none',
    classes: 'none',
    cssIDs: 'none',
    styles: 'none',
  });
  assert.equal(config.output.displayOverflow, 'scroll');
  assert.equal(config.output.mtextInheritFont, true);
  assert.equal(config.output.merrorInheritFont, true);
  assert.equal(config.output.linebreaks.inline, true);
  assert.ok(config.options.skipHtmlTags.includes('code'));
  assert.ok(config.options.skipHtmlTags.includes('mjx-container'));
});

test('prepares raw Kramdown math in text nodes while leaving code untouched', () => {
  const titleText = text('标题 $$x_i$$');
  const codeText = text('代码 $$not_math$$');
  const root = element('DIV', titleText, element('CODE', codeText));

  assert.equal(prepareKramdownMath(root, { forceInline: true }), true);
  assert.equal(titleText.nodeValue, '标题 \\(x_i\\)');
  assert.equal(codeText.nodeValue, '代码 $$not_math$$');
});

test('MathJax CDN 加载超时后会回退，不会让公式预览无限等待', () => {
  assert.match(browserLoader, /window\.setTimeout\(fail, 15_000\)/);
  assert.match(browserLoader, /window\.clearTimeout\(timeoutId\)/);
  assert.match(browserLoader, /settle\(null, 'failed'/);
  assert.match(browserLoader, /if \(settled\) return/);
});

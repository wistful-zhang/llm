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
import {
  prepareKramdownMath,
  updateMathElements,
} from '../docs/assets/js/math-render.mjs';

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
  assert.equal(config.tex.maxMacros, 1000);
  assert.equal(config.tex.maxTemplateSubtitutions, 1000);
  assert.equal('maxTemplateSubstitutions' in config.tex, false);
  assert.deepEqual(config.tex.inlineMath, [['\\(', '\\)']]);
  assert.deepEqual(config.tex.displayMath, [['\\[', '\\]']]);
  assert.deepEqual(config.tex.packages['[-]'], ['autoload', 'require', 'texhtml', 'newcommand']);
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

test('动态公式更新使用全局队列，并在实际执行时筛选仍连接的独立节点', () => {
  assert.match(browserLoader, /let renderQueue = Promise\.resolve\(\)/);
  assert.match(browserLoader, /renderQueue\.then\(task, task\)/);
  assert.match(browserLoader, /const mutationQueues = new WeakMap\(\)/);
  assert.match(browserLoader, /export function updateMathElements/);
  assert.match(browserLoader, /const mutationResult = typeof mutate === 'function' \? mutate\(\) : undefined/);
  assert.match(browserLoader, /await clearMathElements\(clearRoots\)[\s\S]*?mutate\(\)/);
  assert.match(browserLoader, /await mathJax\.typesetPromise\(connected\)/);
  assert.match(browserLoader, /root\.isConnected !== false && containsRenderableMath\(root\)/);
  assert.match(browserLoader, /mathJax\.typesetClear\(roots\)/);
  assert.match(browserLoader, /await mathJax\.typesetPromise\(connected\)/);
});

test('清理、DOM 更新和排版作为同一事务串行执行', async () => {
  const originalWindow = globalThis.window;
  const events = [];
  let releaseFirst;
  let markFirstStarted;
  const firstStarted = new Promise((resolve) => { markFirstStarted = resolve; });
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  const first = { ...element('SPAN', text('\\(x\\)')), isConnected: true, id: 'first' };
  const second = { ...element('SPAN', text('\\(y\\)')), isConnected: true, id: 'second' };

  globalThis.window = {
    MathJax: {
      typesetClear(roots) {
        events.push(`clear-${roots.map(({ id }) => id).join(',')}`);
      },
      async typesetPromise(roots) {
        const id = roots[0].id;
        events.push(`typeset-start-${id}`);
        if (id === 'first') {
          markFirstStarted();
          await firstGate;
        }
        events.push(`typeset-end-${id}`);
      },
    },
  };

  try {
    const firstUpdate = updateMathElements({
      scope: first,
      mutate: () => events.push('mutate-first'),
      render: [first],
    });
    await firstStarted;
    const secondUpdate = updateMathElements({
      scope: first,
      clear: [first],
      mutate: () => events.push('mutate-second'),
      render: [second],
    });
    await Promise.resolve();
    assert.equal(events.includes('mutate-second'), false);

    releaseFirst();
    await Promise.all([firstUpdate, secondUpdate]);
    assert.deepEqual(events, [
      'mutate-first',
      'typeset-start-first',
      'typeset-end-first',
      'clear-first',
      'mutate-second',
      'typeset-start-second',
      'typeset-end-second',
    ]);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('MathJax CDN 尚未加载时不会阻塞后续纯 DOM 更新', async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  let loadHandler;
  let markLoaderStarted;
  const loaderStarted = new Promise((resolve) => { markLoaderStarted = resolve; });
  const script = {
    dataset: {},
    addEventListener(type, handler) {
      if (type === 'load') loadHandler = handler;
    },
    remove() {},
  };
  globalThis.window = {
    setTimeout,
    clearTimeout,
  };
  globalThis.document = {
    querySelector: () => null,
    createElement: () => script,
    head: {
      appendChild() {
        markLoaderStarted();
      },
    },
  };

  try {
    const { updateMathElements: updateFresh } = await import(
      `../docs/assets/js/math-render.mjs?loader-queue-test=${Date.now()}`
    );
    const formula = { ...element('SPAN', text('\\(x\\)')), isConnected: true };
    const scope = {};
    let firstMutated = false;
    let plainMutated = false;
    const formulaUpdate = updateFresh({
      scope,
      mutate: () => { firstMutated = true; },
      render: [formula],
    });
    await loaderStarted;
    assert.equal(firstMutated, true);

    await updateFresh({
      scope,
      mutate: () => {
        plainMutated = true;
        formula.isConnected = false;
      },
    });
    assert.equal(plainMutated, true);

    window.MathJax.typesetClear = () => {};
    window.MathJax.typesetPromise = async () => {};
    await loadHandler();
    assert.equal(await formulaUpdate, false);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('其他区域排版较慢时，纯文字 DOM 仍可立即更新', async () => {
  const originalWindow = globalThis.window;
  let releaseTypeset;
  let markTypesetStarted;
  const typesetStarted = new Promise((resolve) => { markTypesetStarted = resolve; });
  const typesetGate = new Promise((resolve) => { releaseTypeset = resolve; });
  globalThis.window = {
    MathJax: {
      typesetClear() {},
      async typesetPromise() {
        markTypesetStarted();
        await typesetGate;
      },
    },
  };

  try {
    const formula = { ...element('SPAN', text('\\(x\\)')), isConnected: true };
    const formulaUpdate = updateMathElements({ render: [formula] });
    await typesetStarted;
    let commentInserted = false;
    await updateMathElements({
      scope: {},
      mutate: () => { commentInserted = true; },
    });
    assert.equal(commentInserted, true);
    releaseTypeset();
    await formulaUpdate;
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

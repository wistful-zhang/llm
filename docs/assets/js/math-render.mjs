import {
  MATHJAX_INTEGRITY,
  MATHJAX_SOURCE,
  containsRenderableMath,
  createMathJaxConfig,
  isSkippedMathTag,
} from './math-render-core.mjs';
import { kramdownMathToMathJax } from './latex-input-core.mjs';

let loaderPromise = null;
let failureReported = false;

const readyMathJax = () => (
  typeof window !== 'undefined' && typeof window.MathJax?.typesetPromise === 'function'
    ? window.MathJax
    : null
);

const reportFailureOnce = (error) => {
  if (failureReported) return;
  failureReported = true;
  console.warn('公式渲染暂时不可用，已保留原始公式。', error);
};

const waitForStartup = async () => {
  const startup = window.MathJax?.startup?.promise;
  if (startup) await startup;
  return readyMathJax();
};

export function loadMathJax() {
  const ready = readyMathJax();
  if (ready) return Promise.resolve(ready);
  if (loaderPromise) return loaderPromise;
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(null);

  window.MathJax = createMathJaxConfig(window.MathJax || {});

  loaderPromise = new Promise((resolve) => {
    let script = document.querySelector('script[data-mathjax-loader]');
    let timeoutId = 0;
    let settled = false;

    const settle = (value, state, error = null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (script) script.dataset.mathjaxState = state;
      if (error) reportFailureOnce(error);
      resolve(value);
    };

    const finish = async () => {
      try {
        const mathJax = await waitForStartup();
        if (!mathJax) throw new Error('MathJax loaded without the typeset API.');
        settle(mathJax, 'ready');
      } catch (error) {
        settle(null, 'failed', error);
      }
    };

    const fail = () => {
      settle(null, 'failed', new Error('Unable to load MathJax from the CDN.'));
    };

    timeoutId = window.setTimeout(fail, 15_000);

    if (script) {
      if (script.dataset.mathjaxState === 'failed') {
        settle(null, 'failed');
      } else if (readyMathJax()) {
        void finish();
      } else {
        script.addEventListener('load', finish, { once: true });
        script.addEventListener('error', fail, { once: true });
      }
      return;
    }

    script = document.createElement('script');
    script.src = MATHJAX_SOURCE;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.integrity = MATHJAX_INTEGRITY;
    script.referrerPolicy = 'no-referrer';
    script.dataset.mathjaxLoader = '';
    script.dataset.mathjaxState = 'loading';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', fail, { once: true });
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export function clearMath(root) {
  const mathJax = readyMathJax();
  if (!root || typeof mathJax?.typesetClear !== 'function') return false;

  try {
    mathJax.typesetClear([root]);
    return true;
  } catch (error) {
    reportFailureOnce(error);
    return false;
  }
}

export function prepareKramdownMath(root, options = {}) {
  if (!root) return false;
  let changed = false;

  const visit = (node) => {
    if (node.nodeType === 3) {
      const current = node.nodeValue || '';
      const next = kramdownMathToMathJax(current, options);
      if (next !== current) {
        node.nodeValue = next;
        changed = true;
      }
      return;
    }
    if (node.tagName && isSkippedMathTag(node.tagName)) return;
    Array.from(node.childNodes || []).forEach(visit);
  };

  visit(root);
  return changed;
}

export async function renderMath(root) {
  if (!containsRenderableMath(root)) return false;

  const mathJax = await loadMathJax();
  if (!mathJax || (root.isConnected === false)) return false;

  try {
    await mathJax.typesetPromise([root]);
    return true;
  } catch (error) {
    reportFailureOnce(error);
    return false;
  }
}

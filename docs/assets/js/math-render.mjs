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
let renderQueue = Promise.resolve();
const defaultMutationScope = {};
const mutationQueues = new WeakMap();

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

const queueMathTask = (task) => {
  const result = renderQueue.then(task, task);
  renderQueue = result.then(() => undefined, () => undefined);
  return result;
};

const resolveRoots = (roots, mutationResult) => Array.from(
  (typeof roots === 'function' ? roots(mutationResult) : roots) || [],
).filter(Boolean);

const queueMutationTask = (scope, task) => {
  const key = scope && (typeof scope === 'object' || typeof scope === 'function')
    ? scope
    : defaultMutationScope;
  const previous = mutationQueues.get(key) || Promise.resolve();
  const result = previous.then(task, task);
  mutationQueues.set(key, result.then(() => undefined, () => undefined));
  return result;
};

const clearMathElements = (roots) => {
  if (roots.length === 0 || !readyMathJax()) return Promise.resolve();
  return queueMathTask(async () => {
    const mathJax = readyMathJax();
    if (!mathJax || typeof mathJax.typesetClear !== 'function') return;
    try {
      mathJax.typesetClear(roots);
    } catch (error) {
      reportFailureOnce(error);
    }
  });
};

const typesetMathElements = (roots, mathJax) => queueMathTask(async () => {
  const connected = roots.filter((root) => (
    root.isConnected !== false && containsRenderableMath(root)
  ));
  if (connected.length === 0) return false;
  try {
    await mathJax.typesetPromise(connected);
    return true;
  } catch (error) {
    reportFailureOnce(error);
    return false;
  }
});

export function updateMathElements({
  clear = [],
  mutate = null,
  render = [],
  scope = null,
} = {}) {
  const updateDom = async () => {
    const clearRoots = resolveRoots(clear);
    await clearMathElements(clearRoots);

    const mutationResult = typeof mutate === 'function' ? mutate() : undefined;
    const renderRoots = resolveRoots(render, mutationResult);
    return renderRoots.filter((root) => (
      root.isConnected !== false && containsRenderableMath(root)
    ));
  };

  const candidatesPromise = mutate || scope
    ? queueMutationTask(scope, updateDom)
    : updateDom();

  return (async () => {
    const candidates = await candidatesPromise;
    if (candidates.length === 0) return false;

    // Neither CDN startup nor an unrelated page region owns this scope lock.
    // A newer edit can replace stale raw formula nodes while MathJax loads.
    const mathJax = readyMathJax() || await loadMathJax();
    if (!mathJax) return false;
    const typeset = () => typesetMathElements(candidates, mathJax);
    return mutate || scope
      ? queueMutationTask(scope, typeset)
      : typeset();
  })();
}

export function renderMathElements(roots = []) {
  return updateMathElements({ render: roots });
}

export function renderMath(root) {
  return renderMathElements([root]);
}

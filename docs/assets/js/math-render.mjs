import {
  MATHJAX_INTEGRITY,
  MATHJAX_SOURCE,
  containsRenderableMath,
  createMathJaxConfig,
} from './math-render-core.mjs';

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

    const finish = async () => {
      try {
        const mathJax = await waitForStartup();
        if (!mathJax) throw new Error('MathJax loaded without the typeset API.');
        script.dataset.mathjaxState = 'ready';
        resolve(mathJax);
      } catch (error) {
        script.dataset.mathjaxState = 'failed';
        reportFailureOnce(error);
        resolve(null);
      }
    };

    const fail = () => {
      script.dataset.mathjaxState = 'failed';
      reportFailureOnce(new Error('Unable to load MathJax from the CDN.'));
      resolve(null);
    };

    if (script) {
      if (script.dataset.mathjaxState === 'failed') {
        resolve(null);
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

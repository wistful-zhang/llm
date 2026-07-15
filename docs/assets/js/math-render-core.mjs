export const MATHJAX_SOURCE = 'https://cdn.jsdelivr.net/npm/mathjax@4.0.0/tex-chtml.js';
export const MATHJAX_INTEGRITY = 'sha384-2BWc4dVaHADUocwKrUrK9u3iDwHxVMKXWEcoRmUkXYSFKhAsgVAYClu9ydNuo5Oz';

export const MATH_SKIP_TAGS = Object.freeze([
  'script',
  'noscript',
  'style',
  'textarea',
  'pre',
  'code',
  'math',
  'select',
  'option',
  'mjx-container',
]);

const MATH_DELIMITER_PATTERN = /(?:\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/;
const skippedTags = new Set(MATH_SKIP_TAGS);

export const hasMathDelimiters = (value = '') => MATH_DELIMITER_PATTERN.test(String(value));

export const isSkippedMathTag = (tagName = '') => skippedTags.has(String(tagName).toLowerCase());

export function containsRenderableMath(root) {
  if (!root) return false;

  if (root.nodeType === 3) return hasMathDelimiters(root.nodeValue || '');
  if (root.tagName && isSkippedMathTag(root.tagName)) return false;

  return Array.from(root.childNodes || []).some((child) => containsRenderableMath(child));
}

export const createMathJaxConfig = (current = {}) => ({
  ...current,
  startup: {
    ...(current.startup || {}),
    typeset: false,
  },
  tex: {
    ...(current.tex || {}),
    processEscapes: true,
  },
  options: {
    ...(current.options || {}),
    skipHtmlTags: [...MATH_SKIP_TAGS],
  },
  output: {
    ...(current.output || {}),
    displayOverflow: 'scroll',
    mtextInheritFont: true,
    merrorInheritFont: true,
    linebreaks: {
      ...(current.output?.linebreaks || {}),
      inline: true,
      width: '100%',
    },
  },
});

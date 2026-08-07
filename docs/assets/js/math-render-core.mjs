export const MATHJAX_SOURCE = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js';
export const MATHJAX_INTEGRITY = 'sha384-IgpmJyK7IVIVd18E1Ubslp9a1s6/6VBt9aJFbpzNIJPPMaxwEV7OxR/xY0hHbSck';

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
const BLOCKED_TEX_PACKAGES = Object.freeze(['autoload', 'require', 'texhtml']);

const unique = (values) => [...new Set(values)];

const safePackageConfiguration = (packages) => {
  const current = packages && !Array.isArray(packages) && typeof packages === 'object'
    ? packages
    : {};
  const removed = Array.isArray(current['[-]']) ? current['[-]'] : [];
  const next = {
    ...current,
    '[-]': unique([...removed, ...BLOCKED_TEX_PACKAGES]),
  };
  if (Array.isArray(current['[+]'])) {
    next['[+]'] = unique(current['[+]'].filter((name) => !BLOCKED_TEX_PACKAGES.includes(name)));
  }
  return next;
};

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
  loader: {
    ...(current.loader || {}),
    load: unique([
      ...(Array.isArray(current.loader?.load) ? current.loader.load : []),
      'ui/safe',
    ]),
  },
  startup: {
    ...(current.startup || {}),
    typeset: false,
  },
  tex: {
    ...(current.tex || {}),
    packages: safePackageConfiguration(current.tex?.packages),
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: false,
    processRefs: false,
    maxBuffer: 5 * 1024,
    maxTemplateSubtitutions: 1000,
  },
  options: {
    ...(current.options || {}),
    skipHtmlTags: [...MATH_SKIP_TAGS],
    safeOptions: {
      ...(current.options?.safeOptions || {}),
      allow: {
        URLs: 'none',
        classes: 'none',
        cssIDs: 'none',
        styles: 'none',
      },
    },
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

import { stripMarkdownCode } from './public-markup-security.mjs';
export { findSensitivePublicContent, renderedLikeText } from '../docs/assets/js/public-content-privacy.mjs';

const isEscaped = (source, index) => {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
};

/** Detects rendered Markdown image markers while ignoring fenced/inline code examples. */
export const containsVisibleMarkdownImage = (source) => {
  const visible = stripMarkdownCode(source);
  let index = visible.indexOf('![');
  while (index !== -1) {
    if (!isEscaped(visible, index)) return true;
    index = visible.indexOf('![', index + 2);
  }
  return false;
};

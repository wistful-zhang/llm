import { stripMarkdownCode } from './public-markup-security.mjs';

const namedEntities = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['colon', ':'],
  ['commat', '@'],
  ['gt', '>'],
  ['hyphen', '-'],
  ['lt', '<'],
  ['num', '#'],
  ['period', '.'],
  ['quot', '"'],
  ['sol', '/'],
]);

// Prefer separators that can complete an email address or URL before the
// generic numeric-entity decoder consumes following hexadecimal letters.
// This is intentionally conservative for public content: for example,
// `&#x40example.com` must not hide the `@` from the privacy scan.
const privacySeparatorEntities = new Map([
  ['2d', '-'],
  ['2e', '.'],
  ['2f', '/'],
  ['3a', ':'],
  ['40', '@'],
]);

const decodeHtmlEntitiesOnce = (value) => String(value || '')
  .replace(/&#x0*(2d|2e|2f|3a|40);?/gi, (match, digits) =>
    privacySeparatorEntities.get(digits.toLowerCase()) || match)
  .replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, token) => {
    const radix = token[0].toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? token.slice(1) : token;
    const codePoint = Number.parseInt(digits, radix);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
    return String.fromCodePoint(codePoint);
  })
  .replace(/&([a-z]+);?/gi, (match, name) => namedEntities.get(name.toLowerCase()) || match);

const decodeHtmlEntities = (value) => {
  let decoded = String(value || '');
  for (let pass = 0; pass < 2; pass += 1) decoded = decodeHtmlEntitiesOnce(decoded);
  return decoded;
};

const decodePercentEncodingOnce = (value) => String(value || '')
  .replace(/(?:%[0-9a-f]{2})+/gi, (sequence) => {
    try {
      return decodeURIComponent(sequence);
    } catch {
      return sequence.replace(/%([0-9a-f]{2})/gi, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)));
    }
  });

const decodePercentEncoding = (value) => {
  let decoded = String(value || '');
  for (let pass = 0; pass < 2; pass += 1) decoded = decodePercentEncodingOnce(decoded);
  return decoded;
};

export const renderedLikeText = (value) => decodeHtmlEntities(value)
  .normalize('NFKC')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/<\/?[A-Za-z][^>]*>/g, '')
  .replace(/(?:\*{1,3}|_{1,3}|~{2}|\x60+)/g, '')
  .replace(/\\(?=\S)/g, '')
  .replace(/\p{Default_Ignorable_Code_Point}/gu, '');

const sensitivePatterns = [
  {
    pattern: /(?:^|[^\d])1[3-9](?:[\s().\-–—_*~\x60\u200b-\u200d]*\d){9}(?!\d)/,
    label: '疑似手机号码',
  },
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    label: '疑似邮箱地址',
  },
  {
    pattern: /https?:\/\/(?:[A-Z0-9-]+\.)*(?:zoom\.us|meet\.google\.com|webex\.com|teams\.microsoft\.com|teams\.microsoft\.us|meeting\.tencent\.com|voovmeeting\.com|feishu\.cn|larksuite\.com|dingtalk\.com|skype\.com|whereby\.com|meet\.jit\.si|gotomeeting\.com|goto\.com|bluejeans\.com|ringcentral\.com)(?=[:/?#\s]|$)/i,
    label: '疑似会议链接',
  },
];

export const findSensitivePublicContent = (...values) => {
  const candidates = values.flat(Infinity).flatMap((value) => {
    const decoded = decodeHtmlEntities(value).normalize('NFKC');
    const percentDecoded = decodePercentEncoding(decoded);
    return [decoded, renderedLikeText(decoded), percentDecoded, renderedLikeText(percentDecoded)];
  });
  return sensitivePatterns
    .filter(({ pattern }) => candidates.some((candidate) => pattern.test(candidate)))
    .map(({ label }) => label);
};

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

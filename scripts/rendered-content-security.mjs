const namedEntities = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['colon', ':'],
  ['commat', '@'],
  ['gt', '>'],
  ['lt', '<'],
  ['newline', '\n'],
  ['quot', '"'],
  ['tab', '\t'],
]);

const decodeHtmlEntitiesOnce = (value) => String(value || '')
  .replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, token) => {
    const radix = token[0].toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? token.slice(1) : token;
    const codePoint = Number.parseInt(digits, radix);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
    return String.fromCodePoint(codePoint);
  })
  .replace(/&([a-z]+);?/gi, (match, name) => namedEntities.get(name.toLowerCase()) || match);

const normalizeUrl = (value) => {
  let decoded = String(value || '');
  for (let pass = 0; pass < 3; pass += 1) {
    decoded = decodeHtmlEntitiesOnce(decoded);
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // 保留无法解码的原值；后续仍会检查可见协议部分。
    }
  }
  return decoded
    .normalize('NFKC')
    .replace(/[\u0000-\u0020\u007f-\u009f\p{Default_Ignorable_Code_Point}]+/gu, '')
    .toLocaleLowerCase('en-US');
};

const dangerousProtocol = /^(?:javascript|vbscript|data|file|blob):/i;
const forbiddenElement = /<(?:script|iframe|object|embed|svg|math|base|link|meta|style|template)\b/i;
const executableAttribute = /\s(?:on[a-z0-9_-]+|style|srcdoc)\s*=/i;
const urlAttribute = /\s(?:href|src|xlink:href|action|formaction|poster|background|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

export const extractMarkedArticle = (html, marker) => {
  const safeMarker = String(marker || '').replace(/[^a-z0-9_-]/gi, '');
  if (!safeMarker) return '';
  const pattern = new RegExp(
    `<article\\b(?=[^>]*\\b${safeMarker}=(?:"true"|'true'))[^>]*>[\\s\\S]*?<\\/article>`,
    'i',
  );
  return String(html || '').match(pattern)?.[0] || '';
};

export const hasRenderedQuestionMarker = (html) => Boolean(
  extractMarkedArticle(html, 'data-public-question'),
);

export function validateRenderedPublicArticleHtml(html, filename = 'index.html', marker = 'data-public-question') {
  const article = extractMarkedArticle(html, marker);
  if (!article) return [];

  const errors = [];
  if (forbiddenElement.test(article)) {
    errors.push(`${filename}: 公开内容渲染出了禁止的可执行或嵌入式 HTML 元素`);
  }
  if (executableAttribute.test(article)) {
    errors.push(`${filename}: 公开内容渲染出了事件、样式或 srcdoc 属性`);
  }

  for (const match of article.matchAll(urlAttribute)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? '';
    const candidates = match[0].toLocaleLowerCase('en-US').includes('srcset=')
      ? raw.split(',').map((item) => item.trim().split(/\s+/)[0])
      : [raw];
    if (candidates.some((value) => dangerousProtocol.test(normalizeUrl(value)))) {
      errors.push(`${filename}: 公开内容渲染出了危险 URL 协议`);
      break;
    }
  }
  return errors;
}

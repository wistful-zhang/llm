const namedEntities = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['colon', ':'],
  ['gt', '>'],
  ['lt', '<'],
  ['newline', '\n'],
  ['quot', '"'],
  ['tab', '\t'],
]);

const htmlLikeTag = /<\/?[A-Za-z][A-Za-z0-9:.-]*(?:\s+[^<>]*)?\s*\/?>/i;
const allowedBareToken = /<(?:unk|pad|bos|eos|mask|sep|cls)>/gi;

const decodeHtmlEntitiesOnce = (value) => String(value || '')
  .replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, token) => {
    const radix = token[0].toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? token.slice(1) : token;
    const codePoint = Number.parseInt(digits, radix);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
    return String.fromCodePoint(codePoint);
  })
  .replace(/&([a-z]+);?/gi, (match, name) => namedEntities.get(name.toLowerCase()) ?? match);

const decodeHtmlEntities = (value) => {
  let decoded = String(value || '');
  for (let pass = 0; pass < 3; pass += 1) decoded = decodeHtmlEntitiesOnce(decoded);
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
  for (let pass = 0; pass < 3; pass += 1) decoded = decodePercentEncodingOnce(decoded);
  return decoded;
};

const isEscaped = (line, index) => {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && line[cursor] === '\\'; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
};

const stripInlineCode = (line) => {
  let output = '';
  let cursor = 0;
  while (cursor < line.length) {
    if (line[cursor] !== '`' || isEscaped(line, cursor)) {
      output += line[cursor];
      cursor += 1;
      continue;
    }

    let delimiterLength = 1;
    while (line[cursor + delimiterLength] === '`') delimiterLength += 1;
    const beforeOpening = line[cursor - 1] || ' ';
    const afterOpening = line[cursor + delimiterLength] || ' ';
    if (delimiterLength === 1 && /\s/.test(beforeOpening) && /\s/.test(afterOpening)) {
      output += line[cursor];
      cursor += 1;
      continue;
    }
    let closing = cursor + delimiterLength;
    while (closing < line.length) {
      closing = line.indexOf('`'.repeat(delimiterLength), closing);
      if (closing === -1) break;
      const isExactRun = line[closing - 1] !== '`' && line[closing + delimiterLength] !== '`';
      if (isExactRun && !isEscaped(line, closing)) break;
      closing += delimiterLength;
    }
    if (closing === -1) {
      output += line.slice(cursor, cursor + delimiterLength);
      cursor += delimiterLength;
      continue;
    }

    output += ' '.repeat(closing + delimiterLength - cursor);
    cursor = closing + delimiterLength;
  }
  return output;
};

/**
 * Removes fenced and inline code while retaining line breaks and surrounding prose.
 * Security checks use this so documentation can show unsafe strings as code without
 * accidentally allowing the same strings in rendered Markdown.
 */
export const stripMarkdownCode = (source) => {
  let fence = null;
  return String(source || '').split(/(\r?\n)/).map((part) => {
    if (/^\r?\n$/.test(part)) return part;
    if (fence) {
      const closing = new RegExp(`^ {0,3}${fence.character}{${fence.length},}[ \\t]*$`);
      if (closing.test(part)) fence = null;
      return ' '.repeat(part.length);
    }

    const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(part);
    if (opening) {
      // CommonMark 不允许反引号 fence 的 info string 再含反引号；
      // 若仍把它当 fence，会把随后真正渲染的危险 Markdown 错误地抹掉。
      if (opening[1][0] === '`' && opening[2].includes('`')) return stripInlineCode(part);
      fence = { character: opening[1][0], length: opening[1].length };
      return ' '.repeat(part.length);
    }
    return stripInlineCode(part);
  }).join('');
};

const dangerousProtocol = (source) => {
  let decoded = String(source || '');
  for (let pass = 0; pass < 3; pass += 1) {
    decoded = decodePercentEncoding(decodeHtmlEntities(decoded));
  }
  decoded = decoded
    .normalize('NFKC')
    .replace(/\\(?=[:/])/g, '')
    .replace(/[\p{White_Space}\p{Cc}\p{Cf}]/gu, '')
    .toLocaleLowerCase('en-US');
  return /(?:^|[^a-z0-9+.-])(?:javascript|vbscript|data|file|blob):/.test(decoded);
};

/** Returns stable, user-facing reasons why public Markdown is unsafe. */
export const findUnsafePublicMarkdown = (source) => {
  const visibleMarkup = stripMarkdownCode(source);
  const htmlProbe = visibleMarkup.replace(allowedBareToken, '');
  const reasons = [];

  if (/\{[{%]/.test(visibleMarkup)) reasons.push('Liquid 模板语法');
  if (/\{:\s*[^}\r\n]*\}/.test(visibleMarkup)) reasons.push('Kramdown 属性列表（IAL）');
  if (/<!--[\s\S]*?-->|<![A-Za-z]|<\?[A-Za-z]/i.test(htmlProbe) || htmlLikeTag.test(htmlProbe)) {
    reasons.push('原始 HTML');
  }
  if (dangerousProtocol(visibleMarkup)) reasons.push('危险 URL 协议');

  return reasons;
};

export const validatePublicMarkdown = (source, filename = 'document.md', contentName = '公开内容') =>
  findUnsafePublicMarkdown(source)
    .map((reason) => `${filename}: ${contentName}不允许使用${reason}`);

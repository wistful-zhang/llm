const MATH_DELIMITER = '$$';
export const MAX_LATEX_FORMULAS = 64;
export const MAX_LATEX_FORMULA_LENGTH = 4096;

const countBackslashesBefore = (source, index) => {
  let count = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) count += 1;
  return count;
};

const isEscaped = (source, index) => countBackslashesBefore(source, index) % 2 === 1;

const lineEndFrom = (source, start) => {
  const newline = source.indexOf('\n', start);
  return newline === -1 ? source.length : newline + 1;
};

const fencedCodeRanges = (source) => {
  const ranges = [];
  let fence = null;
  let cursor = 0;

  while (cursor < source.length) {
    const end = lineEndFrom(source, cursor);
    const line = source.slice(cursor, end).replace(/\r?\n$/, '');
    if (!fence) {
      const opener = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (opener && !(opener[1][0] === '`' && opener[2].includes('`'))) {
        fence = { character: opener[1][0], length: opener[1].length, start: cursor };
      }
    } else {
      const candidate = line.match(/^ {0,3}(`+|~+)\s*$/);
      if (
        candidate
        && candidate[1][0] === fence.character
        && candidate[1].length >= fence.length
      ) {
        ranges.push({ start: fence.start, end });
        fence = null;
      }
    }
    cursor = end;
  }

  if (fence) ranges.push({ start: fence.start, end: source.length });
  return ranges;
};

const rangeContaining = (ranges, index, from = 0) => {
  for (let cursor = from; cursor < ranges.length; cursor += 1) {
    const range = ranges[cursor];
    if (index < range.start) return { range: null, cursor };
    if (index < range.end) return { range, cursor };
  }
  return { range: null, cursor: ranges.length };
};

const inlineCodeRanges = (source, blockRanges) => {
  const ranges = [];
  let blockCursor = 0;
  let cursor = 0;

  while (cursor < source.length) {
    const protectedRange = rangeContaining(blockRanges, cursor, blockCursor);
    blockCursor = protectedRange.cursor;
    if (protectedRange.range) {
      cursor = protectedRange.range.end;
      continue;
    }
    if (source[cursor] !== '`' || isEscaped(source, cursor)) {
      cursor += 1;
      continue;
    }

    let runLength = 1;
    while (source[cursor + runLength] === '`') runLength += 1;
    const delimiter = '`'.repeat(runLength);
    let close = source.indexOf(delimiter, cursor + runLength);
    while (close !== -1) {
      const closeRange = rangeContaining(blockRanges, close, blockCursor);
      const exactRun = source[close - 1] !== '`' && source[close + runLength] !== '`';
      if (!closeRange.range && exactRun) break;
      close = source.indexOf(
        delimiter,
        closeRange.range ? closeRange.range.end : close + runLength,
      );
    }
    if (close === -1) {
      cursor += runLength;
      continue;
    }
    ranges.push({ start: cursor, end: close + runLength });
    cursor = close + runLength;
  }

  return ranges;
};

const protectedCodeRanges = (source) => {
  const blocks = fencedCodeRanges(source);
  return [...blocks, ...inlineCodeRanges(source, blocks)]
    .sort((left, right) => left.start - right.start);
};

const hasRawMathJaxDelimiter = (source, protectedRanges) => {
  let rangeCursor = 0;
  let cursor = 0;
  while (cursor < source.length - 1) {
    const protectedRange = rangeContaining(protectedRanges, cursor, rangeCursor);
    rangeCursor = protectedRange.cursor;
    if (protectedRange.range) {
      cursor = protectedRange.range.end;
      continue;
    }
    if (
      source[cursor] === '\\'
      && ['(', ')', '[', ']'].includes(source[cursor + 1])
    ) return true;
    cursor += 1;
  }
  return false;
};

const hasEscapedDollar = (source, protectedRanges) => {
  let rangeCursor = 0;
  let cursor = 0;
  while (cursor < source.length - 1) {
    const protectedRange = rangeContaining(protectedRanges, cursor, rangeCursor);
    rangeCursor = protectedRange.cursor;
    if (protectedRange.range) {
      cursor = protectedRange.range.end;
      continue;
    }
    if (source[cursor] === '\\' && source[cursor + 1] === '$') return true;
    cursor += 1;
  }
  return false;
};

const hasEncodedMathCharacter = (source, protectedRanges) => {
  const entities = source.matchAll(/&#(?:x[0-9a-f]+|[0-9]+);?|&(?:dollar|bsol);/gi);
  let rangeCursor = 0;
  for (const match of entities) {
    const protectedRange = rangeContaining(protectedRanges, match.index, rangeCursor);
    rangeCursor = protectedRange.cursor;
    if (protectedRange.range) continue;

    const token = match[0].toLowerCase();
    if (token === '&dollar;' || token === '&bsol;') return true;
    const numeric = token.startsWith('&#x')
      ? Number.parseInt(token.slice(3), 16)
      : Number.parseInt(token.slice(2), 10);
    if (numeric === 0x24 || numeric === 0x5c) return true;
  }
  return false;
};

const isDisplaySegment = (source, start, end) => {
  const lineStart = source.lastIndexOf('\n', start - 1) + 1;
  const nextNewline = source.indexOf('\n', end + MATH_DELIMITER.length);
  const lineEnd = nextNewline === -1 ? source.length : nextNewline;
  return source.slice(lineStart, start).trim() === ''
    && source.slice(end + MATH_DELIMITER.length, lineEnd).trim() === '';
};

export function parseKramdownMath(source = '') {
  const value = String(source);
  const protectedRanges = protectedCodeRanges(value);
  const delimiters = [];
  let rangeCursor = 0;
  let cursor = 0;

  while (cursor < value.length - 1) {
    const protectedRange = rangeContaining(protectedRanges, cursor, rangeCursor);
    rangeCursor = protectedRange.cursor;
    if (protectedRange.range) {
      cursor = protectedRange.range.end;
      continue;
    }
    if (value.startsWith(MATH_DELIMITER, cursor) && !isEscaped(value, cursor)) {
      delimiters.push(cursor);
      cursor += MATH_DELIMITER.length;
    } else {
      cursor += 1;
    }
  }

  const segments = [];
  for (let index = 0; index + 1 < delimiters.length; index += 2) {
    const start = delimiters[index];
    const close = delimiters[index + 1];
    segments.push({
      start,
      end: close + MATH_DELIMITER.length,
      contentStart: start + MATH_DELIMITER.length,
      contentEnd: close,
      content: value.slice(start + MATH_DELIMITER.length, close),
      display: isDisplaySegment(value, start, close),
    });
  }

  return {
    source: value,
    segments,
    delimiterCount: delimiters.length,
    unmatchedDelimiter: delimiters.length % 2 === 1 ? delimiters.at(-1) : -1,
  };
}

export const extractKramdownMathSegments = (source = '') => (
  parseKramdownMath(source).segments.map((segment) => segment.content)
);

const checkBraces = (source) => {
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (isEscaped(source, index)) continue;
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
};

const checkEnvironments = (source) => {
  const stack = [];
  for (const match of source.matchAll(/\\(begin|end)\{([^}]+)\}/g)) {
    const [, action, environment] = match;
    if (action === 'begin') {
      stack.push(environment);
    } else if (stack.pop() !== environment) {
      return false;
    }
  }
  return stack.length === 0;
};

export function validateKramdownMath(source = '') {
  const value = String(source);
  const protectedRanges = protectedCodeRanges(value);
  const parsed = parseKramdownMath(value);
  const errors = [];

  if (hasRawMathJaxDelimiter(value, protectedRanges)) {
    errors.push('请使用 $$ 包住公式，不要直接输入 \\(...\\) 或 \\[...\\]');
  }
  if (hasEncodedMathCharacter(value, protectedRanges)) {
    errors.push('公式分隔符中的 $ 或 \\ 不能使用 HTML 实体编码');
  }
  const formulaAndCodeRanges = [
    ...protectedRanges,
    ...parsed.segments.map(({ start, end }) => ({ start, end })),
  ].sort((left, right) => left.start - right.start);
  if (hasEscapedDollar(value, formulaAndCodeRanges)) {
    errors.push('单个 $ 不需要反斜杠转义；公式请直接使用成对的 $$');
  }

  if (parsed.unmatchedDelimiter !== -1) {
    errors.push('公式分隔符 $$ 未成对');
    return errors;
  }
  if (parsed.segments.length > MAX_LATEX_FORMULAS) {
    errors.push(`每个输入项最多包含 ${MAX_LATEX_FORMULAS} 个公式`);
  }
  if (parsed.segments.some((segment) => segment.content.length > MAX_LATEX_FORMULA_LENGTH)) {
    errors.push(`单个公式不能超过 ${MAX_LATEX_FORMULA_LENGTH} 个字符`);
  }
  if (parsed.segments.some((segment) => !segment.content.trim())) {
    errors.push('存在空的 $$ 公式');
  }
  if (parsed.segments.some((segment) => !checkBraces(segment.content))) {
    errors.push('公式中的 TeX 花括号未配对');
  }
  if (parsed.segments.some((segment) => !checkEnvironments(segment.content))) {
    errors.push('公式中的 TeX begin/end 环境未配对');
  }

  return errors;
}

export function kramdownMathToMathJax(source = '', { forceInline = false } = {}) {
  const parsed = parseKramdownMath(source);
  if (parsed.segments.length === 0) return parsed.source;

  let cursor = 0;
  let output = '';
  parsed.segments.forEach((segment) => {
    output += parsed.source.slice(cursor, segment.start);
    const display = segment.display && !forceInline;
    output += display
      ? `\\[${segment.content}\\]`
      : `\\(${segment.content}\\)`;
    cursor = segment.end;
  });
  return output + parsed.source.slice(cursor);
}

const clampSelection = (value, position) => Math.min(
  value.length,
  Math.max(0, Number.isInteger(position) ? position : value.length),
);

export function insertLatexTemplate(source = '', selectionStart, selectionEnd, mode = 'inline') {
  const value = String(source);
  const start = clampSelection(value, selectionStart);
  const end = Math.max(start, clampSelection(value, selectionEnd));
  const selected = value.slice(start, end);
  const content = selected || (mode === 'display' ? String.raw`\frac{a}{b}` : 'x');

  if (mode === 'display') {
    const leading = start > 0 && value[start - 1] !== '\n' ? '\n\n' : '';
    const trailing = end < value.length && value[end] !== '\n' ? '\n\n' : '';
    const inserted = `${leading}$$\n${content}\n$$${trailing}`;
    const contentStart = start + leading.length + 3;
    return {
      value: value.slice(0, start) + inserted + value.slice(end),
      selectionStart: contentStart,
      selectionEnd: contentStart + content.length,
    };
  }

  const inserted = `$$${content}$$`;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    selectionStart: start + 2,
    selectionEnd: start + 2 + content.length,
  };
}

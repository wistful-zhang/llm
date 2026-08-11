import {
  parseKramdownMath,
  validateKramdownMath,
} from './latex-input-core.mjs';

export const COMMENT_MATH_LIMITS = Object.freeze({
  formulas: 8,
  formulaLength: 1024,
  braceDepth: 32,
  environmentDepth: 8,
});

const isEscaped = (source, index) => {
  let backslashes = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
};

const exceedsBraceDepth = (source, limit) => {
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (isEscaped(source, index)) continue;
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth = Math.max(0, depth - 1);
    if (depth > limit) return true;
  }
  return false;
};

const inspectEnvironments = (source, limit) => {
  const tokens = [...source.matchAll(/\\(?:begin|end)\b/g)]
    .filter((match) => !isEscaped(source, match.index));
  const declarations = [...source.matchAll(/\\(begin|end)[ \t\r\n]*\{([^}\r\n]+)\}/g)]
    .filter((match) => !isEscaped(source, match.index));
  if (tokens.length !== declarations.length) return { invalid: true, tooDeep: false };

  const stack = [];
  let tooDeep = false;
  for (const match of declarations) {
    const action = match[1];
    const environment = match[2].trim();
    if (!/^[A-Za-z][A-Za-z0-9*_-]*$/.test(environment)) {
      return { invalid: true, tooDeep };
    }
    if (action === 'begin') {
      stack.push(environment);
      if (stack.length > limit) tooDeep = true;
    } else if (stack.pop() !== environment) {
      return { invalid: true, tooDeep };
    }
  }
  return { invalid: stack.length > 0, tooDeep };
};

const unique = (values) => [...new Set(values)];

export function analyzeCommentMath(source = '') {
  const value = String(source);
  const parsed = parseKramdownMath(value);
  const errors = [];

  if (parsed.segments.length > COMMENT_MATH_LIMITS.formulas) {
    errors.push(`每条评论最多包含 ${COMMENT_MATH_LIMITS.formulas} 个公式`);
  }
  if (parsed.segments.some(({ content }) => content.length > COMMENT_MATH_LIMITS.formulaLength)) {
    errors.push(`评论中的单个公式不能超过 ${COMMENT_MATH_LIMITS.formulaLength} 个字符`);
  }
  if (parsed.segments.some(({ content }) => (
    exceedsBraceDepth(content, COMMENT_MATH_LIMITS.braceDepth)
  ))) {
    errors.push(`评论公式的花括号嵌套不能超过 ${COMMENT_MATH_LIMITS.braceDepth} 层`);
  }
  const environmentChecks = parsed.segments.map(({ content }) => (
    inspectEnvironments(content, COMMENT_MATH_LIMITS.environmentDepth)
  ));
  if (environmentChecks.some(({ invalid }) => invalid)) {
    errors.push('评论公式中的 TeX begin/end 环境写法无效或未配对');
  }
  if (environmentChecks.some(({ tooDeep }) => tooDeep)) {
    errors.push(`评论公式的 begin/end 环境嵌套不能超过 ${COMMENT_MATH_LIMITS.environmentDepth} 层`);
  }

  errors.push(...validateKramdownMath(value));
  return {
    source: value,
    segments: parsed.segments,
    delimiterCount: parsed.delimiterCount,
    errors: unique(errors),
  };
}

export function splitCommentMath(source = '') {
  const analysis = analyzeCommentMath(source);
  if (analysis.errors.length > 0 || analysis.segments.length === 0) {
    return {
      ...analysis,
      renderable: false,
      parts: [{ type: 'text', value: analysis.source }],
    };
  }

  const parts = [];
  let cursor = 0;
  analysis.segments.forEach((segment) => {
    if (segment.start > cursor) {
      parts.push({ type: 'text', value: analysis.source.slice(cursor, segment.start) });
    }
    parts.push({
      type: 'math',
      value: analysis.source.slice(segment.start, segment.end),
      content: segment.content,
      display: segment.display,
    });
    cursor = segment.end;
  });
  if (cursor < analysis.source.length) {
    parts.push({ type: 'text', value: analysis.source.slice(cursor) });
  }

  return { ...analysis, renderable: true, parts };
}

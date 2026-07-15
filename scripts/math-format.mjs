const mathDelimiter = '$$';

const countOccurrences = (source, token) => {
  let count = 0;
  let cursor = 0;
  while ((cursor = source.indexOf(token, cursor)) !== -1) {
    count += 1;
    cursor += token.length;
  }
  return count;
};

const fencedTextBlocks = (source) => (
  [...source.matchAll(/^```text\s*\r?\n([\s\S]*?)^```\s*$/gm)].map((match) => match[1])
);

const looksLikeFormulaBlock = (source) => {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.some((line) => (
    /[=∑∏√∫≈≤≥∈∝]|\b(?:softmax|sigmoid|argmax|log|exp)\s*\(/i.test(line)
  ));
};

const checkBraces = (source) => {
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const escaped = index > 0 && source[index - 1] === '\\';
    if (escaped) continue;
    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
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

export function extractMathSegments(source = '') {
  const parts = String(source).split(mathDelimiter);
  return parts.filter((_, index) => index % 2 === 1);
}

export function validateMathFormatting(source = '') {
  const content = String(source);
  const errors = [];
  const delimiterCount = countOccurrences(content, mathDelimiter);

  if (delimiterCount % 2 !== 0) {
    errors.push('公式分隔符 $$ 未成对');
    return errors;
  }

  for (const block of fencedTextBlocks(content)) {
    if (looksLikeFormulaBlock(block)) {
      errors.push('数学公式不能放在 ```text 代码块中，请改用 $$');
      break;
    }
  }

  const segments = extractMathSegments(content);
  if (segments.some((segment) => !segment.trim())) {
    errors.push('存在空的 $$ 公式');
  }
  if (segments.some((segment) => !checkBraces(segment))) {
    errors.push('公式中的 TeX 花括号未配对');
  }
  if (segments.some((segment) => !checkEnvironments(segment))) {
    errors.push('公式中的 TeX begin/end 环境未配对');
  }

  return errors;
}

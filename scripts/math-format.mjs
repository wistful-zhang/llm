import {
  extractKramdownMathSegments,
  validateKramdownMath,
} from '../docs/assets/js/latex-input-core.mjs';

const fencedTextBlocks = (source) => (
  [...source.matchAll(/^```text\s*\r?\n([\s\S]*?)^```\s*$/gm)].map((match) => match[1])
);

const looksLikeFormulaBlock = (source) => {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.some((line) => (
    /[=∑∏√∫≈≤≥∈∝]|\b(?:softmax|sigmoid|argmax|log|exp)\s*\(/i.test(line)
  ));
};

export const extractMathSegments = extractKramdownMathSegments;

export function validateMathFormatting(source = '') {
  const content = String(source);
  const errors = validateKramdownMath(content);
  if (errors.includes('公式分隔符 $$ 未成对')) return errors;

  for (const block of fencedTextBlocks(content)) {
    if (looksLikeFormulaBlock(block)) {
      errors.push('数学公式不能放在 ```text 代码块中，请改用 $$');
      break;
    }
  }

  return errors;
}

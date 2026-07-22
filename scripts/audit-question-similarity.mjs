import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseQuestionDocument } from './question-publication.mjs';

const questionsDir = fileURLToPath(new URL('../docs/_questions/', import.meta.url));
const threshold = Number(process.argv.find((argument) => argument.startsWith('--threshold='))?.split('=')[1] || 0.42);
const limit = Number(process.argv.find((argument) => argument.startsWith('--limit='))?.split('=')[1] || 80);

const normalize = (value) => String(value || '')
  .normalize('NFKC')
  .toLocaleLowerCase('zh-CN')
  .replace(/请(?:你)?|解释(?:一下)?|谈谈|说说|如何|怎么|怎样|为什么|是什么|有哪些|应该|能否/gu, '')
  .replace(/[\s\p{P}]+/gu, '');

const bigrams = (value) => {
  const normalized = normalize(value);
  if (normalized.length < 2) return new Set([normalized]);
  return new Set(Array.from({ length: normalized.length - 1 }, (_, index) => normalized.slice(index, index + 2)));
};

const dice = (left, right) => {
  let overlap = 0;
  left.forEach((token) => { if (right.has(token)) overlap += 1; });
  return (2 * overlap) / (left.size + right.size || 1);
};

const rows = readdirSync(questionsDir)
  .filter((name) => /\.(?:md|markdown)$/i.test(name))
  .map((filename) => {
    const parsed = parseQuestionDocument(readFileSync(join(questionsDir, filename), 'utf8'), filename);
    const title = String(parsed.values.get('title') || '');
    return { filename, title, grams: bigrams(title) };
  });

const matches = [];
for (let left = 0; left < rows.length; left += 1) {
  for (let right = left + 1; right < rows.length; right += 1) {
    const score = dice(rows[left].grams, rows[right].grams);
    if (score >= threshold) matches.push({ score, left: rows[left], right: rows[right] });
  }
}

matches.sort((a, b) => b.score - a.score);
console.log(`语义近似候选：${matches.length} 组（字符二元组 Dice ≥ ${threshold}，仅供人工复核）`);
matches.slice(0, limit).forEach(({ score, left, right }) => {
  console.log(`${score.toFixed(3)}\t${left.filename}\t${left.title}`);
  console.log(`     \t${right.filename}\t${right.title}`);
});
if (matches.length > limit) console.log(`其余 ${matches.length - limit} 组已省略，可用 --limit 调整。`);

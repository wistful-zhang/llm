import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseQuestionDocument } from './question-publication.mjs';
import { getPublicationState } from './publication-state.mjs';

const questionsDir = fileURLToPath(new URL('../docs/_questions/', import.meta.url));
const files = readdirSync(questionsDir).filter((name) => /\.(?:md|markdown)$/i.test(name)).sort();
const countBy = (rows, key) => Object.entries(rows.reduce((counts, row) => {
  const value = row[key] || '未填写';
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'));

const rows = files.map((filename) => {
  const parsed = parseQuestionDocument(readFileSync(join(questionsDir, filename), 'utf8'), filename);
  const value = (key) => parsed.values.get(key);
  return {
    filename,
    category: String(value('category') || ''),
    difficulty: String(value('difficulty') || ''),
    studyTier: String(value('study_tier') || 'unclassified'),
    publicationState: getPublicationState({
      published: value('published') === true,
      verified: value('verified') === true,
      answerStatus: String(value('answer_status') || ''),
      body: parsed.body,
    }),
    generated: filename.startsWith('exp1000-') ? '扩展批次' : '原有题目',
  };
});

console.log(JSON.stringify({
  total: rows.length,
  category: countBy(rows, 'category'),
  difficulty: countBy(rows, 'difficulty'),
  studyTier: countBy(rows, 'studyTier'),
  publicationState: countBy(rows, 'publicationState'),
  origin: countBy(rows, 'generated'),
}, null, 2));

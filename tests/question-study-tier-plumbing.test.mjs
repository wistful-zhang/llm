import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseQuestionDocument } from '../scripts/question-publication.mjs';
import {
  CORE_QUESTION_SLUGS,
  STUDY_TIERS,
  isStudyTier,
} from '../scripts/question-study-tier.mjs';

const execFileAsync = promisify(execFile);
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const questionsDirectory = new URL('docs/_questions/', root);

let questionRowsPromise;
const loadQuestionRows = () => {
  questionRowsPromise ||= (async () => {
    const filenames = (await readdir(questionsDirectory))
      .filter((filename) => /\.(?:md|markdown)$/i.test(filename))
      .sort();
    return Promise.all(filenames.map(async (filename) => {
      const source = await readFile(new URL(filename, questionsDirectory), 'utf8');
      const parsed = parseQuestionDocument(source, filename);
      return {
        filename,
        slug: filename.replace(/\.(?:md|markdown)$/i, ''),
        tier: String(parsed.values.get('study_tier') || ''),
        errors: parsed.errors,
      };
    }));
  })();
  return questionRowsPromise;
};

test('CMS 和手工模板为新题提供待重整默认值，同时允许旧题未分级', async () => {
  const [cms, template] = await Promise.all([
    read('.pages.yml'),
    read('docs/_templates/question.md'),
  ]);

  const field = cms.split('- name: study_tier')[1]?.split('\n      - name: tags')[0] || '';
  assert.match(field, /label: 备考层级/);
  assert.match(field, /default: archive/);
  assert.doesNotMatch(field, /required: true/);
  assert.match(field, /name: core[\s\S]*label: 核心必会/);
  assert.match(field, /name: role[\s\S]*label: 岗位专项/);
  assert.match(field, /name: extended[\s\S]*label: 扩展知识点/);
  assert.match(field, /name: archive[\s\S]*label: 待重整/);
  assert.match(template, /^study_tier: archive$/m);
});

test('题库报告包含四级迁移计数，并把缺失值兼容为 unclassified', async () => {
  const [reportScript, execution] = await Promise.all([
    read('scripts/report-question-bank.mjs'),
    execFileAsync(process.execPath, ['scripts/report-question-bank.mjs'], {
      cwd: new URL('.', root),
      encoding: 'utf8',
    }),
  ]);
  const report = JSON.parse(execution.stdout);
  const studyTierCount = Object.fromEntries(report.studyTier);

  assert.match(reportScript, /studyTier: String\(value\('study_tier'\) \|\| 'unclassified'\)/);
  assert.equal(report.total, 1000);
  assert.deepEqual(studyTierCount, {
    extended: 509,
    archive: 244,
    role: 147,
    core: 100,
  });
});

test('100 个核心必会 slug 存在、唯一，并与题目 frontmatter 精确对应', async () => {
  const rows = await loadQuestionRows();
  const availableSlugs = new Set(rows.map(({ slug }) => slug));
  const uniqueCoreSlugs = new Set(CORE_QUESTION_SLUGS);

  assert.equal(CORE_QUESTION_SLUGS.length, 100);
  assert.equal(uniqueCoreSlugs.size, 100);
  assert.deepEqual(
    CORE_QUESTION_SLUGS.filter((slug) => !availableSlugs.has(slug)),
    [],
    '核心清单中的每个 slug 都必须存在对应题目文件',
  );
  assert.deepEqual(
    rows.filter(({ tier }) => tier === 'core').map(({ slug }) => slug).sort(),
    [...uniqueCoreSlugs].sort(),
    'frontmatter 标为 core 的题目必须与核心清单完全一致',
  );
});

test('全部 1000 道题都使用合法层级并满足最终分布', async () => {
  const rows = await loadQuestionRows();
  const invalid = rows
    .filter(({ tier }) => !isStudyTier(tier))
    .map(({ filename, tier }) => `${filename}: ${tier || '<缺失>'}`);
  const parseFailures = rows
    .filter(({ errors }) => errors.length > 0)
    .map(({ filename, errors }) => `${filename}: ${errors.join('；')}`);
  const counts = Object.fromEntries(Object.keys(STUDY_TIERS).map((tier) => [
    tier,
    rows.filter((row) => row.tier === tier).length,
  ]));

  assert.equal(rows.length, 1000);
  assert.deepEqual(parseFailures, []);
  assert.deepEqual(invalid, []);
  assert.deepEqual(counts, {
    core: 100,
    role: 147,
    extended: 509,
    archive: 244,
  });
});

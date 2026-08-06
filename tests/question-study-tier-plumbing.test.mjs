import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseQuestionDocument } from '../scripts/question-publication.mjs';
import {
  CORE_QUESTION_SLUGS,
  ROLE_FROM_CORE_QUESTION_SLUGS,
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
      const referenceSection = source.split(/^## 参考资料\s*$/m)[1]?.split(/^##\s/m)[0] || '';
      return {
        filename,
        slug: filename.replace(/\.(?:md|markdown)$/i, ''),
        tier: String(parsed.values.get('study_tier') || ''),
        verified: parsed.values.get('verified') === true,
        hasReferenceUrl: /https?:\/\/[^\s)]+/i.test(referenceSection),
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
  assert.ok(report.total >= 232, `主题库至少应保留 232 道核验基础题，当前只有 ${report.total} 道`);
  assert.ok((studyTierCount.core || 0) >= 47, '至少应保留 47 道通用核心题');
  assert.ok((studyTierCount.role || 0) >= 185, '至少应保留 185 道岗位专项题');
});

test('归档题可以找回，但必须先作为未发布待重整内容重新核验', async () => {
  const archiveGuide = await read('QUESTION_ARCHIVE.md');

  assert.match(archiveGuide, /published: false/);
  assert.match(archiveGuide, /verified: false/);
  assert.match(archiveGuide, /study_tier: archive/);
  assert.match(archiveGuide, /面试时怎么答 \/ 核心回答 \/ 展开说明 \/ 工程实践 \/ 常见追问 \/ 一句话复习 \/ 参考资料/);
  assert.match(archiveGuide, /unverified-questions-768\.zip/);
  assert.match(archiveGuide, /D1302FDACB3C4C9088DD47D16991C83786BE7FEC495FD9AA5814795DF3388502/);
  assert.match(archiveGuide, /主库检查会继续拦截 `exp1000-` 旧批次文件/);
});

test('47 个通用核心与 38 个岗位迁移 slug 存在、唯一，并与 frontmatter 精确对应', async () => {
  const rows = await loadQuestionRows();
  const availableSlugs = new Set(rows.map(({ slug }) => slug));
  const uniqueCoreSlugs = new Set(CORE_QUESTION_SLUGS);
  const uniqueMovedSlugs = new Set(ROLE_FROM_CORE_QUESTION_SLUGS);

  assert.equal(CORE_QUESTION_SLUGS.length, 47);
  assert.equal(uniqueCoreSlugs.size, 47);
  assert.equal(ROLE_FROM_CORE_QUESTION_SLUGS.length, 38);
  assert.equal(uniqueMovedSlugs.size, 38);
  assert.deepEqual(
    CORE_QUESTION_SLUGS.filter((slug) => uniqueMovedSlugs.has(slug)),
    [],
    '通用核心和迁移到岗位专项的清单不能重叠',
  );
  assert.deepEqual(
    CORE_QUESTION_SLUGS.filter((slug) => !availableSlugs.has(slug)),
    [],
    '核心清单中的每个 slug 都必须存在对应题目文件',
  );
  assert.deepEqual(
    rows
      .filter(({ slug }) => uniqueCoreSlugs.has(slug) && slug)
      .filter(({ tier }) => tier !== 'core')
      .map(({ slug, tier }) => `${slug}: ${tier}`),
    [],
    '基础核心清单中的题目必须标为 core；以后可以继续增加自己的核心题',
  );
  assert.deepEqual(
    rows
      .filter(({ slug }) => uniqueMovedSlugs.has(slug) && slug)
      .filter(({ tier }) => tier !== 'role')
      .map(({ slug, tier }) => `${slug}: ${tier}`),
    [],
    '迁移清单中的题目必须标为岗位专项',
  );
});

test('主题库保留 232 道资料核验基础题，同时允许以后增加自己的题目', async () => {
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

  assert.ok(rows.length >= 232);
  assert.deepEqual(parseFailures, []);
  assert.deepEqual(invalid, []);
  assert.ok(rows.filter(({ verified }) => verified).length >= 232, '至少应保留 232 道资料核验题');
  assert.deepEqual(
    rows.filter(({ verified, hasReferenceUrl }) => verified && !hasReferenceUrl).map(({ filename }) => filename),
    [],
    '标记为资料核验的题目必须在“参考资料”中提供链接',
  );
  assert.deepEqual(rows.filter(({ filename }) => filename.startsWith('exp1000-')).map(({ filename }) => filename), []);
  assert.ok(counts.core >= 47);
  assert.ok(counts.role >= 185);
});

import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import batchA from '../scripts/question-batches/batch-a-foundations.mjs';
import batchB from '../scripts/question-batches/batch-b-application.mjs';
import batchC from '../scripts/question-batches/batch-c-evaluation-career.mjs';
import { parseQuestionDocument } from '../scripts/question-publication.mjs';
import {
  CORE_QUESTION_SLUGS,
  studyTierForExpansionBatch,
} from '../scripts/question-study-tier.mjs';

const questionsDirectory = new URL('../docs/_questions/', import.meta.url);
const generatedPrefix = 'exp1000-';
const generatedSource = '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核';
const batchEntries = [
  { filename: 'batch-a-foundations.mjs', records: batchA },
  { filename: 'batch-b-application.mjs', records: batchB },
  { filename: 'batch-c-evaluation-career.mjs', records: batchC },
];
const batches = batchEntries.map(({ records }) => records);
const batchQuestions = batches.flat();

const allowedCategories = new Set([
  'Agent',
  'LLM 基础',
  'NLP 与机器学习',
  'Prompt 与上下文工程',
  'RAG',
  '多模态',
  '工程实践',
  '推理与部署',
  '数学基础',
  '系统设计',
  '编程与框架',
  '训练与对齐',
  '训练工程',
  '评测与安全',
  '项目与行为面',
  '预训练与数据',
]);

let questionDocumentsPromise;
const loadQuestionDocuments = () => {
  questionDocumentsPromise ||= (async () => {
    const filenames = (await readdir(questionsDirectory))
      .filter((filename) => /\.(?:md|markdown)$/i.test(filename))
      .sort();
    const documents = [];
    for (const filename of filenames) {
      const source = await readFile(new URL(filename, questionsDirectory), 'utf8');
      documents.push({
        filename,
        parsed: parseQuestionDocument(source, filename),
      });
    }
    return documents;
  })();
  return questionDocumentsPromise;
};

test('三个扩充批次合计 768 道且 slug 唯一、分类合规', () => {
  assert.equal(batches.length, 3);
  batches.forEach((batch) => assert.ok(Array.isArray(batch)));
  assert.equal(batchQuestions.length, 768);
  assert.equal(new Set(batchQuestions.map(({ slug }) => slug)).size, 768);

  const invalidCategories = batchQuestions
    .filter(({ category }) => !allowedCategories.has(category))
    .map(({ slug, category }) => `${slug}: ${category}`);
  assert.deepEqual(invalidCategories, []);
});

test('扩题生成器按 slug 将 15 道批次题提升为核心必会', async () => {
  const generator = await readFile(new URL('../scripts/build-question-expansion.mjs', import.meta.url), 'utf8');
  const batchByGeneratedSlug = new Map(batchEntries.flatMap(({ filename, records }) => (
    records.map((record) => [`${generatedPrefix}${record.slug}`, { filename, record }])
  )));
  const promotedSlugs = CORE_QUESTION_SLUGS.filter((slug) => slug.startsWith(generatedPrefix));
  const counts = { core: 0, role: 0, extended: 0, archive: 0 };

  assert.equal(promotedSlugs.length, 15);
  assert.equal(new Set(promotedSlugs).size, 15);
  promotedSlugs.forEach((slug) => {
    const entry = batchByGeneratedSlug.get(slug);
    assert.ok(entry, `${slug} 必须存在于扩题批次`);
    assert.equal(
      studyTierForExpansionBatch(entry.filename, entry.record.slug),
      'core',
      `${slug} 必须由 slug 提升为核心必会`,
    );
  });

  batchEntries.forEach(({ filename, records }) => {
    records.forEach((record) => {
      counts[studyTierForExpansionBatch(filename, record.slug)] += 1;
    });
  });
  assert.deepEqual(counts, { core: 15, role: 0, extended: 509, archive: 244 });

  const slugAwareCalls = generator.match(/studyTierForExpansionBatch\(record\.batch,\s*record\.slug\)/g) || [];
  assert.ok(slugAwareCalls.length >= 2, '生成与校验都必须把 record.slug 传入层级判定函数');
});

test('扩充答案不会靠同一段通用套话批量拼接', () => {
  const occurrences = new Map();
  batchQuestions.forEach((record) => {
    ['guide', 'answer'].forEach((field) => {
      String(record[field] || '')
        .split(/[。！？；]/u)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length >= 18)
        .forEach((sentence) => {
          const owners = occurrences.get(sentence) || new Set();
          owners.add(record.slug);
          occurrences.set(sentence, owners);
        });
    });
  });

  const overusedSentences = [...occurrences]
    .filter(([, owners]) => owners.size > 4)
    .map(([sentence, owners]) => `${owners.size} 道共用：${sentence}`);
  assert.deepEqual(overusedSentences, []);
});

test('评测、编程与项目批次的追问都能在主答案中找到对应接法', () => {
  const followupQuestions = [];
  batchC.forEach((record) => {
    assert.equal(record.followups.length, 3, `${record.slug} 应有三条逐项追问`);
    record.followups.forEach((followup) => {
      followupQuestions.push(followup.q);
      assert.ok(
        record.answer.includes(followup.a),
        `${record.slug} 的追问回答必须对应主答案，而不是类别通用模板`,
      );
    });
  });
  assert.equal(new Set(followupQuestions).size, followupQuestions.length);
});

test('生成文件与批次 slug 精确一致，并保持统一的待逐题复核状态', async () => {
  const documents = await loadQuestionDocuments();
  const generatedDocuments = documents
    .filter(({ filename }) => filename.startsWith(generatedPrefix));
  const expectedFilenames = batchQuestions
    .map(({ slug }) => `${generatedPrefix}${slug}.md`)
    .sort();
  const actualFilenames = generatedDocuments
    .map(({ filename }) => filename)
    .sort();

  assert.equal(generatedDocuments.length, 768);
  assert.deepEqual(actualFilenames, expectedFilenames);

  const recordsByFilename = new Map(batchEntries.flatMap(({ filename: batchFilename, records }) => (
    records.map((record) => [
      `${generatedPrefix}${record.slug}.md`,
      { batchFilename, record },
    ])
  )));
  for (const { filename, parsed } of generatedDocuments) {
    const metadata = recordsByFilename.get(filename);
    assert.ok(metadata, `${filename} 必须对应一个批次 slug`);
    const { batchFilename, record } = metadata;
    assert.deepEqual(parsed.errors, [], `${filename} 应是有效的公开题目文档`);
    assert.equal(parsed.values.get('title'), record.title, `${filename} 标题必须与批次一致`);
    assert.equal(parsed.values.get('category'), record.category, `${filename} 分类必须与批次一致`);
    assert.equal(parsed.values.get('difficulty'), record.difficulty, `${filename} 难度必须与批次一致`);
    assert.equal(
      parsed.values.get('study_tier'),
      studyTierForExpansionBatch(batchFilename, record.slug),
      `${filename} 备考层级必须与批次及核心 slug 清单一致`,
    );
    assert.equal(parsed.values.get('published'), true, `${filename} 必须公开发布`);
    assert.equal(parsed.values.get('answer_status'), 'complete', `${filename} 必须包含完整答案`);
    assert.equal(parsed.values.get('verified'), false, `${filename} 在逐题复核前不得标为已核验`);
    assert.equal(parsed.values.get('source'), generatedSource, `${filename} 必须明确资料仍待逐题复核`);
  }
});

test('完整题库不少于 1000 道，且所有题目使用项目分类规范', async () => {
  const documents = await loadQuestionDocuments();
  assert.ok(documents.length >= 1000, `当前题库只有 ${documents.length} 道`);

  const invalidCategories = documents
    .filter(({ parsed }) => !allowedCategories.has(parsed.values.get('category')))
    .map(({ filename, parsed }) => `${filename}: ${String(parsed.values.get('category') || '<缺失>')}`);
  assert.deepEqual(invalidCategories, []);
});

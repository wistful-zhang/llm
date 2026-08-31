import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import test from 'node:test';
import { parseQuestionDocument } from '../scripts/question-publication.mjs';
import { findDuplicateQuestionNumberErrors } from '../scripts/validate-content.mjs';

const questionsDirectory = new URL('../docs/_questions/', import.meta.url);

const listQuestionFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const url = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      url.pathname += '/';
      files.push(...await listQuestionFiles(url));
    } else if (/\.(?:md|markdown)$/i.test(entry.name)) {
      files.push(url);
    }
  }
  return files;
};

test('现有仓库题保留唯一固定题号，历史锚点不漂移', async () => {
  const files = await listQuestionFiles(questionsDirectory);
  const assigned = [];

  for (const file of files) {
    const filename = basename(file.pathname);
    const source = await readFile(file, 'utf8');
    const parsed = parseQuestionDocument(source, filename);
    assert.deepEqual(parsed.errors, [], filename);
    const questionNumber = parsed.values.get('question_number');
    if (parsed.values.get('published') === true) {
      assert.ok(Number.isSafeInteger(questionNumber) && questionNumber > 0, filename);
    }
    if (Number.isSafeInteger(questionNumber) && questionNumber > 0) {
      assigned.push({
        filename,
        slug: filename.slice(0, -extname(filename).length),
        questionNumber,
      });
    }
  }

  assert.ok(assigned.length >= 232, '机械迁移的 232 道仓库题不能丢失固定题号');
  assert.deepEqual(findDuplicateQuestionNumberErrors(assigned), []);

  const bySlug = new Map(assigned.map(({ slug, questionNumber }) => [slug, questionNumber]));
  assert.deepEqual(
    Object.fromEntries([
      'xavier-he-initialization',
      'multimodal-visual-prompt-injection',
      'multimodal-training-stages',
      'multimodal-early-fusion-discrete-tokens',
      'multilingual-embedding-alignment',
      'multi-model-gpu-residency',
      'multi-lora-serving',
      'self-attention',
    ].map((slug) => [slug, bySlug.get(slug)])),
    {
      'xavier-he-initialization': 1,
      'multimodal-visual-prompt-injection': 61,
      'multimodal-training-stages': 62,
      'multimodal-early-fusion-discrete-tokens': 63,
      'multilingual-embedding-alignment': 64,
      'multi-model-gpu-residency': 65,
      'multi-lora-serving': 66,
      'self-attention': 232,
    },
  );
});

test('固定题号允许空洞，但拒绝任何已分配题号重复', () => {
  assert.deepEqual(findDuplicateQuestionNumberErrors([
    { filename: 'one.md', questionNumber: 1 },
    { filename: 'three.md', questionNumber: 3 },
  ]), []);

  const duplicates = findDuplicateQuestionNumberErrors([
    { filename: 'first.md', questionNumber: 7 },
    { filename: 'second.md', questionNumber: 7 },
  ]);
  assert.equal(duplicates.length, 1);
  assert.match(duplicates[0], /second\.md: question_number 7 与 first\.md 重复/);
});

test('首页按固定题号显示仓库题，并把新增动态题放在仓库题之后', async () => {
  const index = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
  const staticLoop = index.indexOf('{% for question in questions %}');
  const staticLoopEnd = index.indexOf('{% endfor %}', staticLoop);
  const publicContainer = index.indexOf('data-public-questions-list');
  const localContainer = index.indexOf('data-local-questions-list');

  assert.match(index, /published_questions \| sort: 'question_number'/);
  assert.match(index, /data-question-number="\{\{ question\.question_number \}\}"/);
  assert.match(index, /class="card-number"[^>]*>\{% if question\.question_number < 10 %\}00/);
  assert.doesNotMatch(index, /class="card-number"[^>]*forloop\.index/);
  assert.ok(staticLoop >= 0 && staticLoopEnd > staticLoop);
  assert.ok(publicContainer > staticLoopEnd, '公开新增题应排在仓库题之后');
  assert.ok(localContainer > publicContainer, '私人题应排在公开新增题之后');
});

test('Pages CMS 可视化填写固定题号，并默认按题号升序', async () => {
  const pages = await readFile(new URL('../.pages.yml', import.meta.url), 'utf8');

  assert.match(pages, /fields: \[question_number, title,/);
  assert.match(pages, /default:\s+sort: question_number\s+order: asc/);
  assert.match(
    pages,
    /- name: question_number\s+label: 固定题号\s+type: number\s+required: true[\s\S]*?min: 1/,
  );
});

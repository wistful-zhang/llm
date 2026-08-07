import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  addQuestionDraft,
  createEmptyQuestionDrafts,
  serializeQuestionDrafts,
} from '../docs/assets/js/question-drafts-core.mjs';
import { summarizeLocalQuestions } from '../docs/assets/js/local-questions-core.mjs';
import { selectLocalQuestions } from '../docs/assets/js/local-questions.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const add = (state, title, options = {}) => addQuestionDraft(state, {
  title,
  answer: options.answer || '',
  answerStatus: options.answerStatus || 'pending',
  category: options.category || 'LLM 基础',
  difficulty: options.difficulty || '待评估',
  tags: [],
  source: '',
  visibility: options.visibility || 'private',
}, {
  repositoryId: 'owner/repo',
  now: options.now,
  localDate: '2026-08-07',
});

test('首页本机题目摘要按更新时间展示，并保留旧摘要接口的可见性统计', () => {
  let state = createEmptyQuestionDrafts('owner/repo', '2026-08-07T00:00:00.000Z');
  state = add(state, '较早的私人题', { now: '2026-08-07T01:00:00.000Z' });
  state = add(state, '较新的公开准备题', {
    now: '2026-08-07T02:00:00.000Z',
    visibility: 'public',
    answer: '回答',
    answerStatus: 'complete',
  });

  const raw = serializeQuestionDrafts(state, { repositoryId: 'owner/repo' });
  const summary = summarizeLocalQuestions(raw, { repositoryId: 'owner/repo' });

  assert.equal(summary.total, 2);
  assert.equal(summary.complete, 1);
  assert.equal(summary.plannedPublic, 1);
  assert.deepEqual(summary.questions.map((question) => question.title), [
    '较新的公开准备题',
    '较早的私人题',
  ]);
  assert.equal(summary.questions[0].visibility, 'public');
});

test('首页本机题目继续按仓库隔离，并限制首屏数量', () => {
  let state = createEmptyQuestionDrafts('owner/repo', '2026-08-07T00:00:00.000Z');
  for (let index = 0; index < 9; index += 1) {
    state = add(state, `题目 ${index}`, { now: `2026-08-07T0${index}:00:00.000Z` });
  }
  const raw = serializeQuestionDrafts(state, { repositoryId: 'owner/repo' });

  assert.equal(summarizeLocalQuestions(raw, { repositoryId: 'owner/repo' }).questions.length, 6);
  assert.throws(
    () => summarizeLocalQuestions(raw, { repositoryId: 'another/repo' }),
    /属于另一个 GitHub 仓库/,
  );
});

test('首页先按可见性拆分本机题目，再限制每个分区的首屏数量', () => {
  const questions = [
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `private-${index}`,
      title: `私人题 ${index}`,
      visibility: 'private',
      answerStatus: 'pending',
      updatedAt: `2026-08-07T${String(index + 10).padStart(2, '0')}:00:00.000Z`,
      followUps: [],
    })),
    {
      id: 'public-with-follow-ups',
      title: '带追问的我的题目',
      visibility: 'public',
      answerStatus: 'complete',
      updatedAt: '2026-08-07T01:00:00.000Z',
      followUps: ['追问一', '追问二'],
    },
  ];

  const published = selectLocalQuestions(questions, { visibility: 'public', limit: 6 });
  const drafts = selectLocalQuestions(questions, { visibility: 'private', limit: 6 });

  assert.equal(published.total, 1);
  assert.equal(published.complete, 1);
  assert.equal(published.questions[0].id, 'public-with-follow-ups');
  assert.equal(published.questions[0].followUps.length, 2);
  assert.equal(drafts.total, 8);
  assert.equal(drafts.questions.length, 6);
  assert.ok(drafts.questions.every((question) => question.visibility === 'private'));
});

test('首页安全读取本机题目，不上传、不混入正式题库统计', async () => {
  const [home, layout, script, capturePage, captureScript] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/local-questions.js'),
    read('../docs/capture.html'),
    read('../docs/assets/js/question-capture.js'),
  ]);

  assert.equal(home.match(/\sdata-local-questions(?:\s|>)/g)?.length, 2);
  assert.match(capturePage, /id="question-draft-library"/);
  assert.match(home, /data-visibility="private"/);
  assert.match(home, /我的未发布草稿/);
  assert.match(home, /仅我可见 · 尚未发布/);
  assert.match(home, /data-visibility="public"/);
  assert.match(home, /id="my-published-questions"/);
  assert.match(home, /我的题目/);
  assert.match(home, /当前浏览器的题目区/);
  assert.match(home, /同步到 GitHub 后，其他人才能看见/);
  assert.match(home, /data-repository-id="{{ site\.github\.repository_nwo \| default: 'local\/llm-interview-notes'/);
  const libraryStart = home.indexOf('id="question-list-section"');
  assert.ok(home.indexOf('data-visibility="private"') < libraryStart);
  assert.ok(home.indexOf('data-visibility="public"') > libraryStart);
  assert.ok(home.indexOf('data-visibility="public"') < home.indexOf('{% if published_questions.size == 0 %}'));
  assert.match(layout, /assets\/js\/local-questions\.js/);

  assert.match(script, /document\.querySelectorAll\('\[data-local-questions\]'\)/);
  assert.match(script, /questionDraftsStorageKey\(repositoryId\)/);
  assert.match(script, /window\.localStorage\.getItem\(context\.storageKey\)/);
  assert.match(script, /parseQuestionDraftsJson\(raw, \{ repositoryId: context\.repositoryId \}\)/);
  assert.ok(script.indexOf(".filter((question) => !visibility || question.visibility === visibility)")
    < script.indexOf('questions: filtered.slice(0, limit)'));
  assert.match(script, /Array\.isArray\(question\.followUps\) \? question\.followUps\.length : 0/);
  assert.match(script, /`\$\{followUpCount\} 个追问`/);
  assert.match(script, /打开、补追问或同步 →/);
  assert.match(script, /window\.addEventListener\('storage'/);
  assert.match(script, /window\.addEventListener\('pageshow', renderAll\)/);
  assert.match(script, /window\.addEventListener\('focus', renderAll\)/);
  assert.match(script, /document\.addEventListener\('visibilitychange'/);
  assert.match(script, /element\.textContent = text/);
  assert.match(script, /context\.list\.replaceChildren/);
  assert.match(script, /url\.searchParams\.set\('edit', questionId\)/);
  assert.match(script, /url\.hash = 'question-draft-form'/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|Authorization|\.innerHTML\b|insertAdjacentHTML/);
  assert.doesNotMatch(script, /setItem|removeItem|clear\s*\(/);

  assert.match(captureScript, /searchParams\.get\('edit'\)/);
  assert.match(captureScript, /editQuestion\(requestedQuestion\)/);
  assert.match(captureScript, /没有在当前浏览器找到这道本机题目/);
});

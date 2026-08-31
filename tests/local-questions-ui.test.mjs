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

test('首页本机题目摘要按固定本机题号展示，并保留旧摘要接口的可见性统计', () => {
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
    '较早的私人题',
    '较新的公开准备题',
  ]);
  assert.deepEqual(summary.questions.map((question) => question.localNumber), [1, 2]);
  assert.equal(summary.questions[1].visibility, 'public');
});

test('本机题修改时间不会改变固定的创建顺序', () => {
  const questions = [{
    id: 'question-first',
    title: '第一道题',
    visibility: 'private',
    answerStatus: 'pending',
    localNumber: 1,
    createdAt: '2026-08-07T01:00:00.000Z',
    updatedAt: '2026-08-09T09:00:00.000Z',
  }, {
    id: 'question-second',
    title: '第二道题',
    visibility: 'private',
    answerStatus: 'complete',
    localNumber: 2,
    createdAt: '2026-08-07T02:00:00.000Z',
    updatedAt: '2026-08-07T02:00:00.000Z',
  }];

  assert.deepEqual(
    selectLocalQuestions(questions, { all: true }).questions.map((question) => question.id),
    ['question-first', 'question-second'],
  );
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

test('首页把公开与私人本机题目放进同一个选择结果', () => {
  const questions = [
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `private-${index}`,
      title: `私人题 ${index}`,
      visibility: 'private',
      answerStatus: 'pending',
      localNumber: index + 2,
      createdAt: `2026-08-07T${String(index + 10).padStart(2, '0')}:00:00.000Z`,
      updatedAt: `2026-08-07T${String(index + 10).padStart(2, '0')}:00:00.000Z`,
      followUps: [],
    })),
    {
      id: 'public-with-follow-ups',
      title: '带追问的我的题目',
      visibility: 'public',
      answerStatus: 'complete',
      localNumber: 1,
      createdAt: '2026-08-07T01:00:00.000Z',
      updatedAt: '2026-08-07T01:00:00.000Z',
      followUps: ['追问一', '追问二'],
    },
  ];

  const unified = selectLocalQuestions(questions, { all: true });

  assert.equal(unified.total, 9);
  assert.equal(unified.complete, 1);
  assert.equal(unified.questions.length, 9);
  assert.deepEqual(new Set(unified.questions.map((question) => question.visibility)), new Set([
    'private',
    'public',
  ]));
  assert.equal(
    unified.questions.find((question) => question.id === 'public-with-follow-ups')?.followUps.length,
    2,
  );
});

test('仓库题、本机题和共享公开题共用一个题目列表与同类卡片', async () => {
  const [
    home,
    layout,
    localScript,
    publicScript,
    searchScript,
    capturePage,
    captureScript,
  ] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/default.html'),
    read('../docs/assets/js/local-questions.js'),
    read('../docs/assets/js/public-questions.js'),
    read('../docs/assets/js/search.js'),
    read('../docs/capture.html'),
    read('../docs/assets/js/question-capture.js'),
  ]);

  const listStart = home.indexOf('<div id="question-list"');
  const listEnd = home.indexOf('<div class="library-results-bar">', listStart);
  assert.ok(listStart >= 0 && listEnd > listStart, '首页应包含唯一、完整的 #question-list');
  const questionList = home.slice(listStart, listEnd);

  assert.equal(home.match(/id="question-list"/g)?.length, 1);
  assert.equal(home.match(/\sdata-local-questions(?:\s|>)/g)?.length, 1);
  assert.equal(home.match(/\sdata-public-questions(?:\s|>)/g)?.length, 1);
  assert.match(questionList, /data-local-questions-list/);
  assert.match(questionList, /data-public-questions-list/);
  assert.match(questionList, /<a class="question-card"/);
  assert.doesNotMatch(home, /data-visibility="(?:private|public)"/);
  assert.doesNotMatch(home, /id="my-published-questions"|我的未发布草稿|访客公开补充/);
  assert.match(home, /一个题库 · 两种可见性/);
  assert.match(home, /公开题和私人题|公开题所有人都能看到/);
  assert.match(capturePage, /id="question-draft-library"/);
  assert.match(capturePage, /公开题和私人题都会进入首页的同一个题库/);
  assert.match(capturePage, /点击保存后由本站直接发布，并立即进入所有人可见的公开题库/);
  assert.match(home, /data-repository-id="{{ site\.github\.repository_nwo \| default: 'local\/llm-interview-notes'/);
  assert.match(home, /data-questions-api-url="{{ site\.data\.question_runtime\.api_url/);
  assert.match(layout, /assets\/js\/local-questions\.js/);
  assert.match(layout, /assets\/js\/public-questions\.js/);

  assert.match(localScript, /makeElement\('a', 'question-card question-card-local'\)/);
  assert.match(localScript, /私人 · 仅此浏览器/);
  assert.match(localScript, /公开失败 · 仅此浏览器/);
  assert.match(localScript, /publishedRemoteIds\.has\(question\.remoteId\)/);
  assert.match(localScript, /publishedLocalIds\.has\(question\.id\)/);
  assert.match(localScript, /question-library:public-loaded/);
  assert.match(localScript, /event\.detail\?\.remoteIds/);
  assert.match(localScript, /event\.detail\?\.localIds/);
  assert.match(localScript, /window\.localStorage\.getItem\(context\.storageKey\)/);
  assert.match(localScript, /parseQuestionDraftsJson\(raw, \{ repositoryId: context\.repositoryId \}\)/);
  assert.match(localScript, /context\.list\.replaceChildren/);
  assert.match(localScript, /url\.searchParams\.set\('edit', questionId\)/);
  assert.match(localScript, /url\.hash = 'question-draft-form'/);
  assert.match(localScript, /groupFollowUpsForDisplay\(question\.followUps\)\.length/);
  assert.match(localScript, /`私\$\{String\(localNumber\)\.padStart\(3, '0'\)\}`/);
  assert.match(localScript, /compareLocalQuestionNumber/);

  assert.match(publicScript, /makeElement\('a', 'question-card question-card-public'\)/);
  assert.match(publicScript, /card\.href = detailUrl\(question\.id\)/);
  assert.match(publicScript, /buildPublicQuestionDetailUrl/);
  assert.doesNotMatch(publicScript, /makeElement\('details'|public-question-details/);
  assert.match(publicScript, /question-visibility-public', '大家发布'/);
  assert.match(publicScript, /if \(question\.localId\) card\.dataset\.localId = question\.localId/);
  assert.match(publicScript, /remoteIds: questions\.map\(\(question\) => question\.id\)/);
  assert.match(publicScript, /localIds: questions\.map\(\(question\) => question\.localId\)\.filter\(Boolean\)/);
  assert.match(publicScript, /const cards = questions\.map\(\(question\) => createQuestion\(question, ownedByRemoteId\)\)/);
  assert.match(publicScript, /list\.replaceChildren\(\.\.\.cards\)/);
  assert.match(publicScript, /getRecoverableQuestionPublicationToken\(publicationTokens/);
  assert.match(publicScript, /const followUpCount = groupFollowUpsForDisplay\(question\.followUps\)\.length/);
  assert.match(publicScript, /`\$\{followUpCount\} 条追问`/);
  assert.match(publicScript, /`公\$\{String\(question\.libraryNumber\)\.padStart\(3, '0'\)\}`/);

  assert.match(searchScript, /questionList \? \[\.\.\.questionList\.querySelectorAll\('\.question-card'\)\] : \[\]/);
  assert.match(searchScript, /document\.addEventListener\('question-library:changed'/);
  assert.doesNotMatch(searchScript, /number\.textContent\s*=\s*String\(index \+ 1\)/);

  for (const script of [localScript, publicScript]) {
    assert.match(script, /\.textContent\s*=/);
    assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
    assert.doesNotMatch(script, /\bAuthorization\b/);
  }
  assert.doesNotMatch(localScript, /\bfetch\s*\(|XMLHttpRequest/);
  assert.doesNotMatch(localScript, /localStorage\.(?:setItem|removeItem|clear)\s*\(/);
  assert.match(publicScript, /window\.localStorage\.getItem\(questionPublicationTokensStorageKey\(repositoryId\)\)/);
  assert.doesNotMatch(publicScript, /localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage/i);
  assert.doesNotMatch(capturePage, /type=["']password["']|name=["'][^"']*(?:token|password|secret|pat)[^"']*["']/i);
  assert.doesNotMatch(captureScript, /\bAuthorization\b|\.innerHTML\b|insertAdjacentHTML/);

  assert.match(captureScript, /searchParams\.get\('edit'\)/);
  assert.match(captureScript, /editQuestion\(requestedQuestion\)/);
  assert.match(captureScript, /没有在当前浏览器找到这道本机题目/);
});

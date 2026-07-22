import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQueue,
  filterQuestions,
  isRating,
  restoreSession,
  shuffleQuestions,
  summarizeSession,
} from '../docs/assets/js/practice-core.mjs';

const questions = [
  { id: '/q/1/', title: '题目 1', category: 'RAG', difficulty: '困难', verified: true, url: '/q/1/' },
  { id: '/q/2/', title: '题目 2', category: 'Agent', difficulty: '困难', verified: false, url: '/q/2/' },
  { id: '/q/3/', title: '题目 3', category: 'RAG', difficulty: '简单', verified: false, url: '/q/3/' },
];

test('按分类和难度取交集，并按 ID 去重', () => {
  const result = filterQuestions([...questions, questions[0]], { category: 'RAG', difficulty: '困难' });
  assert.deepEqual(result.map((question) => question.id), ['/q/1/']);
});

test('可以只抽资料已核验或答案待复核的题目', () => {
  assert.deepEqual(filterQuestions(questions, { verification: 'verified' }).map((question) => question.id), ['/q/1/']);
  assert.deepEqual(filterQuestions(questions, { verification: 'review' }).map((question) => question.id), ['/q/2/', '/q/3/']);
  assert.equal(filterQuestions(questions, { verification: 'toString' }).length, 3);
});

test('Fisher–Yates 返回新数组且结果不重复', () => {
  const values = [0.8, 0.1];
  const shuffled = shuffleQuestions(questions, () => values.shift() ?? 0);
  assert.equal(shuffled.length, questions.length);
  assert.equal(new Set(shuffled.map((question) => question.id)).size, questions.length);
  assert.notEqual(shuffled, questions);
});

test('请求数量超过题库时只返回现有题目', () => {
  const queue = buildQueue(questions, { category: 'RAG' }, 10, () => 0);
  assert.equal(queue.length, 2);
  assert.ok(queue.every((question) => question.category === 'RAG'));
});

test('空题库和单题题库不会重复或越界', () => {
  assert.deepEqual(buildQueue([], {}, 5), []);
  assert.deepEqual(buildQueue([questions[0]], {}, 10).map((question) => question.id), ['/q/1/']);
});

test('汇总不会把自评表述成正确率，并按薄弱程度排序', () => {
  const records = [
    { id: '/q/1/', rating: 'prompted', durationMs: 2000 },
    { id: '/q/2/', rating: 'mastered', durationMs: 3000 },
    { id: '/q/3/', rating: 'unknown', durationMs: 1000 },
  ];
  const summary = summarizeSession(questions, records);
  assert.equal(summary.completed, 3);
  assert.equal(summary.counts.mastered, 1);
  assert.equal(summary.durationMs, 6000);
  assert.deepEqual(summary.weak.map((record) => record.rating), ['unknown', 'prompted']);
});

test('拒绝对象原型属性伪造的评分，并清理非法时长', () => {
  assert.equal(isRating('toString'), false);
  assert.equal(isRating('constructor'), false);
  const summary = summarizeSession(questions, [
    { id: '/q/1/', rating: 'toString', durationMs: 1000 },
    { id: '/q/2/', rating: 'mastered', durationMs: Number.POSITIVE_INFINITY },
    { id: '/q/3/', rating: 'prompted', durationMs: -10 },
  ]);
  assert.equal(summary.completed, 2);
  assert.equal(summary.durationMs, 0);
});

test('恢复时跳过已删除的未完成题并重置当前题状态', () => {
  const saved = {
    version: 1,
    repositoryId: 'owner/repo',
    phase: 'revealed',
    queue: questions,
    cursor: 1,
    records: [{ id: '/q/1/', rating: 'mastered', durationMs: 1000 }],
    pendingRating: 'prompted',
    currentElapsedMs: 5000,
  };
  const restored = restoreSession(saved, [questions[0], questions[2]], 'owner/repo');
  assert.equal(restored.cursor, 1);
  assert.equal(restored.queue[1].id, '/q/3/');
  assert.equal(restored.phase, 'asking');
  assert.equal(restored.currentElapsedMs, 0);
  assert.equal(restored.removedCount, 1);
});

test('所有剩余题被删除时保留已完成记录用于复盘', () => {
  const saved = {
    version: 1,
    repositoryId: 'owner/repo',
    phase: 'asking',
    queue: questions,
    cursor: 1,
    records: [{ id: '/q/1/', rating: 'mastered', durationMs: 1000 }],
  };
  const restored = restoreSession(saved, [questions[0]], 'owner/repo');
  assert.equal(restored.complete, true);
  assert.equal(restored.cursor, 1);
  assert.equal(restored.records.length, 1);
});

test('答案已展开时恢复评分选择和有限计时', () => {
  const restored = restoreSession({
    version: 1,
    repositoryId: 'owner/repo',
    phase: 'revealed',
    queue: [questions[0]],
    cursor: 0,
    records: [],
    pendingRating: 'prompted',
    currentElapsedMs: 4321,
  }, questions, 'owner/repo');
  assert.equal(restored.phase, 'revealed');
  assert.equal(restored.pendingRating, 'prompted');
  assert.equal(restored.currentElapsedMs, 4321);
});

test('恢复会话时用当前题库回填核验状态和题目元数据', () => {
  const restored = restoreSession({
    version: 1,
    repositoryId: 'owner/repo',
    phase: 'asking',
    queue: [{ ...questions[0], title: '旧标题', verified: false }],
    cursor: 0,
    records: [],
  }, questions, 'owner/repo');

  assert.equal(restored.queue[0].title, '题目 1');
  assert.equal(restored.queue[0].verified, true);
});

test('仓库标识或版本不一致时拒绝恢复', () => {
  assert.equal(restoreSession({ version: 1, repositoryId: 'other' }, questions, 'owner/repo'), null);
  assert.equal(restoreSession({ version: 2, repositoryId: 'owner/repo' }, questions, 'owner/repo'), null);
});

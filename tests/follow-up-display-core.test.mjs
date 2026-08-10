import test from 'node:test';
import assert from 'node:assert/strict';

import { groupFollowUpsForDisplay } from '../docs/assets/js/follow-up-display-core.mjs';

test('相邻的问题和回答会无损合并为题库格式', () => {
  const source = [
    '为什么说 LoRA 有效？',
    '因为下游任务通常只需要学习较小的权重增量。',
    'LoRA 一般加在哪里？',
    '通常加在线性层，尤其是 Attention 投影矩阵。',
  ];
  assert.deepEqual(groupFollowUpsForDisplay(source), [
    {
      question: '为什么说 LoRA 有效？',
      answer: '因为下游任务通常只需要学习较小的权重增量。',
    },
    {
      question: 'LoRA 一般加在哪里？',
      answer: '通常加在线性层，尤其是 Attention 投影矩阵。',
    },
  ]);
  assert.deepEqual(source, [
    '为什么说 LoRA 有效？',
    '因为下游任务通常只需要学习较小的权重增量。',
    'LoRA 一般加在哪里？',
    '通常加在线性层，尤其是 Attention 投影矩阵。',
  ]);
});

test('同一行的答法会拆分，而连续纯问题不会错误配对', () => {
  assert.deepEqual(groupFollowUpsForDisplay([
    '为什么不能都初始化为零？答：两侧会互相阻断初始梯度。',
    'Rank 是不是越低越好？',
    'LoRA 会减少基座矩阵乘吗？',
  ]), [
    {
      question: '为什么不能都初始化为零？',
      answer: '两侧会互相阻断初始梯度。',
    },
    { question: 'Rank 是不是越低越好？', answer: '' },
    { question: 'LoRA 会减少基座矩阵乘吗？', answer: '' },
  ]);
  assert.deepEqual(groupFollowUpsForDisplay([
    'LoRA 有什么优点？',
    'Rank 怎么选择',
  ]), [
    { question: 'LoRA 有什么优点？', answer: '' },
    { question: 'Rank 怎么选择', answer: '' },
  ]);
  assert.deepEqual(groupFollowUpsForDisplay([
    'MHA 是什么？MQA 又是什么？答：前者保留独立 KV 头，后者共享 KV 头。',
  ]), [{
    question: 'MHA 是什么？MQA 又是什么？',
    answer: '前者保留独立 KV 头，后者共享 KV 头。',
  }]);
});

test('英文问号、答案前缀和孤立内容都有稳定回退', () => {
  assert.deepEqual(groupFollowUpsForDisplay([
    'Where is LoRA applied?',
    '答: Usually on linear projections.',
    'Rank 怎么选择',
    '答：根据任务效果和资源预算一起选择。',
    '补充检查训练参数是否真的可更新',
  ]), [
    { question: 'Where is LoRA applied?', answer: 'Usually on linear projections.' },
    { question: 'Rank 怎么选择', answer: '根据任务效果和资源预算一起选择。' },
    { question: '补充检查训练参数是否真的可更新', answer: '' },
  ]);
  assert.deepEqual(groupFollowUpsForDisplay(null), []);
});

test('分组只整理文本结构，不改写公式或把 HTML 当成页面内容', () => {
  assert.deepEqual(groupFollowUpsForDisplay([
    '秩 $$r$$ 变大有什么影响？答：<img src=x onerror=alert(1)> 仍然只是普通答案文本。',
  ]), [{
    question: '秩 $$r$$ 变大有什么影响？',
    answer: '<img src=x onerror=alert(1)> 仍然只是普通答案文本。',
  }]);
});

test('“回答”和“解答”中的答字不会被误当成独立答案标签', () => {
  assert.deepEqual(groupFollowUpsForDisplay([
    '为什么要先给结论？',
    '面试时可以这样回答：先给结论。',
    '这道题如何展开？',
    '完整解答：再补原理与边界。',
  ]), [
    { question: '为什么要先给结论？', answer: '面试时可以这样回答：先给结论。' },
    { question: '这道题如何展开？', answer: '完整解答：再补原理与边界。' },
  ]);
  assert.deepEqual(groupFollowUpsForDisplay([
    '如何回答：先讲结论。',
    '解答：因为如此。',
  ]), [
    { question: '如何回答：先讲结论。', answer: '' },
    { question: '解答：因为如此。', answer: '' },
  ]);
});

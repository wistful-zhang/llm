---
title: 'Unigram Tokenizer 为什么从大词表开始再逐步删词？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Unigram'
  - 'SentencePiece'
  - '概率模型'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明它为子词赋概率，并删除对语料似然影响较小的候选。

**可以这样答：**

> Unigram 模型假设一段文本由若干子词独立生成，并为每个子词学习概率。训练从较大的候选词表开始，估计删掉各候选后语料负对数似然的增量，再迭代移除影响较小的子词。推理可用 Viterbi 找最佳切分，也能按概率采样多个切分用于正则化。

## 常见追问

1. **为什么不能一次删到目标大小？** 子词概率和最佳切分会随词表变化，需要反复重估才能避免一次性误删。
2. **它和 BPE 的主要差别是什么？** BPE 记录确定性合并过程，Unigram 显式建模候选切分概率并从词表中裁剪。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

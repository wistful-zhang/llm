---
title: '把相邻层分成组共享 KV，与全模型共享相比有什么优势？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'KV Sharing'
  - '分组共享'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明组内复用降低缓存，同时允许不同深度阶段保留各自记忆表示。

**可以这样答：**

> 全模型共享一组 K、V 压缩最大，但强迫所有深度查询同一记忆空间，表达限制很强。分组共享让相邻若干层复用缓存，不同组仍可在更高抽象层次重新编码历史。它在缓存节省和层级容量之间折中，组边界还可按流水线阶段或硬件切分设计。

## 常见追问

1. **组越大缓存越小吗？** 是，独立 KV 组数减少，但质量风险和组内层的耦合也增加。
2. **如何初始化共享 KV？** 可从某层权重复制或对组内权重合并，再通过继续训练恢复。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

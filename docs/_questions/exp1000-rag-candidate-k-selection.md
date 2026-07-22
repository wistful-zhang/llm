---
title: 'RAG 召回的 Top K 应该怎样选，为什么不是越大越好？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '中等'
tags:
  - 'Top K'
  - '候选集'
  - '上下文预算'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分召回 K、重排 K 和最终上下文 K，并用边际收益曲线回答。

**可以这样答：**

> 召回阶段的 K 可以较大以保证候选覆盖，重排后只选择少量高价值证据进入上下文，这几个 K 不应混为一个参数。K 增大能提高潜在 Recall，但也增加重排延迟、Token 和干扰信息。应观察正确证据随 K 的累积召回曲线，以及最终答案质量何时不再提升。不同问题复杂度可动态取值，多跳问题通常需要更多候选，精确 FAQ 则不必。

## 常见追问

1. **最终上下文只取分数最高的几段吗？** 还要去重、控制来源多样性和覆盖不同子问题，不能只按单一分数截断。
2. **动态 K 怎么估计？** 可依据查询类型、头部与尾部分数差、检索器一致性和可用 Token 预算。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)

---
title: '上下文窗口有限时，系统提示、历史对话、检索证据和当前问题该怎么分配 Token？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'core'
tags:
  - '上下文窗口'
  - 'Token 预算'
  - 'RAG'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把预算分配讲成可观测的工程策略：哪些必须保留、哪些可裁剪，以及如何给输出预留空间。

**可以这样答：**

> 先为系统约束和当前问题保留不可压缩的预算，再给模型输出预留明确的最大长度。历史对话按与当前任务的相关性选择，检索证据按可信度和边际收益装入，而不是简单截取最近若干条。超出预算时可先删除重复信息，再摘要旧历史，但关键事实和原始证据引用要保留。线上应记录各分区 Token 占用、截断位置和质量指标，用评测数据调整配额。

## 常见追问

1. **为什么不能把窗口全部塞满？** 需要给输出留空间，而且过多低相关内容会稀释关键信号、增加延迟和成本。
2. **预算应该固定比例吗？** 不应完全固定，可按任务类型、检索置信度和预计输出长度动态分配，同时设置上下限。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

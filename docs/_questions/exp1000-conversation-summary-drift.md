---
title: '对话历史不断摘要后出现事实漂移，怎么发现和修复？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '会话摘要'
  - '事实漂移'
  - '记忆'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明摘要是有损状态，回答要包含来源锚点、结构化事实和周期性重建。

**可以这样答：**

> 递归摘要会把早期的小错误固化并放大，所以不能把摘要当作唯一事实源。重要事实应以结构化字段保存，并附原始消息 ID、说话人和确认状态；摘要只负责叙事压缩。更新摘要时应基于旧摘要加最近原文，同时定期从原始记录重新构建并比较差异。发生冲突时优先引用用户明确确认的原文，让模型标出不确定项而不是自行补全。

## 常见追问

1. **原始记录太长无法重建怎么办？** 可以分段抽取稳定事实再合并，保留证据索引，并对高价值字段做确定性存储。
2. **怎样量化摘要漂移？** 建立关键事实问答集，比较摘要前后的事实一致率、遗漏率和错误新增率。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

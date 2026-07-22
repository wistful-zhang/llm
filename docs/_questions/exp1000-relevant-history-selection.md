---
title: '多轮会话很长时，怎样挑选真正相关的历史消息？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '会话检索'
  - '上下文选择'
  - '相关性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出最近消息、语义相关消息和固定状态三路组合，并说明顺序与去重。

**可以这样答：**

> 通常保留最近几轮以维持局部连贯，再从更早历史中检索与当前意图相关的消息，同时注入独立维护的长期状态。检索不能只看语义相似度，还要考虑说话人、时间、是否已被更正和会话主题。选出的片段按时间或因果关系组织，并去掉重复摘要，避免模型误判先后。对涉及承诺、金额或权限的事实，应回到原始消息并要求确认。

## 常见追问

1. **可以直接把每条消息做向量检索吗？** 可以作为候选召回，但短消息语义不足，常需要与相邻轮次组成上下文块并增加元数据。
2. **最近几轮固定保留多少合适？** 没有通用数字，应根据对话长度、任务类型和评测中的指代解析成功率调整。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

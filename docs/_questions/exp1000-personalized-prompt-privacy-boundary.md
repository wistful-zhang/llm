---
title: '个性化 Prompt 可以放哪些用户信息，怎样避免隐私越界？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '个性化'
  - '隐私'
  - '最小化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

围绕目的限制、最少数据、用户控制和日志脱敏回答，并区分个性化与隐性画像。

**可以这样答：**

> 只应注入完成当前功能必要且用户可预期的信息，例如语言偏好或已选择的专业程度。敏感属性、跨场景行为和原始身份信息要默认排除，确有需要时获得明确授权并设置保留期限。用户应能查看、修改和删除用于个性化的状态，应用也要防止不同账号或租户之间串数据。Prompt 日志和调试平台应做脱敏，并限制能查看原文的人员范围。

## 常见追问

1. **把用户资料摘要后就不算敏感了吗？** 不一定，摘要仍可能包含可识别或敏感推断，必须按内容和用途而不是格式判断。
2. **个性化信息应该每轮都注入吗？** 只注入与当前任务相关的字段，并允许用户临时关闭，避免无关信息影响回答。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

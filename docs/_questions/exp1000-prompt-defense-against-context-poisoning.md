---
title: '用户在多轮对话里逐步污染上下文，Prompt 层面怎么识别和限制？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '上下文污染'
  - '多轮安全'
  - '状态管理'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答跨轮风险累积、状态分层和安全策略不可被会话摘要覆盖。

**可以这样答：**

> 系统应把安全策略、用户偏好和任务事实分成不同状态域，低信任消息不能修改高信任策略。每轮更新记忆时检查是否出现权限升级、身份替换或让后续忽略规则的内容，并只保存完成任务所需事实。安全判定不能依赖可能已被污染的自由文本摘要，要从原始消息和独立策略重新计算。达到风险阈值时清理任务上下文、停止工具调用并要求重新确认。

## 常见追问

1. **新开会话就能完全解决吗？** 能清除当前上下文，但若长期记忆已被污染仍会复现，因此还要审计和删除记忆条目。
2. **怎样判断用户是在正常纠正事实还是污染？** 看修改对象、权限和证据；允许纠正业务事实，但不能用用户文本改写系统安全策略。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

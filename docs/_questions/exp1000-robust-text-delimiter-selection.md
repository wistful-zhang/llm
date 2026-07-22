---
title: '选择 Prompt 分隔符时需要考虑什么，分隔符能防注入吗？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - '分隔符'
  - '数据边界'
  - '注入'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答分隔符的可解析性与转义策略，并明确它只能改善边界识别。

**可以这样答：**

> 分隔符应固定、醒目且不容易出现在业务文本中，最好由结构化消息或序列化格式生成。用户内容中若可能出现同样标记，需要转义、编码或使用长度字段，避免边界被伪造。分隔符可以帮助模型和程序理解哪部分是数据，但不能阻止模型服从数据里的恶意语义。真正的安全边界仍是工具权限、参数校验和副作用确认。

## 常见追问

1. **随机生成分隔符会更安全吗？** 能减少意外碰撞，但不会消除语义注入，而且还要确保解析和日志一致。
2. **结构化消息一定比纯文本安全吗？** 边界更清晰，但模型最终仍会看到内容，安全能力取决于整个执行链路。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

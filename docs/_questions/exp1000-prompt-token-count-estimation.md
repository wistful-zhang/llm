---
title: '上线前怎样准确估算 Prompt 的 Token 数，而不是按字符数猜？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - 'Tokenizer'
  - 'Token 预算'
  - '成本'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明必须使用目标模型对应 Tokenizer，并考虑消息包装、工具 schema 与输出预算。

**可以这样答：**

> Token 数取决于具体 Tokenizer，中文、代码和特殊符号的字符到 Token 比例差异很大。应使用目标模型或服务端公开的计数器，对完整请求计算，包括消息角色包装、工具定义、图片占位和系统自动加入的字段。输入预算之外还要为输出和可能的工具往返留空间。线上记录服务端实际计费 Token，与本地估算对账并设置超限降级。

## 常见追问

1. **换模型后为什么估算会变？** 模型可能使用不同词表和消息模板，同一字符串会被切成不同数量的 Token。
2. **字符数能否作为快速上限？** 可以做保守预警，但不能用于精确计费或窗口边界，应留足安全余量。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

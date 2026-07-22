---
title: '只靠 Prompt 要求输出 JSON，怎样提高格式成功率？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - 'JSON'
  - '结构化输出'
  - '校验'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答应包含精确 schema、单一示例、禁止多余文本和解析失败后的受控重试，并指出约束解码更可靠。

**可以这样答：**

> 应明确字段名、类型、必填项、枚举值和空值含义，并给出一个与真实结构一致的短示例。要求只返回数据对象，避免在前后添加解释，同时不要让示例包含会被机械照抄的业务值。服务端必须用 schema 解析和校验，失败后把具体错误反馈给模型做有限次数修复。若模型接口支持原生结构化输出或语法约束解码，应优先使用，因为 Prompt 不能保证百分之百合法。

## 常见追问

1. **为什么示例太多反而可能有问题？** 多个示例可能含互相不一致的可选字段，模型还可能复制示例值而不是根据输入生成。
2. **解析失败可以无限重试吗？** 不可以，应限制次数并记录错误，持续失败时走降级或人工处理，避免成本和延迟失控。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

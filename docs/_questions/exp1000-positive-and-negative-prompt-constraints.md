---
title: 'Prompt 里应该多写“要做什么”还是“不要做什么”？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - '约束设计'
  - '可执行性'
  - 'Prompt'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调正向替代行为比单纯禁止更可执行，同时保留少量高风险禁令。

**可以这样答：**

> 模型更容易执行具体的正向行为，所以应优先描述期望输出以及遇到边界情况时该怎么做。禁止项适合用于少数明确风险，例如不得编造来源，但最好同时给出替代动作，例如证据不足时标记待核实。过长的否定清单会增加冲突和遗漏概率，还可能把不希望出现的模式带进上下文。最终应把关键规则转成自动检查，而不是完全依赖模型记住。

## 常见追问

1. **敏感词黑名单有用吗？** 可作一层粗筛，但容易误伤和绕过，应结合语义分类、策略引擎与人工复核。
2. **否定指令为什么可能适得其反？** 它提供了相关概念却没给替代路径，模型在复杂生成中仍可能复现该模式。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

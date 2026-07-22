---
title: '在 Prompt 开头和结尾重复关键指令，什么时候有帮助，什么时候会适得其反？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '指令位置'
  - '重复'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明重复可强化长上下文边界，但会增加冲突和维护风险，必须保持单一来源。

**可以这样答：**

> 在长文档后重申当前问题和少量关键输出约束，有时能缓解模型忘记开头要求。重复内容必须语义完全一致，最好由同一配置生成，否则改动一处后会形成隐蔽冲突。安全政策和复杂规则不宜整段复制多次，因为会浪费上下文并放大噪声。是否保留重复应通过位置和长度对照测试决定。

## 常见追问

1. **应该重复哪些内容？** 通常只重复最终任务、输出格式和最关键的一两个边界，不重复背景说明。
2. **为什么同义改写也可能冲突？** 自然语言边界可能细微变化，模型会同时尝试满足两种表述，导致行为不稳定。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

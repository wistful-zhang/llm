---
title: '怎样让模型输出足够完整，又不总是写得过长？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - '输出长度'
  - '结构'
  - 'Token'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

使用内容优先级、结构上限和停止条件回答，不要只建议限制 max_tokens。

**可以这样答：**

> Prompt 应规定必须覆盖的要点和可选展开内容，例如先给结论，再给不超过三条依据。对列表、段落和字段设置明确上限，比模糊地说“简洁”更稳定。max_tokens 只是硬截断，设得太小可能让答案在句中结束，所以仍需留出完成结构的空间。若内容很多，可以先给摘要并提供按需展开，而不是一次塞完。

## 常见追问

1. **要求固定字数可靠吗？** 只能近似，模型按 Token 生成且不会精确计字，更适合限制段落和要点数量。
2. **模型总在结尾重复总结怎么办？** 明确禁止重复结论，并用回归样本验证；必要时在展示层移除固定冗余结构。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

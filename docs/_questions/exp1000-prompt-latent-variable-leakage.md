---
title: '把内部评分、风险标签等隐藏变量放进 Prompt，会带来哪些副作用？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '困难'
tags:
  - '内部标签'
  - '泄露'
  - '偏差'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明模型可能复述、过度依赖或被用户操纵，并建议最小化与服务端决策。

**可以这样答：**

> 内部评分进入上下文后可能被模型直接复述给用户，也可能成为捷径，让回答忽略原始证据。风险标签若定义含糊，还会放大历史偏差并造成不同群体待遇不一致。只注入生成确实需要的离散决策，不展示原始敏感分数，权限和阻断仍在服务端执行。评测时应检查模型能否从输出反推出隐藏字段，并测试用户诱导修改这些字段的情况。

## 常见追问

1. **用模糊代号替代标签名安全吗？** 只能降低直观可读性，模型仍可能学到相关行为，不能视为安全隔离。
2. **模型需要知道风险等级才能调整语气怎么办？** 可提供最小行为指令，例如需要谨慎解释，而不暴露评分来源和具体数值。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

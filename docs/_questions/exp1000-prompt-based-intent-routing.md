---
title: '用 LLM 做意图路由时，Prompt 应该如何设计？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '意图识别'
  - '路由'
  - '分类'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答要有互斥标签定义、拒判机制和路由后的权限边界，不能只给几个示例。

**可以这样答：**

> 先把路由标签定义为互斥且可执行的业务动作，并为每个标签写清边界和典型反例。输出只包含标签、置信理由所需的最少字段以及是否需要澄清，不让模型直接执行高风险动作。对多意图输入可允许返回有序列表，或先让用户选择主要目标。线上要记录混淆矩阵和拒判率，低置信或未知意图进入安全兜底流程。

## 常见追问

1. **模型输出的置信分数可信吗？** 不能直接当作校准概率，应通过历史数据校准，或用一致性和规则信号共同决策。
2. **新增意图时最容易出什么问题？** 新旧标签边界重叠导致路由漂移，因此要重跑全量回归集而不是只测新增样本。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

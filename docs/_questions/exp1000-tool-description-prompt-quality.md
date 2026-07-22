---
title: '为什么工具描述写得不好会让模型选错工具，应该怎么写？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '工具调用'
  - '描述设计'
  - 'Schema'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

覆盖工具适用边界、参数语义、反例和副作用，强调名称本身不够。

**可以这样答：**

> 模型主要依据工具名称、描述和参数 schema 判断何时调用，描述模糊会让相似工具互相竞争。应写清工具解决的问题、不适用场景、必需参数、单位、时间范围和返回值含义。对会产生副作用的工具要明确标记，并说明何时必须先征得确认。工具集合较大时可先检索候选工具，再把少量完整定义放入上下文，降低误选率。

## 常见追问

1. **工具名需要很长吗？** 不需要，但应稳定且有区分度；详细边界放在描述和 schema 中。
2. **要不要在描述里放调用示例？** 复杂参数可放一个最小示例，但示例不能替代字段约束，也不要包含真实密钥或用户数据。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

---
title: '做文档摘要时，Prompt 怎样避免加入原文没有的解释？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '摘要'
  - '忠实性'
  - '证据'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调抽取式锚点、事实边界和生成后蕴含检查，不要仅写“忠于原文”。

**可以这样答：**

> 先定义摘要目标和受众，并要求事实、数字、因果关系只能来自给定文档。关键结论附段落 ID或原文位置，遇到原文含糊或冲突时保留不确定性。可以先抽取事实表，再基于事实表压缩表达，减少直接自由生成的空间。生成后用引用存在性和文本蕴含检查抽样验证，发现新增主张时回退到更保守模板。

## 常见追问

1. **摘要可以补充常识背景吗？** 只有产品明确需要且能区分来源时可以，应单列为外部背景，不能混成原文结论。
2. **抽取式摘要一定更忠实吗？** 通常更少新增事实，但仍可能断章取义，必须保留上下文和选择标准。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

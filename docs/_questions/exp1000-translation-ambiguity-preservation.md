---
title: '让模型翻译需求再执行任务时，怎样处理原文里的歧义？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '翻译'
  - '歧义'
  - '需求澄清'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答要保留原文、列出候选解释，并按风险决定澄清还是继续。

**可以这样答：**

> 翻译阶段应保留原文和关键术语，不要默默选择一个可能错误的含义。对会改变业务结果的歧义，先列出候选解释并向用户确认；低风险场景可采用最常见解释，但要显式标注假设。日期、金额、单位、否定词和专有名词需要额外检查。执行结果应能追溯到采用的解释，方便发现是翻译错误还是任务执行错误。

## 常见追问

1. **所有歧义都询问用户会不会很烦？** 会，所以应按影响分级，只有会显著改变结果或触发副作用的歧义才阻塞确认。
2. **专有名词怎么处理？** 优先保留原文或使用用户提供的词表，不确定时不要自行创造译名。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

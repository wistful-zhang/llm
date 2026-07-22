---
title: '输入字段缺失时，Prompt 里应该怎么定义默认值？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '缺失值'
  - '默认值'
  - '数据契约'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分安全默认、业务默认和必须澄清的字段，并建议默认值在代码侧落地。

**可以这样答：**

> 每个字段要区分缺失、空字符串和显式零值，不能让模型自行猜测它们等价。无风险展示字段可以使用公开默认值，影响权限、金额或收件人的字段缺失时必须阻止执行并询问。默认值最好由程序在进入 Prompt 前填充，并把采用的默认显示给模型和用户。这样同一规则不会因措辞或模型版本变化而漂移。

## 常见追问

1. **为什么模型很容易把缺失值补全？** 语言模型倾向生成连贯模式，会根据常见分布猜测，但猜测不等于业务事实。
2. **默认时区能设为服务器时区吗？** 只有业务明确如此才可以，面向用户的时间通常应使用用户时区并展示确认。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

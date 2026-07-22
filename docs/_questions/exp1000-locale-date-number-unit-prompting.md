---
title: 'Prompt 涉及日期、数字和单位时，怎样避免地区格式误解？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
study_tier: 'extended'
tags:
  - '本地化'
  - '日期'
  - '单位'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出明确时区、ISO 日期、单位和小数规则，并要求原值与标准化值并存。

**可以这样答：**

> 输入中应明确时区和地区，日期尽量标准化为 YYYY-MM-DD，时间带上 UTC 偏移。金额要包含货币代码，物理量写明单位，小数点和千位分隔不能靠模型猜测。模型输出可同时保留用户原值和标准化值，转换由确定性代码完成。遇到 03/04/2026 这类歧义格式，应询问或拒绝自动执行高风险操作。

## 常见追问

1. **为什么不让模型直接换算单位？** 简单换算也可能因精度和上下文出错，程序计算更可重复，模型适合解释结果。
2. **相对日期“下周五”怎么处理？** 必须结合当前日期、用户时区和周起始约定解析，并把解析出的绝对日期展示给用户确认。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

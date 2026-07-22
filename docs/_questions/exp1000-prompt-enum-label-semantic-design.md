---
title: '让模型输出枚举标签时，标签名应该怎样设计才不容易混淆？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '枚举'
  - '分类'
  - 'Schema'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明互斥、语义清楚、机器稳定值与用户展示名分离。

**可以这样答：**

> 枚举应尽量互斥并覆盖业务需要，每个值都有定义、正例和容易混淆的反例。机器使用的稳定值应短且不随文案本地化变化，用户展示名可以在应用层转换。不要同时存在“其他”“未知”“无法判断”等边界重叠标签，除非分别定义触发条件。新增或合并枚举会改变历史统计和路由逻辑，需要版本化并重跑回归。

## 常见追问

1. **标签可以用数字 1、2、3 吗？** 机器可用，但模型更容易理解有语义的稳定字符串，数字还容易因顺序变化产生错误。
2. **多标签任务怎么避免模型全选？** 定义每个标签的必要条件和最多数量，并要求证据，不满足门槛时不选择。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

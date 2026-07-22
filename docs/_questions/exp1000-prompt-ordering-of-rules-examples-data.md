---
title: '规则、示例、背景资料和用户问题在 Prompt 中一般怎样排序？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - 'Prompt 结构'
  - '信息排序'
  - '上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出常用结构并解释原因，同时承认要按模型和任务评测。

**可以这样答：**

> 常见做法是先放角色和稳定规则，再放输出契约与少量示例，随后提供背景资料，最后重述当前问题。这样规则先建立任务边界，问题靠近生成位置，长资料与指令也更容易区分。工具定义通常随稳定规则放置，但动态工具结果应靠近使用它的步骤。排序不是绝对标准，应针对长短上下文和具体模型做位置扰动测试。

## 常见追问

1. **为什么用户问题要放在最后？** 它靠近输出位置可减轻长资料后的遗忘，但开头仍可先说明总体任务。
2. **示例应放在资料前还是后？** 通常放资料前能稳定格式，但若示例依赖资料字段，可紧邻任务说明并保持边界清楚。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

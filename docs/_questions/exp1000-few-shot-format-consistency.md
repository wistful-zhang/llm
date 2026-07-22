---
title: 'Few-shot 示例的格式不一致会造成什么问题，如何治理？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Few-shot'
  - '输出格式'
  - '模板'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

围绕模型的模式模仿特性回答，并把格式检查落到生成前和生成后。

**可以这样答：**

> 模型会把示例同时当作内容和输出模式学习，字段顺序、标点或缺失值不一致会增加格式漂移。应由同一模板生成示例，统一字段、枚举和空值表达，只保留与任务有关的差异。示例数据进入 Prompt 前可做 schema 校验，生成结果也要再次解析。格式发生升级时要整体迁移示例，避免新旧版本混用。

## 常见追问

1. **字段顺序真的重要吗？** 对严格 JSON 语义不重要，但对概率生成的模式稳定性可能有影响，统一顺序更容易测试。
2. **示例可以由模型自动生成吗？** 可以作为候选，但必须经过规则校验和人工抽检，不能把模型错误继续放大。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

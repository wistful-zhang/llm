---
title: '同一个 Prompt 多跑几次答案差异很大，应该怎么评估和治理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '随机性'
  - '稳定性'
  - '评测'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分采样随机、任务歧义和后端非确定性，回答应包含重复运行与稳定性指标。

**可以这样答：**

> 先固定模型版本和采样参数，并对同一输入重复运行，判断差异来自采样还是任务定义不清。除了平均质量，还要记录最差表现、格式成功率和关键事实的一致率。可以收紧输出 schema、补充判定边界、降低采样随机性，并把确定性计算交给工具。即使温度设为零，分布式内核、模型服务升级或并列概率也可能带来细微变化，所以关键流程仍需校验。

## 常见追问

1. **温度设为零就一定完全确定吗？** 不一定，服务实现和底层计算仍可能非确定，模型版本变化也会改变结果。
2. **创意任务也要追求稳定吗？** 不必追求措辞相同，但安全约束、事实边界和输出格式仍应稳定。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

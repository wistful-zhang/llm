---
title: '不同层的 Attention Head 为什么会表现出不同类型的专门化？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Attention Head'
  - '可解释性'
  - '层级表示'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把底层局部模式、中层句法、高层语义作为观察而非硬规则，并提醒因果证据。

**可以这样答：**

> 层级计算让浅层先接触局部词形和位置模式，后续层在其基础上组合更长程语义，因此 Head 可能形成不同关注习惯。训练目标只约束最终预测，并没有明确给每个 Head 分工，专门化是协同优化的结果。注意力图只能说明权重分配，是否真正承担某功能还要用消融或干预验证。

## 常见追问

1. **看到某 Head 关注分隔符能说明什么？** 只能形成假设，还需屏蔽或替换该 Head 检查模型行为是否改变。
2. **Head 专门化会跨模型稳定出现吗？** 部分模式可能重复，但具体层号和 Head 编号通常不具可比性。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

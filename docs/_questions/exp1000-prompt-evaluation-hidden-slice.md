---
title: '为什么 Prompt 优化需要保留一份从不参与调试的隐藏测试集？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '评测过拟合'
  - '测试集'
  - '泛化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释反复看同一评测集会形成选择偏差，并给出开发集、隐藏集与线上验证分工。

**可以这样答：**

> 团队反复根据同一批失败案例修改 Prompt，会逐渐针对该集合过拟合，即使没有训练模型参数也会产生选择偏差。开发集用于快速定位和迭代，隐藏集只在候选版本冻结后评估，用来估计对未见流量的泛化。隐藏集也应定期更新，但更新前保留历史基准以观察长期趋势。最终还需小流量线上验证，因为离线集合无法覆盖真实交互和系统依赖。

## 常见追问

1. **隐藏集结果不好还能继续看样本改吗？** 一旦查看并据此调试，它就变成开发集，应另建新的隐藏集合评估最终版本。
2. **团队规模小也需要吗？** 需要，哪怕只保留一小批不参与日常调试的样本，也能减少自我欺骗。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

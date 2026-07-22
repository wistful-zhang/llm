---
title: '怎样提示模型在不确定时承认不知道，而不是编造答案？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '不确定性'
  - '拒答'
  - '事实性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出可执行的证据门槛、缺失信息表达和下一步动作，避免只写“不要幻觉”。

**可以这样答：**

> Prompt 应明确答案必须基于哪些输入或来源，并规定证据不足时使用固定的未知状态。要求模型区分已知事实、合理推断和待核实信息，同时给出需要补充的资料或可执行查询。不要强迫每个问题都得出结论，也不要把模型自报置信度直接当概率。应用可通过引用校验、检索覆盖和事实检查决定是否展示、降级或转人工。

## 常见追问

1. **要求模型给 0 到 1 的置信分有用吗？** 可作为特征，但通常未校准，必须用标注数据验证分数与真实正确率的关系。
2. **模型总是过度保守怎么办？** 调整证据门槛并评估拒答与错误回答的业务代价，按风险场景采用不同策略。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

---
title: '做分类 Prompt 时，Few-shot 样例应该怎样覆盖类别和边界？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Few-shot'
  - '分类'
  - '样例设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明代表性、难例、反例和类别先验之间的平衡，并给出验证方式。

**可以这样答：**

> 样例既要覆盖常见类别，也要包含容易混淆的边界案例，并保持标注规则一致。类别数量可以适度平衡，但不应伪装真实先验；若线上分布极不均衡，应在规则中明确决策阈值或拒判条件。每个示例最好附极短的判定依据，避免模型只匹配表面关键词。评测时要轮换样例顺序和样例集合，确认提升不是某一组偶然提示造成的。

## 常见追问

1. **要不要放错误示例？** 可以放经过纠正的反例，明确指出错误原因；直接混入错误标签会污染任务定义。
2. **类别很多但窗口有限怎么办？** 可先做层级分类或召回候选标签，再针对候选集合提供定义和示例。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

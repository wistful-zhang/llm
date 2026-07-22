---
title: '让模型自我批评并修改答案，真的能稳定提升质量吗？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '自我批评'
  - '反思'
  - '评测'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明有效条件与同源偏差，给出更可靠的外部反馈和停止机制。

**可以这样答：**

> 自我批评对格式遗漏、明显矛盾和可检查步骤常有帮助，但同一个模型可能看不见自己最初的知识错误。宽泛地要求“再检查一下”容易得到措辞变化而非事实改善。更有效的做法是提供具体检查清单、独立证据或工具结果，并把生成与评审的采样或模型适度分离。每轮修改都要有停止条件和质量判据，避免循环增加成本却没有收益。

## 常见追问

1. **换一个更强模型评审会更好吗？** 通常更有机会发现问题，但仍要校准评审偏差，并保留可验证规则和人工样本。
2. **哪些任务最适合自我检查？** 结构完整性、约束遵守、计算复核和引用覆盖比开放事实判断更适合。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

---
title: 'Prompt 回归测试集应该包含哪些样本？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'core'
tags:
  - '回归测试'
  - '数据集'
  - '边界案例'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

覆盖正常流量、历史故障、边界与攻击样本，并说明版本和防泄漏。

**可以这样答：**

> 测试集应以真实流量分布为主体，同时保留高价值长尾、历史线上故障和明确的安全攻击样本。每条样本要有可执行的评分规则，必要时允许多个正确答案，而不是只匹配固定措辞。数据集按版本冻结，并记录来源、时间和适用范围，避免测试样本混入 Prompt 示例或训练数据。上线后持续把新失败加入挑战集，但核心集保持稳定以观察长期趋势。

## 常见追问

1. **只收集失败样本可以吗？** 不可以，那会让评测分布偏离真实流量，也无法发现对常见场景的回归。
2. **开放回答怎么自动评分？** 结合规则、参考事实、模型评审和小比例人工复核，并先验证评分器与人工的一致性。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

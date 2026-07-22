---
title: '模型误拒绝正常请求时，Prompt 和产品流程应该怎么恢复？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '误拒绝'
  - '降级'
  - '安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分合理拒绝与过度拒绝，给出安全重述、分类复核和人工升级路径。

**可以这样答：**

> 先用独立策略分类判断拒绝是否符合产品边界，不能通过简单要求模型“不要拒绝”来绕过安全机制。对明显无害但表述触发误判的请求，可以保留原意做一次受控重述，并限制可用工具。再次拒绝时给用户解释允许范围和可选改写，高价值场景进入人工复核。系统同时记录误拒绝样本，持续评估修复是否增加了真正危险请求的放行率。

## 常见追问

1. **换另一个模型重试可以吗？** 可以作为受控降级，但必须执行同一安全策略，不能把安全边界交给模型差异。
2. **怎样衡量是否过度拒绝？** 在明确标注的安全请求集上统计拒绝率，并按场景和语言切片分析。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

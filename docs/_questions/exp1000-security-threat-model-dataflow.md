---
title: '怎样为 LLM 应用画 Threat Model 而不遗漏模型外组件？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'Threat Model'
  - '数据流'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

这题不要只报术语。先解释“LLM 威胁建模”的核心逻辑，再说明如何验证，最后指出只讨论 Prompt Injection 会遗漏传统 Web、供应链和运维风险。

**可以这样答：**

> 先画用户、模型、检索、工具、日志和第三方之间的数据流与信任边界，再枚举资产、攻击者、能力和缓解措施。要验证这一点，可以采用这个办法：沿一次请求检查每个入口、存储、外呼和高权限动作。使用时不能忽略，只讨论 Prompt Injection 会遗漏传统 Web、供应链和运维风险。

## 常见追问

1. **面试官要求一句话概括“LLM 威胁建模”时，你怎么说？** 先画用户、模型、检索、工具、日志和第三方之间的数据流与信任边界，再枚举资产、攻击者、能力和缓解措施
2. **你会怎样用数据、代码或手算验证“LLM 威胁建模”？** 沿一次请求检查每个入口、存储、外呼和高权限动作
3. **回答“LLM 威胁建模”时必须主动补充哪项限制？** 只讨论 Prompt Injection 会遗漏传统 Web、供应链和运维风险

## 延伸阅读

- [HELM](https://arxiv.org/abs/2211.09110)

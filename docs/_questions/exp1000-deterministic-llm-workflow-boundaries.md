---
title: '哪些步骤不应该交给 Prompt，而应该写成确定性代码？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'core'
tags:
  - '确定性'
  - '业务规则'
  - '工程边界'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用计算、权限、校验和状态变更举例，说明模型适合处理语义不确定部分。

**可以这样答：**

> 精确计算、日期换算、权限判断、唯一性校验、金额结算和数据库状态迁移应由代码完成。模型适合做意图理解、文本抽取、候选生成和需要语义判断的部分，但输出必须进入确定性验证器。高风险动作采用明确状态机和用户确认，不让模型凭自然语言决定是否越权。把边界划清还能减少 Prompt 长度，并使失败更容易复现。

## 常见追问

1. **规则很多，能不能让模型直接执行规则文档？** 可以辅助解释和提取，但正式决策应使用规则引擎或代码，并对规则版本做审计。
2. **模型只负责生成参数是否就安全？** 仍不安全，参数可能错误或恶意，工具执行前必须做类型、范围、权限和业务校验。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

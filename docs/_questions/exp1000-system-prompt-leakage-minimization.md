---
title: '怎样降低系统 Prompt 被套取或意外泄露的风险？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '提示词泄露'
  - '密钥管理'
  - '安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先说明无法把系统 Prompt 当秘密保险箱，再给出最小化、脱敏和输出检测。

**可以这样答：**

> 应假设模型上下文中的文字可能被部分复述，因此系统 Prompt 不能包含密钥、真实凭据或不可公开的核心数据。提示内容尽量短，只描述必要策略，敏感决策放到服务端代码和权限系统执行。对要求复述内部规则的输入做识别，输出侧检测明显泄露片段，并限制日志访问。即使采取这些措施也不能保证零泄露，所以安全性不能依赖提示词保密。

## 常见追问

1. **给系统 Prompt 加一句“绝不能泄露”有用吗？** 能降低部分直接询问的成功率，但无法提供强保证，仍需移除秘密和外部强制控制。
2. **Prompt 模板可以放在前端吗？** 公开逻辑可以，涉及策略细节的模板应由服务端管理，但服务端存放也不代表模型不会复述。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

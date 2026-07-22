---
title: '开放的大模型 API 怎样防刷量、盗 Key 和自动化滥用？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '滥用防护'
  - 'API Key'
  - '风控'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从认证、行为速率、预算、异常检测和响应处置回答，避免只按 IP 限流。

**可以这样答：**

> 使用可轮换且分 scope 的凭据，配合租户预算、Token 限流、并发和模型权限，而不是一个 Key 访问全部能力。风控结合账号、设备、网络、调用节奏、提示长度和费用异常，IP 只是其中一个信号。高风险行为先降速、挑战或冻结敏感能力，并给合法用户申诉路径。密钥不出现在前端和日志，泄露检测触发撤销、事件通知和用量对账。

## 常见追问

1. **攻击者轮换 IP 怎么办？** 使用账号、付款、设备和行为关联的多信号模型，并设置全局费用护栏。
2. **限流返回什么信息合适？** 提供重试时间和配额类别，但避免暴露可帮助绕过风控的详细阈值。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

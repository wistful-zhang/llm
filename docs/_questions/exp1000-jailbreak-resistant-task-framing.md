---
title: '面向公开用户的 Prompt，怎样降低 Jailbreak 成功率？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Jailbreak'
  - '安全'
  - '纵深防御'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

不要把答案停在强化系统提示，要从输入、模型、工具、输出和监控讲纵深防御。

**可以这样答：**

> 系统 Prompt 应清楚定义允许与禁止的任务边界，但它只是防线之一。输入侧做风险分类和上下文隔离，模型侧选择合适的安全策略，工具侧执行最小权限和参数校验，输出侧再做内容检查。高风险请求需要拒绝或转人工，且不能因用户声称是测试、角色扮演或编码文本就自动放行。团队还要维护持续更新的攻击集，监控绕过率和过度拒答率之间的平衡。

## 常见追问

1. **把系统 Prompt 写得很长会更安全吗？** 不一定，冗长规则可能冲突或被稀释，关键是清晰边界和应用层强制执行。
2. **攻击样本可以直接放进生产 Prompt 做示例吗？** 少量抽象示例可以，但大量具体攻击文本会增加上下文和泄露防线，应更多用于离线评测。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

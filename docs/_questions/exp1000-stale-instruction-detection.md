---
title: '长会话中旧指令已经失效，怎样避免模型继续沿用？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '指令生命周期'
  - '会话状态'
  - '冲突'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答要把有效指令显式状态化，并说明撤销、覆盖和来源追踪。

**可以这样答：**

> 应用应维护当前有效约束表，记录每条指令的来源、作用域和是否被后续消息覆盖，而不是原样拼接全部历史。用户明确撤销或修改要求时，更新状态并在上下文中只保留最新版本。对一次性指令应在任务完成后过期，避免影响后续无关请求。若无法确认旧指令是否仍有效，模型应向用户澄清而不是默认继承。

## 常见追问

1. **谁来判断一条指令被覆盖？** 可由模型抽取候选变更，但最终按确定的状态规则合并，重要冲突让用户确认。
2. **删除旧消息就够了吗？** 不够，还要保留必要的变更记录和当前状态，否则难以审计或恢复上下文。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

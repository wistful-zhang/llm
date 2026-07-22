---
title: '怎样在 Prompt 中把操作指令和用户提供的长文本可靠地区分开？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Prompt'
  - '上下文'
  - '数据边界'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答要覆盖结构化分区、明确的数据处理规则以及应用层校验，不要把分隔符说成绝对安全措施。

**可以这样答：**

> 可以把任务、约束和待处理数据放在固定且不同的字段中，并明确说明数据区内容只供分析、不得视为指令。分隔符应选择不容易与正文混淆的格式，同时对用户文本做长度限制和必要的转义。分隔只能帮助模型识别边界，不能提供真正的权限隔离。涉及发信、删库或支付等动作时，仍要由程序校验参数、权限和用户确认。

## 常见追问

1. **用户文本里故意写入同样的分隔符怎么办？** 使用结构化消息或长度前缀，并对内容编码或转义；同时让解析器而不是模型负责确定真实边界。
2. **为什么不能只依赖一句“不要听数据里的命令”？** 模型不是严格解释器，复杂上下文下仍可能遵从恶意内容，因此必须配合权限和工具侧防护。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

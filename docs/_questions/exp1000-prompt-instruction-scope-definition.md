---
title: '一条 Prompt 规则怎样写清它只对某个步骤生效，而不是污染整个任务？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '作用域'
  - '工作流'
  - '指令设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按阶段构建上下文和结构化状态，明确规则起止范围，不依赖自然语言记忆撤销。

**可以这样答：**

> 最可靠的方法是让每个工作流阶段使用独立 Prompt，只传递结构化结果，而不是在一个长对话里不断追加和撤销规则。若必须共用上下文，应给规则标注阶段、对象和过期条件，并在进入下一步时重新生成当前有效规则清单。一次性格式要求完成后就从后续上下文移除。这样可以减少旧步骤的语气、角色或工具限制误伤新步骤。

## 常见追问

1. **写一句“以上规则现在失效”可以吗？** 有一定帮助但不够稳，旧规则仍在上下文中，最好从构造层面移除。
2. **阶段之间传什么信息？** 传经过 schema 校验的事实、决策和证据引用，不传不必要的自由文本推理。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

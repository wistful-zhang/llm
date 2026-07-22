---
title: '多轮对话中模型过度受最近一轮影响，应该怎么处理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '多轮对话'
  - '历史管理'
  - '偏差'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从状态提取、历史选择和冲突检测回答，不要只建议把旧消息重复一遍。

**可以这样答：**

> 应把长期有效的用户目标、约束和已确认事实提取为独立会话状态，而不是让它们淹没在原始聊天记录中。每轮构造上下文时同时提供该状态、当前请求和少量相关历史，并标明哪些信息已被新指令取代。若新旧要求存在实质冲突，应用应让模型显式指出并请求确认。回归测试可以设计相同问题但改变历史位置，观察答案是否无故漂移。

## 常见追问

1. **会话状态由模型自己总结可靠吗？** 可让模型抽取，但应使用固定 schema、来源引用和校验规则，重要字段最好让用户确认。
2. **保留全部历史不是更完整吗？** 完整不等于有效，冗余和过期内容会增加成本并让最近措辞压过真正约束。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

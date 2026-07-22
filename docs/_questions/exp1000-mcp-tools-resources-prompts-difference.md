---
title: 'MCP 中 Tools、Resources 和 Prompts 分别适合承载什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '中等'
tags:
  - 'MCP'
  - 'Tools'
  - 'Resources'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按执行动作、可读取上下文和可复用模板区分，强调服务端能力声明。

**可以这样答：**

> Tools 表示可调用的操作，通常带输入 schema，并可能产生副作用。Resources 表示客户端可读取或订阅的上下文数据，用 URI 标识，不应把普通读取都伪装成动作。Prompts 是服务端提供的可复用消息模板或工作流入口，由用户或 Host 选择使用。三者都只是能力描述，真正的权限、确认和数据隔离仍由 Host 与 Server 强制执行。

## 常见追问

1. **查数据库应该是 Tool 还是 Resource？** 固定可寻址内容更像 Resource，带动态条件的查询常用 Tool，具体还看权限和交互语义。
2. **Prompt 能自动执行 Tool 吗？** Prompt 只是消息模板，是否调用工具仍由 Host 的模型与授权流程决定。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)

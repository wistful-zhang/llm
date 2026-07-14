---
title: "长任务中的 Agent 上下文应该如何管理？"
source: "公开 Agent 面试题整理；答案依据原论文和官方工程文档原创整理"
review_status: "待复习"
category: "Agent"
difficulty: "中等"
tags:
  - Context Engineering
  - Compaction
  - Checkpoint
published: true
verified: true
date: 2026-07-13
---

## 核心回答

上下文是当前一次模型调用真正能看到的 token，包括系统指令、工具定义、消息、检索内容和工具结果；它与存放在外部的长期记忆不是同一概念。长任务要保留目标、约束、已确认事实、当前状态和未完成事项，压缩或移除重复对话与过时工具输出，并按需重新获取原始资料。上下文越长不一定越好，噪声会竞争有限的注意力和成本预算。

## 展开说明

常见方法包括：

1. **窗口裁剪**：保留近期交互和稳定系统指令，删除可重建的冗余结果。
2. **Compaction**：把较早轨迹压缩成摘要；摘要有信息损失，因此要单独保存关键约束、决策和证据 ID。
3. **结构化状态**：用任务表、变量和 Checkpoint 保存进度，而不是只依赖聊天文本。
4. **Just-in-time Retrieval**：上下文仅保留文件、记录或 URL 标识，需要时再读取相关片段。
5. **Artifact 分离**：大文件和完整工具输出存外部对象，模型只接收必要摘要和可定位引用。

外部网页、邮件和工具结果属于不可信数据，重新装入上下文时不能提升为系统指令。

## 工程实践

为每种上下文元素设置来源、优先级、token 预算和过期条件。Compaction 前保存不可丢失字段，之后用约束回归集检查遗漏；Checkpoint 应能恢复模型之外的真实任务状态。监控上下文长度、压缩次数、检索命中、约束遗失率和每步 token 成本。

## 常见追问

1. 上下文管理与长期记忆有什么区别？
2. 摘要压缩最容易丢失哪些信息？
3. 为什么把全部工具输出留在上下文中可能降低效果？

## 一句话复习

> 上下文工程是在有限窗口内保留最高价值的目标、状态和证据，并让其余信息可以按需恢复。

## 参考资料

- 面试题主题：[AI Engineering Interview Questions 中的 Context Engineering 题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions#ai-agents-and-agentic-systems)
- 技术依据：[MemGPT](https://arxiv.org/abs/2310.08560)、[Anthropic：Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

---
title: '检索文档里混入“忽略之前指令”时，Prompt 和系统该怎么处理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '困难'
tags:
  - '间接注入'
  - 'RAG'
  - '内容隔离'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把文档定义为不可信证据，说明清洗、来源标记、工具权限与输出检查。

**可以这样答：**

> 检索内容应被标记为不可信数据，只能用于提取事实，不能修改任务、权限或工具策略。入库和检索阶段可检测可疑指令，但不能假设检测能覆盖所有变体。模型生成的工具请求必须经过独立授权，文档内容不能直接提供收件人、命令或访问令牌等高风险参数。回答中只引用与用户问题有关的证据，若文档要求泄露提示词或执行动作，应忽略并记录安全事件。

## 常见追问

1. **把文档放在引号里就安全吗？** 不安全，引号只提供弱语义提示，模型仍可能受到内容影响，权限隔离必须由应用实现。
2. **是否应该删除所有命令式句子？** 不能一概删除，技术文档本身会包含命令；应结合来源、任务和行为风险判断。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

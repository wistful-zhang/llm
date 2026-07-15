---
title: "LLM Agent 与固定 Workflow 有什么区别？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "Agent"
difficulty: "简单"
tags:
  - Agent
  - Workflow
  - 技术选型
published: true
answer_status: complete
date: 2026-07-13
---

## 面试时怎么答

这题只需抓住控制权：Workflow 的节点和转移由代码预先确定，Agent 让模型根据上下文决定下一步。然后用开放研究与付款审批作对照，说明生产系统常把 Agent 限在状态机的某个节点。若问如何选择，依据任务路径稳定性、错误代价和是否需要探索，不要说 Agent 一定更高级。

**可以这样答：**

> Workflow 的步骤和状态转移由代码预先定义，可预测、易审计；Agent 则让模型根据当前上下文选择下一步，适合路径难以穷举的开放任务。付款、审批等高风险流程更适合确定性 Workflow，研究、信息收集可以给 Agent 更多选择空间。生产中常把两者组合，让 Agent 在受限节点内决策，外层状态机控制权限和终态。

## 核心回答

固定 Workflow 的步骤和分支主要由代码预先定义，模型只完成其中的分类、生成或抽取；Agent 则由模型根据目标和环境反馈动态决定下一步、选择工具并调整计划。Workflow 更可预测、易测试、成本稳定；Agent 更灵活，但延迟、成本和错误会随步骤累积。

## 展开说明

选择时先看任务是否能明确枚举：

- 流程稳定、合规要求高、失败路径清楚，例如审批、退款校验，优先 Workflow。
- 子任务数量和顺序无法预先确定，并且每一步都能从环境获得可验证反馈，例如开放式检索或复杂代码修复，才更适合 Agent。
- 大量场景适合混合模式：外层用确定性状态机控制边界，局部节点让 Agent 做动态决策。

“调用了大模型”不等于 Agent；“用了 Agent 框架”也不表示系统真的具有动态自主性。

## 工程实践

先做单次调用或简单 Workflow 基线，只有在评估证明动态规划带来可测收益时才增加 Agent。无论哪种形式，都要设置工具权限、步骤预算、超时、结果校验和人工确认点。

## 常见追问

1. **ReAct 属于 Workflow 还是 Agent 模式？** ReAct 是典型 Agent 控制模式，因为模型依据 Observation 动态选择下一次 Action；但外层仍可由 Workflow 限制阶段和工具范围。
2. **哪些业务不应该使用自治 Agent？** 法规要求确定审批链、错误不可逆且无法补偿、权限极高或成功条件无法验证的业务，不应交给无监督自治 Agent。
3. **如何把 Agent 限制在确定性状态机内？** 每个状态只暴露允许的工具和转移，模型只提交候选动作，代码校验守卫条件后才真正迁移。

## 一句话复习

> Workflow 由代码决定路径，Agent 由模型动态决定路径；先选择能满足需求的最简单方案。

## 参考资料

- 面经主题：[Agent 开发公开面经汇总](https://www.nowcoder.com/discuss/877151327091027968)
- 工程依据：[Anthropic：Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)

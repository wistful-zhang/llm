---
title: "ReAct 如何把推理与工具行动结合起来？"
source: "Datawhale 公开真实面试题整理；答案依据原论文原创整理"
review_status: "待复习"
category: "Agent"
difficulty: "简单"
tags:
  - ReAct
  - Reasoning
  - Action
published: true
verified: true
date: 2026-07-13
---

## 核心回答

ReAct 让模型交替进行任务推导和环境行动：根据当前目标决定下一步 Action，工具或环境返回 Observation，模型再利用新信息更新计划。与只在文本中推导的 CoT 相比，ReAct 能主动查询外部知识、执行操作并根据真实反馈纠错；但工具结果错误、步骤循环和错误观察也会沿轨迹传播。

## 展开说明

概念上的循环是：

1. 根据目标和已有观察形成当前计划或判断。
2. 选择一个可执行 Action，例如搜索、计算或读取状态。
3. 接收工具返回的 Observation。
4. 更新状态，决定继续行动、向用户追问或输出最终结果。

ReAct 并不保证每一步都正确，也不等于必须向用户展示模型的私有思维过程。生产系统通常记录可审计的简短计划、动作、参数和观察，而不是依赖无法验证的长篇自述。对于能用固定流程解决的任务，ReAct 循环可能只会增加成本和不确定性。

## 工程实践

为循环设置最大步骤、重复动作检测和无进展终止条件。Observation 应结构化并标注错误类型，模型不能把超时或空结果当作成功。结束前通过工具或确定性代码检查真实状态，避免仅凭自然语言判断任务完成。

## 常见追问

1. ReAct 与 Chain-of-Thought 的主要区别是什么？
2. Observation 不可信时应该怎样处理？
3. 如何防止 ReAct 陷入重复搜索或工具循环？

## 一句话复习

> ReAct 用“行动获得反馈、反馈修正下一步”把模型推导连接到真实环境。

## 参考资料

- 面经主题：[Datawhale 真实面试题中的 ReAct 问题](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)

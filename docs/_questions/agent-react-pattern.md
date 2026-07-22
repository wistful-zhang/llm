---
title: "ReAct 如何把推理与工具行动结合起来？"
source: "Datawhale 公开真实面试题整理；答案依据原论文原创整理"
review_status: "待复习"
category: "Agent"
difficulty: "简单"
study_tier: "core"
tags:
  - ReAct
  - Reasoning
  - Action
published: true
answer_status: complete
verified: true
date: 2026-07-13
---

## 面试时怎么答

用一轮 Thought/Action/Observation 的循环解释 ReAct 即可，重点是新观察会改变下一步，而不是先写死整条计划。不要把模型输出的 Thought 当成必须展示的文本，生产中可以保留结构化状态。被问缺点时，谈调用链变长、循环、恶意观察结果和停止条件。

**可以这样答：**

> ReAct 把决策与环境交互交替进行：模型根据当前状态选择一个动作，工具返回 Observation，模型再依据新事实继续、改路或结束。它比一次性生成计划更容易利用外部反馈纠错，但工具链会更长，也可能重复调用或被恶意结果影响。因此实现中要限制步数、检测重复状态、校验工具输出并设置明确终态。

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

1. **ReAct 与 Chain-of-Thought 的主要区别是什么？** CoT 主要在模型内部展开中间推理；ReAct 把推理与外部 Action、Observation 交错，能用环境反馈修正路径。
2. **Observation 不可信时应该怎样处理？** 把它标记为数据而非高优先级指令，校验来源和结构，对关键事实交叉验证，并禁止其直接提升工具权限。
3. **如何防止 ReAct 陷入重复搜索或工具循环？** 记录规范化动作历史，检测相同状态—动作重复，设置最大步数和边际收益阈值，触发后改策略或转人工。

## 一句话复习

> ReAct 用“行动获得反馈、反馈修正下一步”把模型推导连接到真实环境。

## 参考资料

- 面经主题：[Datawhale 真实面试题中的 ReAct 问题](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)

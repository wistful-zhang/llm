---
title: "如何系统评估一个有工具调用的 Agent？"
source: "Datawhale 公开真实面试题整理；答案依据 Agent 评估论文原创整理"
review_status: "待复习"
category: "Agent"
difficulty: "困难"
tags:
  - Agent Evaluation
  - ToolSandbox
  - tau-bench
published: true
verified: true
date: 2026-07-13
---

## 核心回答

Agent 评估不能只看最终文字答案，要在可执行环境中检查真实终态、规则合规、完整工具轨迹和重复运行稳定性。任务成功应尽量由数据库或环境状态的确定性断言判断；过程指标包括工具选择、参数正确率、无效与重复调用、策略违规、步骤数、延迟和成本。对随机 Agent 需要多次运行，区分偶然成功与稳定成功。

## 展开说明

一套分层评估可包含：

1. **终态正确性**：订单、文件、数据库等真实状态是否达到标注目标，而不是模型是否声称完成。
2. **里程碑检查**：长任务的关键中间状态是否满足，便于定位首次偏离的位置。
3. **策略与安全**：是否越权、跳过确认、泄漏数据或违反领域规则。
4. **工具能力**：工具选择、参数、调用顺序、错误处理和信息不足时的追问。
5. **效率与可靠性**：步骤、token、费用、延迟，以及多次试验中的一致成功表现。

离线固定轨迹只能评价给定路径，无法覆盖模型根据实时 Observation 改变动作的 On-policy 行为。tau-bench 的 pass^k 表示同一任务在 k 次独立试验中全部成功的概率，用于衡量一致可靠性；它不同于“k 次中至少一次成功”的 pass@k。LLM Judge 可评开放文本，但应与确定性状态检查和人工标注结合。

## 工程实践

使用隔离 Sandbox、可重置数据库、可控时钟和故障注入构造测试。保存 Prompt、模型、工具 Schema、初始状态和随机配置版本。对每个场景重复运行并报告均值、方差和失败类型；新增线上 Bad Case 时加入对应状态断言，而不只保存最终回复文本。

## 常见追问

1. 为什么最终回复正确不代表 Agent 任务成功？
2. pass^k 与单次成功率分别反映什么？
3. 如何评估需要多轮向用户追问的 Agent？

## 一句话复习

> Agent 评估要看真实终态、完整轨迹、规则合规、资源效率和重复运行可靠性。

## 参考资料

- 面经主题：[Datawhale 真实面试题中的 Agent 评估维度](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[ToolSandbox](https://arxiv.org/abs/2408.04682)、[tau-bench](https://arxiv.org/abs/2406.12045)

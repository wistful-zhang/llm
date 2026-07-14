---
title: "GRPO 的核心思想是什么，与 PPO、DPO 如何比较？"
source: "2025—2026 公开真实面试问题汇总中的 GRPO 高频题；答案依据 DeepSeekMath 与 DeepSeek-R1 论文原创整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - GRPO
  - PPO
  - DPO
published: true
verified: true
date: 2026-07-13
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** GRPO 用同一 Prompt 的组内相对奖励作基线，不训练独立 Critic；PPO 依赖价值模型，DPO 则直接学离线偏好对。
2. **再讲关键机制：** 从数据来源、Advantage、参考策略约束和是否在线采样四个维度比较。
3. **主动说取舍：** GRPO 省 Critic 显存且能在线探索，但组采样贵、奖励方差为零时无学习信号；DPO 简单却受离线数据覆盖限制。
4. **最后落到项目：** 按场景给选择，并报告奖励、KL、稳定性、GPU 小时与验证集真实成功率；随后停。

**60 秒口述示例：**

> 我会先对齐三者：PPO 用 Critic 估计 Advantage 并在线更新；GRPO 不训 Critic，而用同一 prompt 多个回答的组内相对奖励；DPO 从 chosen/rejected 离线偏好直接优化分类式目标。GRPO 更省模型显存但 rollout 成本高。项目里我会按是否有可靠奖励和在线采样预算选择，同时看真实任务成功率、KL、训练崩溃率和 GPU 小时。 若奖励稀疏，我再讨论组大小和探索。


## 核心回答

经典 GRPO 对同一个 Prompt 采样一组回答，用组内奖励的相对高低构造标准化优势，再以 PPO 风格的概率比裁剪和参考策略 KL 更新模型。它不训练单独的 Critic，因而减少价值模型的显存和训练负担；代价是每个 Prompt 要生成多条回答，且优势质量依赖组内多样性和奖励信号。PPO 通常用学习到的价值函数估计优势；标准离线 DPO 直接从 chosen/rejected 对学习，不在训练环节为每个 Prompt 在线 Rollout 一组回答。

## 展开说明

若同组奖励为 `r₁...r_G`，GRPO 会以组均值和标准差得到相对优势。这样无需拟合绝对价值基线，但当组内回答几乎相同、奖励方差接近零时，训练信号会很弱或不稳定。规则可验证的数学、代码任务较容易得到奖励；开放式对话仍可能依赖奖励模型或 Judge，并继承其偏差。

GRPO 不是“永远比 PPO 或 DPO 好”。与 PPO 相比，它省掉 Critic，却增加组采样开销；与 DPO 相比，它能用当前策略探索新回答，但系统复杂度和算力更高。具体实现还可能改变 KL 估计、裁剪粒度和奖励设计，回答时应说明所指版本。

## 工程实践

训练时监控组内奖励方差、零方差组比例、每题有效回答数、KL、clip fraction、回答长度和奖励各分量。调整 group size 时同时核算生成吞吐与梯度 Batch；奖励归一化要设置数值保护。还应保留通用能力与安全回归，避免只在可验证任务上追高分。

## 常见追问

1. **GRPO 不使用 Critic，优势基线从哪里来？** 对同一 prompt 的多条回答计算奖励，再减去组均值并通常除以组标准差，以组内相对表现作为 Advantage。
2. **组内奖励方差为零时会发生什么？** 所有回答的相对 Advantage 接近零，策略几乎得不到该组的学习信号；实现还要用 epsilon 防止除零。
3. **GRPO 比 DPO 多出的在线探索能力带来哪些成本？** 需要持续生成多条 rollout、执行奖励判定并处理策略陈旧度，GPU、时延和系统复杂度都明显更高。

## 一句话复习

> GRPO 用同题多回答的相对奖励代替 Critic 基线，省价值模型但增加 Rollout，并依赖可靠且有区分度的奖励。

## 参考资料

- 面试主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[DeepSeekMath](https://arxiv.org/abs/2402.03300)、[DeepSeek-R1](https://arxiv.org/abs/2501.12948)

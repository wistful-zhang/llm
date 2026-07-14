---
title: "LoRA 应该挂在哪些 Target Modules？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - LoRA
  - Target Modules
  - Attention
published: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说目标层按任务与预算选，注意力投影是低成本起点，复杂域迁移可扩到 MLP；停顿后解释。
2. **再讲关键机制**：说明 q/k/v/o 与 up/down/gate 投影分别影响信息交互和特征变换。
3. **主动说取舍**：指出挂载层越多容量越强，但训练显存、通信、过拟合和部署开销也会上升。
4. **最后落到项目**：做逐组消融而非一次全挂，监控任务切片、可训练参数、GPU 时、峰值显存和推理吞吐。

**60 秒口述示例：**

> 我先给结论：Target Modules 没有固定答案，我通常从 q、v 或全部注意力投影做低成本基线，若领域迁移大或效果不足，再扩展到 o 和 MLP 的 gate、up、down。这里停一下，再说明注意力投影改变信息选择与组合，MLP 投影影响通道特征变换。取舍是覆盖越广容量越大，但参数、显存和过拟合风险同步上升。项目里我会按模块组做消融，用同一预算比较任务胜率、长尾切片、可训练参数量、GPU 小时、峰值显存和吞吐。

## 核心回答

Target Modules 决定 LoRA 能修改模型中的哪些线性变换。Attention 中，`q_proj` 产生 Query，`k_proj` 和 `v_proj` 产生被检索的 Key/Value，`o_proj` 把多头结果投回隐藏维度；MLP 中常见 `gate_proj`、`up_proj` 和 `down_proj` 负责门控、升维和降维。只挂 Attention 参数更少；同时覆盖 Attention 与 MLP 通常容量更强，但显存、计算和过拟合风险也更高。

合理做法是从模型结构与任务需要出发，用小规模消融选择模块，而不是认为 target 越多越好。原始 LoRA 论文的实验常关注 Attention 投影；后续工程实践也常采用所有线性层，但这不是对每个模型和数据都最优的固定规则。

## 展开说明

选择模块时先检查真实模块名和是否存在 fused QKV，不能把另一种架构的配置直接复制过来。需要改变注意力路由或条件依赖时，可优先验证 Q/V 或 Q/K/V/O；领域表达、格式和复杂变换不足时，加入 MLP 可能有帮助。Embedding 与 LM Head 规模大且直接关联 token 词表，通常保持冻结；常在新增 token、领域词表或明确观察到输出层瓶颈时考虑训练相关行或模块，并单独回归词表与生成质量。QLoRA 风格实践也常以 `all-linear` 覆盖线性层，但仍应以目标架构与消融结果为准。

多个 Target Modules 共用同一 Rank 并不一定合理。PEFT 支持按层或模块设置不同 Rank/Alpha；但配置越细，搜索成本和复现难度越高，应有消融证据再增加复杂度。

## 工程实践

训练前打印所有匹配到的模块、可训练参数名和占比，并做一次前后向确认每类模块都有非零梯度。建议按“Q/V → 全 Attention → Attention+MLP”逐级实验，保持数据、步数和缩放规则一致，比较任务质量、通用能力、训练吞吐和峰值显存。若模型使用权重绑定，修改 Embedding 或 LM Head 前还要确认绑定关系与保存格式。

## 常见追问

1. **只挂 `q_proj`、`v_proj` 可以吗？** 可以作为低成本基线，但是否足够取决于任务，必须用消融而不是经验口号判断。
2. **为什么 MLP 也值得尝试 LoRA？** MLP 承担逐 token 的非线性特征变换，任务所需变化未必只发生在注意力路由中。
3. **Target Modules 越多是否一定越好？** 不一定；容量增加也会提高计算、显存、过拟合和能力漂移风险。
4. **什么时候需要训练 Embedding 或 LM Head？** 新增词表 token 或有明确输出层瓶颈时才优先考虑，并应验证权重绑定和旧词能力。

## 一句话复习

> Target Modules 决定 LoRA 能改哪里；先匹配真实架构，再用 Attention 到 MLP 的受控消融换取可解释的容量增量。

## 参考资料

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [Hugging Face PEFT：LoRA 开发指南](https://huggingface.co/docs/peft/main/en/developer_guides/lora)

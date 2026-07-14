---
title: "如何手算 Transformer 参数量与训练 FLOPs？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
tags:
  - 参数量
  - FLOPs
  - Transformer
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先报主项：每层 Attention 投影约 `4d²`，普通 FFN 约 `2dd_ff`，再乘层数。
2. **再讲关键机制**：补 Embedding/LM Head、SwiGLU 三矩阵和长序列 Attention `n²d` 项，训练约为前向数倍。
3. **主动说取舍**：`6ND` 是矩阵主导下的近似，不含重算、通信、稀疏路由和硬件利用率。
4. **最后落到项目**：把手算参数与框架统计、估算 FLOPs 与 Profiler 对齐，并报告 MFU 和误差来源。

**60 秒口述示例：**

> 我会先抓主项：隐藏维度 d 时，Q、K、V、O 四个投影约 `4d²`；普通 FFN 上下投影约 `2dd_ff`，SwiGLU 因 gate、value、down 三个矩阵约 `3dd_ff`，乘层数后再加词表 Embedding 和 LM Head。这是主项估算，FLOPs 可用参数参与矩阵乘法的近似快速估，但长序列的 `n²d` 注意力、重算和通信要另算。项目中我会与框架参数统计和 Profiler 对账，再用 MFU 解释理论与实测差距。

## 核心回答

对隐藏维度 `d`、FFN 中间维度 `d_ff`、层数 `L` 的标准 Dense Decoder，忽略 bias 和 Norm 小项时，每层 MHA 的 Q/K/V/O 投影约为 `4d²`，SwiGLU 的 gate/up/down 三个投影约为 `3dd_ff`，所以主体参数约为 `L(4d²+3dd_ff)`。再加词嵌入和 LM Head；若二者共享，只计约 `Vd`，不共享则约 `2Vd`。

Dense Transformer 预训练常用粗略估算 `C ≈ 6ND`，其中 `N` 是参与前后向的非 Embedding 参数量，`D` 是训练 token 数。直觉是每个参数每个 token 的前向乘加约 `2` FLOPs，反向计算输入梯度和权重梯度再约 `4` FLOPs。它是预算级近似，不包含所有 Attention 二次项、重算、通信和硬件空泡。

## 展开说明

MHA 中每个投影的总维度通常仍是 `d→d`，所以四个矩阵合计 `4d²`。GQA/MQA 只缩小 K/V 的总输出维度，Q 与 O 仍可能接近 `d²`。若 K/V 总维度为 `d_kv`，Attention 投影可粗写为 `2d²+2d d_kv`。SwiGLU 因有两条上投影和一条下投影，参数是 `3dd_ff`；普通两层 FFN 则约 `2dd_ff`。

序列很长时，`QK^T` 与 `PV` 的计算约随 `L_seq²d` 增长，不能只用 `6ND`。MoE 还必须区分总参数与每 token 激活参数：模型需要存储所有 Expert，但每个 token 只经过被路由的少数 Expert，训练 FLOPs 更接近按激活参数估计，同时另有 Router 和 All-to-All 开销。

## 工程实践

容量规划时用结构配置逐项计算参数，再用实际序列长度补 Attention FLOPs；最后乘以数据 token 和预计 MFU 得到训练时长。应分别报告理论 FLOPs、GPU 峰值 FLOPs、实际吞吐和端到端利用率。参数共享、Padding、Checkpointing 与失败重跑都应在预算表中显式列出，避免把理论下界当成采购结论。

## 常见追问

1. **为什么 SwiGLU 是 `3dd_ff` 而不是 `2dd_ff`？** 它有 gate 和 value 两个 `d→d_ff` 投影，再有一个 `d_ff→d` 下投影，因此共有三个大矩阵。
2. **`6ND` 为什么不是精确公式？** 它假设参数矩阵乘法占主导，并忽略长序列 Attention、Embedding logits、重计算、通信和非满载等成本。
3. **MoE 应该用总参数还是激活参数估算 FLOPs？** 单 token 矩阵计算主要按激活 Expert 参数估算，但显存按总参数考虑，还要另加路由与跨设备通信。

## 一句话复习

> 参数量要按 Attention、FFN、Embedding 分块手算；`6ND` 是 Dense 训练预算近似，长序列与 MoE 必须额外修正。

## 参考资料

- [Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism](https://arxiv.org/abs/1909.08053)
- [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)

---
title: "Transformer 中的 FFN 有什么作用，SwiGLU 为什么常见？"
source: "公开大模型高频面试题整理中的 FFN 题；答案依据 Transformer 与 GLU 变体论文原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
study_tier: "core"
tags:
  - FFN
  - SwiGLU
  - Transformer
published: true
answer_status: complete
verified: true
date: 2026-07-13
---

## 面试时怎么答

先说明注意力负责 Token 间信息混合，FFN 对每个 Token 独立做通道变换，而且常是参数大头。SwiGLU 用一条 SiLU 门控分支乘内容分支，再投影回隐藏维。比较 GELU 时必须控制总参数或 FLOPs，因为 SwiGLU 多一条投影，不能在相同中间维下直接宣布更好。

**可以这样答：**

> Transformer 的注意力负责不同 Token 之间的信息交互，FFN 则对每个 Token 的隐藏向量独立做非线性通道变换，通常占据大量参数。SwiGLU 将一条经过 SiLU 的门控投影与另一条内容投影逐元素相乘，再映射回隐藏维，比单一 GELU 分支更有表达力。由于它多一条输入投影，公平比较时要调整中间维并控制参数量或 FLOPs。

## 核心回答

Attention 负责在 token 之间聚合信息，FFN 则对每个位置独立地做非线性特征变换，通常先把隐藏维度扩张，再投影回模型维度。SwiGLU 使用一条带 Swish/SiLU 激活的门控分支与另一条值分支逐元素相乘，再做下投影。门控让网络能按输入调节通过的特征，论文实验表明它在若干 Transformer 设置中优于传统 ReLU/GELU FFN，因此被许多 LLM 采用，但收益仍取决于参数预算和训练配方。

## 展开说明

经典 FFN 可写成：

$$
W_2\operatorname{activation}(W_1x)
$$

SwiGLU 常写成：

$$
W_{\mathrm{down}}\!\left(\operatorname{SiLU}(W_{\mathrm{gate}}x)\odot W_{\mathrm{up}}x\right)
$$

它多出一条输入投影，因此比较模型时不能只让中间维度与普通 FFN 完全相同，否则参数量和计算量不公平。很多架构会相应缩小 SwiGLU 的中间维度，使总参数接近目标预算。

FFN 往往占 Transformer 参数和计算的大头，也可被 MoE 的稀疏专家层替换。它是逐位置计算，但各位置共享同一组权重；位置之间的信息交换仍由 Attention 完成。

## 工程实践

优化 FFN 时要同时看矩阵乘吞吐、激活显存、张量并行切分和融合算子。量化后若整体困惑度变化不大，也应回归工具调用、格式遵循等敏感任务，因为门控投影中的异常值可能导致局部能力退化。

## 常见追问

1. **为什么 FFN 通常先升维再降维？** 升维提供更大的非线性特征空间和参数容量，降维再把结果投回残差流的固定隐藏维度。
2. **SwiGLU 与 GELU FFN 的参数量应怎样公平比较？** SwiGLU 有两条上投影，应缩小中间维度，使两者总参数或 FLOPs 相近后再比较质量。
3. **FFN 是逐 token 计算，为什么所有位置仍使用同一组参数？** Transformer 对序列位置共享同一个块，位置差异已由注意力和位置编码进入各 token 表示；共享参数也保证长度泛化和效率。

## 一句话复习

> Attention 混合位置，FFN 变换特征；SwiGLU 用输入相关的门控增强 FFN，但比较时要对齐参数和计算预算。

## 参考资料

- 面试主题：[大模型常考面试题 100 道（第 1～25 道）](https://www.nowcoder.com/discuss/865888054261706752)
- 技术依据：[Attention Is All You Need](https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf)、[GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202)

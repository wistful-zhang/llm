---
title: "Transformer 为什么比 RNN 更适合训练大模型？"
source: "用户提供的分级面试题单；具体公司归属未独立核验，技术答案依据原论文整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "简单"
study_tier: "role"
tags:
  - Transformer
  - RNN
  - 并行计算
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

回答核心是训练阶段的依赖关系。RNN 的 h_t 依赖 h_{t-1}，时间维必须顺序推进；Transformer 同一层各位置能通过矩阵运算并行处理，因此更适合 GPU 和大规模数据并行。

不要把 Transformer 说成处处占优。标准全注意力有平方级连接成本，自回归生成依然逐 Token；RNN 在低延迟流式、有界状态场景仍可能更合适。

**可以这样答：**

> RNN 的第 t 个隐藏状态依赖前一时刻，训练时序列位置难以并行，长距离信息还要经过较长递归路径。Transformer 在同一层可一次处理所有位置，把主要计算变成大矩阵乘，更容易利用 GPU，也让远距离 Token 直接交互。不过它并非没有顺序依赖：自回归 Decode 仍要逐 Token 生成，标准注意力还会随序列长度平方增长；RNN 在有界状态的流式场景仍有优势。

## 核心回答

RNN 在时间步上有递归依赖：位置 $$t$$ 的隐藏状态要等待 $$t-1$$，训练长序列时关键路径随序列长度增长。Transformer 用自注意力直接连接可见范围内的任意两个位置；训练时整段目标序列已知，配合 Causal Mask，同一层内各位置可以并行计算，更适合 GPU/TPU 的大矩阵运算和大规模分布式训练。可见 token 之间的信息路径也更短，有利于学习长距离关系。

但 Transformer 并非“完全并行”：不同层仍按前后顺序执行，集合通信也可能同步等待；自回归推理时下一个 token 依赖前一个 token，生成步之间仍不能并行。标准稠密 Attention 对长度 $$n$$ 会形成 $$n \times n$$ 的分数矩阵，长序列的计算、显存与 IO 因而成为重要瓶颈。

## 展开说明

训练阶段的差异可以从三点比较：

- **顺序关键路径**：经典 RNN 约有 $$\mathcal{O}(n)$$ 个连续时间步；Transformer 单层内可同时处理所有已知位置，但层数方向仍是顺序的。
- **长距离信息路径**：RNN 中相隔很远的 token 需要经过许多状态传递；全局 Self-Attention 在一层内即可建立直接联系。
- **硬件利用率**：Transformer 的主要运算是规则的矩阵乘，更容易批量执行和切分到加速器；RNN 的逐时间步调度较难把同样规模的并行硬件持续填满。

若隐藏维度为 $$d$$、序列长度为 $$n$$，标准 Self-Attention 的分数计算约为 $$\mathcal{O}(n^2d)$$，分数矩阵空间约为 $$\mathcal{O}(n^2)$$；FFN 通常约为 $$\mathcal{O}(nd^2)$$。因此在 $$n$$ 很大时 Attention 可能占主导，在 $$d$$ 很大、序列较短时 FFN 也可能是主要计算。FlashAttention 通过分块和重计算减少 HBM IO 与中间显存，并没有把精确稠密 Attention 的理论二次计算量普遍改成线性。

RNN 也并非没有价值：它的状态可以紧凑地流式更新，某些低延迟、长流式或资源受限场景可能更合适。结论应是 Transformer 更符合当前大规模训练的硬件和扩展方式，而不是它在所有任务上都严格优于 RNN。

## 工程实践

训练吞吐不能只看理论 FLOPs。应同时测序列长度、Padding 比例、Attention Kernel、FFN、跨卡通信和数据加载。推理时也要区分 Prefill 与 Decode：Prefill 能对 Prompt 位置做大规模并行；Decode 的时间步有依赖，但可以在请求 Batch、Attention Head、张量维度和设备之间并行。长上下文优化还需同时关注 KV Cache、显存带宽和尾延迟。

## 常见追问

1. **Transformer 在训练阶段可以完全并行吗？哪些方向仍然串行？** 不能。同一层的序列位置可并行，但 Transformer 层仍要逐层执行，跨卡集合通信也可能形成同步点。
2. **自回归 Decode 为什么不能一次并行生成所有 token？** 第 $$t+1$$ 个 token 的条件分布依赖第 $$t$$ 个实际生成结果，未知结果造成跨生成步的数据依赖。不过单步内部以及多个请求之间仍可并行。
3. **Self-Attention 的时间和空间复杂度分别是什么？** 标准全注意力的打分计算约为 $$\mathcal{O}(n^2d)$$，显式分数矩阵空间约为 $$\mathcal{O}(n^2)$$；完整 Block 还包含约为 $$\mathcal{O}(nd^2)$$ 的投影与 FFN。
4. **FlashAttention 降低的是理论复杂度还是 IO 与中间显存？** 对精确稠密 Attention，它主要通过 Tiling 和重计算减少 HBM 读写及中间存储，理论二次计算阶数通常不变。
5. **哪些场景下 RNN 的流式状态仍可能有优势？** 当任务要求持续流式处理、严格有界状态或设备资源很小，RNN 的递归状态可能更省内存。是否占优仍取决于任务质量和硬件实现。

## 一句话复习

> Transformer 消除了训练时的时间步递归，能用矩阵运算并行处理已知序列，但层间、通信和自回归生成仍有顺序依赖，长序列还受二次 Attention 约束。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)

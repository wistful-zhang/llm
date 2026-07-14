---
title: "MoE 中 Shared Expert 与 Routed Expert 有什么区别？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "困难"
tags:
  - MoE
  - Shared Expert
  - Expert Parallel
published: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 Shared Expert 对所有 Token 生效，Routed Expert 由 Router 稀疏选择；停顿后说明互补性。
2. **再讲关键机制**：解释共享路径承载通用能力、路由路径学习专门化，以及输出组合方式。
3. **主动说取舍**：指出共享专家提高稳定性却增加每 Token 固定 FLOPs，路由专家高效但有负载与通信风险。
4. **最后落到项目**：做共享数量与 Top-k 消融，监控专家利用率、路由熵、FLOPs、吞吐和通用/领域切片质量。

**60 秒口述示例：**

> 我先给结论：Shared Expert 是每个 Token 都经过的公共路径，Routed Expert 则由 Router 为不同 Token 稀疏选择；前者保通用能力，后者扩专门化容量。这里停一下，再讲两类输出通常相加或融合，共享路径能减轻所有知识都争抢路由槽位的问题。取舍是共享专家越多越稳，但每 Token 固定计算更高；路由越稀疏越省，却更依赖负载均衡。项目里我会消融共享专家数和 Top-k，比较专家利用率、路由熵、FLOPs、吞吐及通用与领域评测。

## 核心回答

**Routed Expert** 由 Router 根据每个 token 的表示选择 Top-k，只让少量专家处理该 token，以有限激活计算获得较大的总参数容量；不同专家有机会形成领域或模式上的专业化。**Shared Expert** 不参与稀疏选择，按模型设计对所有 token 固定启用，用来承载更通用、反复出现的能力，减少多个路由专家重复学习相同知识。

一种抽象写法是：`y = Shared(x) + Σ_{i∈TopK(x)} g_i(x) Expert_i(x)`。是否每层都有 Shared Expert、每个 token 是否必经它以及共享专家数量，取决于具体架构，不能把某个模型的实现当作所有 MoE 的定义。

## 展开说明

纯 Routed MoE 中，多个专家可能都花容量学习共同模式；把部分参数隔离成共享专家，可以让路由专家更专注于差异化知识。代价是 Shared Expert 对每个 token 都产生固定计算，过大时会削弱稀疏 MoE 的计算优势；Routed Expert 仍需要解决负载不均、容量溢出和专家塌缩。

部署时 Routed Expert 常沿设备做 Expert Parallel。token 按路由结果通过 All-to-All 发往专家所在 GPU，计算后再传回；Shared Expert 可以复制、切分或与部分专家同放，布局会影响通信和热点。Shared/Routed 的语义分工是训练涌现结果，不保证每个专家都能被人类清晰命名。

## 工程实践

除总体 Loss 外，应监控每个 Routed Expert 的 token 数、路由概率、容量溢出、负载变异、All-to-All 时间，以及 Shared Expert 的计算占比。按语言、领域和任务切片做消融：关闭或替换某些专家，判断所谓“专业化”是否稳定。跨节点部署要优先评估网络拓扑，否则通信可能吞掉稀疏计算收益。

## 常见追问

1. **每个 token 都一定经过 Shared Expert 吗？** 只有架构明确这样设计时才是；Shared Expert 不是所有 MoE 的必备组件。
2. **Shared Expert 越多越好吗？** 不是。它们能承载通用能力，但会增加每 token 固定 FLOPs，并减少留给稀疏专家的参数或预算。
3. **Expert Parallel 与 Tensor Parallel 的通信有何不同？** Expert Parallel 主要按路由重分发 token，常涉及 All-to-All；Tensor Parallel 切分层内矩阵，常在每层进行 All-Reduce/Reduce-Scatter 等集合通信。

## 一句话复习

> Shared Expert 固定承载共性，Routed Expert 稀疏学习差异；前者增加固定计算，后者带来路由、负载和 All-to-All 挑战。

## 参考资料

- [DeepSeekMoE：Shared Expert Isolation](https://arxiv.org/abs/2401.06066)
- [GShard：稀疏专家与并行计算](https://arxiv.org/abs/2006.16668)
- [Switch Transformers](https://arxiv.org/abs/2101.03961)

---
title: "MoE 中 Shared Expert 与 Routed Expert 有什么区别？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "困难"
study_tier: "role"
tags:
  - MoE
  - Shared Expert
  - Expert Parallel
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

Shared Expert 对所有 Token 生效，Routed Expert 由 Router 稀疏选择；回答要说明前者承载通用变换，后者提供专门化容量，二者输出如何组合。共享路径能减轻通用知识争抢路由槽位，却增加每 Token 固定 FLOPs；追问可讨论共享专家数量与 Top-k 的配比。

**可以这样答：**

> Shared Expert 是所有 Token 都经过的公共路径，Routed Expert 只处理 Router 选中的 Token；前者承载通用能力，后者提供专门化容量。两类输出通常相加或融合。共享专家能减少通用知识争抢路由槽位，但会增加每个 Token 的固定计算；路由越稀疏越省，却越依赖负载均衡。

## 核心回答

**Routed Expert** 由 Router 根据每个 token 的表示选择 Top-k，只让少量专家处理该 token，以有限激活计算获得较大的总参数容量；不同专家有机会形成领域或模式上的专业化。**Shared Expert** 不参与稀疏选择，按模型设计对所有 token 固定启用，用来承载更通用、反复出现的能力，减少多个路由专家重复学习相同知识。

一种抽象写法是：

$$
y = \operatorname{Shared}(x)
  + \sum_{i \in \operatorname{TopK}(x)}
    g_i(x)\,\operatorname{Expert}_i(x)
$$

是否每层都有 Shared Expert、每个 token 是否必经它以及共享专家数量，取决于具体架构，不能把某个模型的实现当作所有 MoE 的定义。

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

---
title: "Prefill/Decode 分离部署如何设计与扩缩容？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "困难"
study_tier: "role"
tags:
  - Prefill Decode 分离
  - Goodput
  - 分布式推理
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

开场把价值和难点一起说出来：分离不是为了“架构更高级”，而是让计算型的 Prefill 和带宽、时延敏感的 Decode 独立调度；真正棘手的是 KV Cache 的跨池交接。回答到资源特征、请求流转和扩缩容指标，基本就够完整了。

如果继续追问，通常会落到“什么时候不值得分离”或“D 池故障怎么办”。这时补充短 Prompt、低并发场景可能得不偿失，以及就近路由、交接超时和重算回退即可。

**可以这样答：**

> Prefill/Decode 分离是把整段提示词计算和逐 Token 生成放进两个资源池，分别按 TTFT、TPOT 和队列长度扩容。请求在 P 池算完后，需要把 KV Cache 交给合适的 D 实例继续生成，因此网络带宽、拓扑和故障回退是关键。它能减少长 Prompt 对生成请求的阻塞，但低并发或 KV 传输成本过高时，合并部署反而更简单。

## 核心回答

Prefill 计算密集、主要决定 TTFT；Decode 每步读取大量权重和 KV、常受显存带宽限制，主要决定 TPOT。混部时长 Prefill 会拉长 Decode 的迭代时间，而且两阶段被迫使用同一并行度。P/D 分离把它们放进独立实例池：Prefill 节点生成首轮 KV，再通过高速网络把 KV 传给 Decode 节点继续生成。

设计收益来自资源隔离和阶段独立扩缩容，代价是重复加载权重、KV 传输、额外排队与故障状态机。只有当减少干扰和定制并行度的收益大于传输与资源冗余时，分离才值得。

## 展开说明

容量规划应分别估计输入 Token 到达率和活跃 Decode 序列/输出 Token 率，而不是只按请求数平均分 GPU。路由器先选择 Prefill 实例，再根据 Decode 队列、KV 传输拓扑和 SLO 选择目标实例。

- **放置**：P/D 跨节点时，KV 大小随层数、KV Head、Head Dimension、精度和上下文长度增长；网络带宽与 NUMA/RDMA 拓扑可能成为瓶颈。
- **背压**：Decode 池满时不应继续无限产生 KV，可在入口限流或让 Prefill 延迟接单。
- **故障**：传输前、传输中和接管后的失败需要不同重试语义，重复接管不能产生两份对外输出。
- **扩缩容**：应分别以 Prefill 队列/TTFT 和 Decode 活跃序列/TPOT 为信号，并考虑模型加载冷启动。

版本边界：DistServe 给出了面向特定模型、硬件、网络和 SLO 的设计与实验；不同引擎的 KV 布局和传输协议可能不兼容，不能照搬论文中的倍数或最优 P:D 比例。

## 工程实践

先在真实输入/输出长度分布下测同机混部基线，再测 P/D 分离的 TTFT、TPOT、Goodput、KV 传输时间与字节数、网络利用率、池间排队和每请求 GPU 成本。故障注入要覆盖 Prefill 成功但 KV 未送达、Decode 接管后源节点重试、目标节点退出及扩缩容期间连接重建。

## 常见追问

1. **为什么 P/D 分离能为两阶段选择不同并行度？**  两个实例池各自加载模型并独立执行，Prefill 可偏向计算吞吐的张量/流水线配置，Decode 可偏向显存容量和低通信延迟的配置。
2. **KV 传输量如何粗略估算？** 对常规注意力，可按“2 × 层数 × KV Head 数 × Head Dimension × 前缀 Token 数 × 每元素字节数”估算每请求 KV；GQA/MQA 会减少 KV Head 数。
3. **什么场景不适合分离？**  低并发、短 Prompt、网络较慢或 GPU 很少时，额外权重副本和 KV 传输可能比阶段干扰更贵，此时优化混部调度更合理。

## 一句话复习

> P/D 分离用独立资源池隔离 TTFT 与 TPOT，但必须把 KV 传输、重复权重、背压和双池扩缩容算进总账。

## 参考资料

- 原始论文：[DistServe: Disaggregating Prefill and Decoding for Goodput-optimized Large Language Model Serving](https://arxiv.org/abs/2401.09670)

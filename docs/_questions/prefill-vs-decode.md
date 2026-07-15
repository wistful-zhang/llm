---
title: "Prefill 与 Decode 的计算和访存特征有什么不同？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文整理"
verified: true
review_status: "待复习"
category: "工程实践"
difficulty: "中等"
tags:
  - S级必答
  - Prefill
  - Decode
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

这题最适合用“算什么、读什么、影响哪个指标”来对照。先说明 Prefill 能并行处理整段输入，Decode 每步只产生一个 Token；随后把前者对应 TTFT、后者对应 TPOT，就不会只停留在概念层。

面试官可能会问为什么 Decode 不是算力密集，或 Chunked Prefill 解决了什么。答到矩阵形状小、每步反复读取权重和历史 KV，以及分块是为降低对 Decode 的阻塞即可。

**可以这样答：**

> Prefill 一次处理整段 Prompt，能形成较大的矩阵乘，通常更容易吃满算力，主要决定首 Token 延迟。Decode 每步只有一个新 Token，却要反复读取模型权重和历史 KV，算术强度较低，更受显存带宽和调度开销限制，主要决定每 Token 延迟。因此服务端常用连续批处理和分块 Prefill，平衡吞吐与生成时延。

## 核心回答

以 Decoder-only 模型为例，**Prefill** 在逻辑上处理整段 Prompt，在每一层为全部输入 token 计算隐藏状态并建立 KV Cache；同层内的 token 可以并行，长 Prompt 往往形成较大的矩阵乘，因此通常更偏计算密集，主要影响首 token 延迟（TTFT）。实现可以用 Chunked Prefill 把它拆成多轮调度，但语义上仍属于输入阶段。**Decode** 每轮只为每个活跃序列生成一个新 token，复用历史 KV Cache，但必须读取越来越长的 K/V；单步矩阵较小、数据搬运占比高，典型在线场景更偏显存带宽密集，主要影响 token 间延迟（ITL/TPOT）。

“Prefill 一定算力受限、Decode 一定带宽受限”只是常见工作区间，不是定律：短 Prompt 可能受调度和 kernel 启动影响，高 Batch Decode 也可能重新提高算术强度。

## 展开说明

设输入长度为 $$L$$，单层全注意力在 Prefill 中需要形成 $$L \times L$$ 的注意力关系，经典实现的计算量随 $$L^2$$ 增长；同时会写入全部输入 token 的 K/V。Decode 到第 $$t$$ 个位置时，新 Query 只占一个位置，但仍需与前 $$t-1$$ 个 Key 做注意力并读取对应 Value，所以单步注意力约随当前上下文长度线性增长。若连续生成 $$T$$ 个 token，总 Decode 工作量还会累积，而不是“有 KV Cache 后与长度无关”。

两阶段还会争抢不同资源：长 Prefill 容易阻塞已经在 Decode 的交互请求；Decode 请求数量多时，KV Cache 容量与内存带宽又会限制并发。因此现代调度器常使用 Chunked Prefill，把长输入切成若干块，与 Decode token 交错调度。

## 工程实践

压测时应分别记录排队时间、预处理时间、Prefill 时间、TTFT、TPOT/ITL 和端到端延迟，并按输入长度、输出长度和并发分桶。端到端 TTFT 从客户端发出请求计时，服务内部 TTFT 的起点可能不同，报告时要写清口径。在线聊天通常优先保护 TTFT 与尾部 TPOT；离线生成更看重总 tokens/s。若 Prefill 干扰 Decode，可限制每轮 batched tokens、启用 Chunked Prefill，或采用 Prefill/Decode 分离部署，但分离会增加 KV 传输、路由和资源碎片成本。

## 常见追问

1. **为什么 Prefill 可以并行而自回归 Decode 不能一次生成所有 token？** Prompt 已经全部已知，同层各位置可并行计算；未来输出尚未确定，第 $$t+1$$ 个 token 依赖第 $$t$$ 个 token 的采样结果。
2. **TTFT 是否只等于 Prefill 时间？** 不是。TTFT 还包含排队、Tokenizer/多模态预处理、调度、网络和首轮采样等时间。
3. **KV Cache 是否把 Decode 复杂度变成常数？** 不会。它消除了历史 token 的重复前向计算，但新 Query 仍需读取并关注历史 K/V。

## 一句话复习

> Prefill 并行处理整段输入并建立缓存，Decode 串行地产生新 token 并反复读取历史缓存，两者的瓶颈和指标必须分开看。

## 参考资料

- [Orca：迭代级调度的生成式模型服务](https://www.usenix.org/conference/osdi22/presentation/yu)
- [DistServe：分离 Prefill 与 Decode](https://arxiv.org/abs/2401.09670)
- [vLLM / PagedAttention 论文](https://arxiv.org/abs/2309.06180)

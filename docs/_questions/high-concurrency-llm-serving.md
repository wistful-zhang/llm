---
title: "如何为高并发 LLM 服务设计批处理、排队和限流？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "系统设计"
difficulty: "中等"
tags:
  - Continuous Batching
  - 限流
  - SLO
published: true
date: 2026-07-13
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** 高并发 LLM 服务要按 token 工作量准入，结合连续批处理、优先级队列和背压保护 GPU 与尾延迟。
2. **再讲关键机制：** 区分 prefill 与 decode 成本，说明请求 token 预算、队列、动态 batch、超时与取消。
3. **主动说取舍：** 追求最大 batch 能提高吞吐却拉高 TTFT；严格公平又可能降低缓存命中和整体利用率。
4. **最后落到项目：** 以负载回放报告 QPS/tokens/s、TTFT/TPOT P95、拒绝率、队列长度和成本；讲完停。

**60 秒口述示例：**

> 我会先从容量单位说起：请求数不能代表工作量，准入要估算输入加输出 token。调度层把 prefill 和 decode 分开看，用 Continuous Batching 填满 GPU；入口做限流和背压，超时请求及时取消释放 KV Cache。取舍是吞吐、公平和尾延迟。项目里我会回放真实长度分布，报告 tokens/s、TTFT 与 TPOT P95、拒绝率、队列等待和单位 token 成本。 压测必须复现真实长短请求混合。


## 核心回答

入口先按租户、优先级和预计 token 数做配额与准入控制（Admission Control），同时设置输入、最大输出和并发硬上限，并按实际消耗结算。超载时排队、降级或拒绝；推理层使用迭代级调度和连续批处理（Continuous Batching），在迭代边界移出完成序列，把空出的执行槽位和 KV Block 分配给新序列；KV Cache 用分页或块式管理减少碎片。目标不是单纯提高吞吐，而是在 TTFT、单 token 延迟、吞吐和公平性之间满足 SLO。

## 展开说明

关键设计包括：

- **按 token 计量**：相同请求数可能对应完全不同的输入和输出长度，限流不能只看 QPS。
- **有界队列**：设置最大等待时间和取消机制，避免无上限积压放大尾延迟。
- **连续批处理**：在解码迭代边界移出完成序列、接纳新序列，减少静态 Batch 中短请求等待长请求的空洞。
- **长度控制**：限制输入、最大输出和并发序列，必要时区分 Prefill 与 Decode 资源。
- **过载保护**：熔断下游、限制重试、路由到小模型或返回可重试错误。

流式输出本身只改善用户感知，并不减少计算；如果客户端取消能及时传到调度器并终止生成，才会节省后续计算。

## 工程实践

压测必须使用真实长度分布和突发流量，分别记录队列时间、TTFT、TPOT、p95 / p99 延迟、tokens/s、GPU 利用率、KV 占用和拒绝率。若只测固定短 Prompt，得到的容量结论通常不可靠。

## 常见追问

1. **Continuous Batching 与静态 Batch 有什么区别？** 静态 Batch 等整批请求结束后才换批；Continuous Batching 在每个生成步移出完成项并加入新请求，减少空槽。
2. **为什么应该按 token 而不是只按请求限流？** 一个 100-token 请求和一个 100k-token 请求的显存与计算差异巨大，请求数无法准确代表负载和 KV Cache 占用。
3. **Prefill 和 Decode 的瓶颈有什么不同？** Prefill 对整段 Prompt 并行矩阵计算，通常更计算密集；Decode 每步只生成少量 token，频繁读权重和 KV Cache，常更受带宽限制。

## 一句话复习

> 高并发服务要用有界排队、token 配额和迭代级批处理，在吞吐与尾延迟之间做可测的取舍。

## 参考资料

- 面经主题：[LLM 工程师公开面试复盘中的高并发题](https://huggingface.co/blog/herooooooooo/ai-engineer-job-offer)
- 技术依据：[ORCA 迭代级调度](https://www.usenix.org/conference/osdi22/presentation/yu)、[PagedAttention](https://arxiv.org/abs/2309.06180)

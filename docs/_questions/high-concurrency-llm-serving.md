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
answer_status: complete
date: 2026-07-13
---

## 面试时怎么答

先把容量单位从请求数改成 Token，因为长短请求的工作量差异巨大。入口按预计输入与输出做准入、限流和背压，调度层用 Continuous Batching，并分别考虑 Prefill 与 Decode。追问尾延迟时，说明超时请求要及时取消并释放 KV Cache，同时用优先级或请求老化避免长请求饿死。

**可以这样答：**

> 高并发 LLM 服务不能只按请求数做容量规划，应估算输入和输出 Token。入口负责准入、租户限流和背压，调度器用 Continuous Batching 持续填满 GPU，并避免长 Prefill 阻塞正在 Decode 的请求。超过截止时间的请求要尽快取消并释放 KV Cache。系统需要在总吞吐、TTFT、TPOT 与公平性之间权衡，而不是只追求最高 tokens/s。

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

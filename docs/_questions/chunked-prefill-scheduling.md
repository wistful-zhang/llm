---
title: "Chunked Prefill 如何兼顾 TTFT 与 TPOT？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "中等"
tags:
  - Chunked Prefill
  - TTFT
  - TPOT
published: true
verified: true
date: 2026-07-14
---

## 核心回答

完整处理一个长 Prompt 会形成很长的 Prefill 迭代，让同批 Decode 请求长时间收不到下一个 Token。Chunked Prefill 把 Prompt 拆成若干 Token Chunk，分多轮完成，并在每轮剩余预算中安排 Decode，使长 Prefill 不再一次独占 GPU。

Chunk 太大，Prefill 仍会造成 TPOT 尖峰；Chunk 太小，调度、元数据和 Kernel 启动开销上升，且该请求完成 Prefill 的轮数增加、TTFT 可能变差。因此要基于 SLO、模型和流量选择 Chunk/Token Budget，而不是固定追求最小块。

## 展开说明

SARATHI 的核心思路是 Decode-maximal Batching：每批放入一个 Prefill Chunk，再用 Decode 请求填充剩余计算空间，使计算密集的 Prefill 与带宽密集的 Decode 更好共存。工程实现还要维护每个 Prefill 请求已经计算到的位置、对应 KV Block 和可被调度的下一段。

- Chunk 切分不能改变因果注意力结果；后一块必须能访问已经计算的前缀 KV。
- 调度器应限制单轮 Scheduled Tokens，并给等待过久的 Prefill 保留进度，避免长请求饥饿。
- 多模态 Encoder 或特殊 Attention Kernel 未必支持任意切块，必须先验证正确性。

版本边界：SARATHI 论文与各推理引擎对 Chunked Prefill 的定义、默认开关和兼容限制并不完全相同；尤其是 Prefix Cache、推测解码和多模态组合能力应以所用版本文档和回归测试为准。

## 工程实践

按 Prompt 长度分桶扫描 Chunk Size 与每轮 Token Budget，比较 P50/P95/P99 TTFT、TPOT、Decode 抖动、吞吐和调度 CPU 开销。加入短请求与超长请求混合、突发流量和 KV 紧张场景，确认优化没有以牺牲某一类请求的尾延迟换取平均吞吐。

## 常见追问

1. **Chunked Prefill 为什么不会改变模型输出？**  因果注意力中后一段只依赖自己和之前的 Token；只要位置、Mask 与前缀 KV 完全一致，分段计算与一次性 Prefill 在算法语义上等价，数值上可能有微小实现差异。
2. **Chunk 越小是否 TPOT 一定越好？**  不一定。更小块缩短单轮 Prefill 干扰，但会增加轮数与调度/Kernel 开销，最终要测 SLO 下的最优点。
3. **如何避免长 Prompt 一直做不完？**  使用等待时间提升、最小进度保证或独立队列，让长 Prefill 在若干轮内获得确定的 Chunk 配额，而不是永远被 Decode 抢占。

## 一句话复习

> Chunked Prefill 用多轮小块把长 Prompt 的干扰摊开，Chunk 大小是在 TTFT、TPOT、吞吐和调度开销之间找平衡。

## 参考资料

- 原始论文：[SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills](https://arxiv.org/abs/2308.16369)

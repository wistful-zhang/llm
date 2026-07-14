---
title: "PagedAttention 如何管理 KV Cache，它解决了什么问题？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文整理"
verified: true
review_status: "待复习"
category: "工程实践"
difficulty: "困难"
tags:
  - S级必答
  - PagedAttention
  - KV Cache
published: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 PagedAttention 把 KV Cache 切成固定块并用逻辑到物理映射，核心解决碎片和过度预留；停顿后讲分页。
2. **再讲关键机制**：解释按需分配、非连续物理块、共享前缀与写时复制如何支持动态序列。
3. **主动说取舍**：指出它不减少理论注意力计算，还会增加页表、块大小与 Kernel 复杂度。
4. **最后落到项目**：根据长度分布调块大小，监控 KV 利用率、内部碎片、可用并发、吞吐和 TPOT。

**60 秒口述示例：**

> 我的结论是，PagedAttention 借鉴操作系统分页，把连续的逻辑 KV 序列映射到非连续固定大小物理块，从而减少提前预留和外部碎片。这里停一下，再讲请求增长时按需拿块，结束后立即归还；共享前缀还可配合引用计数和写时复制。取舍是它没有改变注意力的理论计算量，块太大有内部碎片，太小又增加元数据和 Kernel 开销。项目里我会用真实长度分布调参，报告 KV 有效利用率、碎片率、并发、Goodput 和 P95 TPOT。

## 核心回答

PagedAttention 借鉴虚拟内存分页，把一条序列逻辑上连续的 KV Cache 切成固定大小的 **Logical Block**，再通过 Block Table 映射到显存中不必连续的 **Physical Block**。新 token 到来时按需分配物理块，不必为每个请求预留完整最大长度，因此能减少连续内存要求、外部碎片和过度预留；内部浪费通常被限制在每条序列最后一个未填满的块中，从而提高有限显存可容纳的并发序列数。

它主要优化的是 **KV Cache 的内存管理与共享**，不改变同一工作负载的注意力算术量：长度为 `L` 的 Prefill 全注意力仍是 `O(L²)`，使用 KV Cache 的单步 Decode Attention 仍随当前上下文长度线性增长，连续生成多步后再累积。高吞吐来自更高的缓存利用率、更少的内存浪费，以及由此支持的更大动态 Batch，而不是复杂度降阶。

## 展开说明

每个请求维护一张 Block Table：逻辑块编号指向实际物理块编号，Attention kernel 根据这张表读取分散的 K/V。物理块可以在请求结束时立即回收到空闲池；并行采样或 Beam Search 共享相同前缀时，还可以让多个逻辑序列指向同一物理块。只有需要写入仍被共享的块时才使用 Copy-on-Write，例如共享的末块尚未填满；若共享前缀块已满，追加新块不需要复制旧块。

块大小存在取舍：块太大时，最后一个未填满块的内部碎片较多；块太小时，Block Table、调度和非连续访问开销增加。分页也不等于缓存永远不会 OOM：总的有效 KV token 仍受显存约束，长上下文、高并发、较多 KV Head 或较高精度都会消耗容量。

## 工程实践

部署时应结合输入/输出长度分布调节 block size、最大 batched tokens、最大并发序列和 KV Cache 精度，并监控已用块、空闲块、抢占/重算次数、Prefix Cache 命中率与 OOM。比较方案时要固定模型、长度和并发；只看单请求延迟，可能看不出分页式管理在混合长度负载中的优势。

## 常见追问

1. **Logical Block 和 Physical Block 有什么区别？** 前者属于某条序列的逻辑地址空间，后者是实际显存块；Block Table 负责二者映射。
2. **PagedAttention 会让一次 Attention 的 FLOPs 显著减少吗？** 通常不会，它保持相同注意力语义；核心收益是降低缓存浪费并支持更灵活的调度和共享。
3. **为什么 Prefix Sharing 需要 Copy-on-Write？** 多个序列可以只读共享前缀块；某个序列要追加或修改共享块时才复制，避免影响其他序列。

## 一句话复习

> PagedAttention 用块表把逻辑连续的 KV Cache 映射到非连续显存，减少预留与碎片，而不是改变注意力公式。

## 参考资料

- [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)
- [vLLM 官方 Paged Attention 设计文档](https://docs.vllm.ai/en/stable/design/paged_attention/)

---
title: "为什么 GPU 还有空闲显存却 OOM，如何分析分配器碎片与内存池？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "中等"
tags:
  - GPU OOM
  - 内存碎片
  - CUDA Allocator
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

先区分 Allocated、Reserved 与能否满足一次连续大块申请。缓存分配器保留显存，变长 Shape 的分配与释放又会产生不能合并的小块，所以总空闲不代表能拿到所需大块。排查应看 Memory Snapshot 和张量生命周期；`empty_cache` 只能释放部分缓存，不是修复泄漏或碎片的根因方案。

**可以这样答：**

> GPU 显示还有空闲显存却 OOM，常见原因是没有足够大的连续可用块。框架的缓存分配器会保留已申请显存，频繁变化的 Shape 又会把内存切成难以合并的小块，因此 Reserved 很高、Allocated 较低也可能失败。排查应结合 Memory Snapshot 找出分配尺寸和张量生命周期，再考虑固定 Bucket、调整分配策略或减少长短请求混用。

## 核心回答

“空闲显存”要先区分口径：`memory_allocated` 是活跃张量占用，`memory_reserved` 是 PyTorch Caching Allocator 向 CUDA 申请并管理的段，驱动工具显示的是进程外部看到的剩余容量。OOM 可能是活跃集合本来就超过容量，也可能是 Reserved 段内虽然有空闲块，却没有满足本次请求的可复用块；还可能有 NCCL、CUDA Graph 或自定义扩展等不被 PyTorch 张量统计完整覆盖的分配。

碎片常由频繁、交错的不同大小分配以及动态 Shape 引起。诊断要看 OOM 时请求大小、Allocated/Reserved、Inactive/Split Block 和内存时间线，而不是看到 `reserved >> allocated` 就直接断言碎片。

## 展开说明

- **内部/外部浪费**：块大于请求会产生内部浪费；空闲块散落且无法合并或不满足尺寸/流约束时形成外部可用性问题。
- **动态 Shape**：相邻 Batch 长度小幅变化会反复形成略大/略小的分配，长期运行后比固定 Bucket 更容易留下尾部碎片。
- **内存池**：Caching Allocator 用缓存换取避免频繁 `cudaMalloc` 和同步；Reserved 不是内存泄漏的同义词。
- **`empty_cache()`**：能把未占用缓存还给 CUDA，并在部分情形减轻碎片，但不能释放仍被张量引用的内存，也不能降低真实峰值活跃集合。

缓解手段按证据选择：修复引用泄漏、限制 Shape Bucket/Batch Token、复用缓冲区、降低峰值并发；Allocator 参数只在 Snapshot 证明对应碎片模式时调整。盲目频繁清缓存可能增加同步和重新分配成本。

版本边界：PyTorch Native/CUDA Async Allocator 的统计项与调优参数不同，Memory Snapshot 只看得到 PyTorch 分配器管理的内存；NCCL 等直接 CUDA 分配需结合设备级工具。参数支持与语义以具体 PyTorch/CUDA 版本为准。

## 工程实践

在可控环境重放到 OOM 前，保存 PyTorch Memory Snapshot、请求 Shape、Batch Token、KV 使用与并发时间线，并对照设备总占用。先用更小并发或固定 Shape 验证峰值/碎片假设，再一次只改一个分配器参数；长期监控活跃、保留、不可释放块和 OOM 请求大小。

## 常见追问

1. **`nvidia-smi` 还有显存为什么一次分配仍可能失败？**  工具展示的是驱动层总量，申请还受块大小、其他库分配、上下文/图内存和分配器状态影响；也可能“剩余很多”但仍小于这次大申请。
2. **`empty_cache()` 为什么不是通用修复？**  它只释放缓存中的未占用块，不能释放活跃张量、KV 或泄漏引用；频繁调用还会失去缓存并增加分配同步开销。
3. **怎样区分内存泄漏与碎片？**  若活跃 Allocated 随请求结束仍持续增长，优先查引用泄漏；若活跃量稳定但 Reserved/不可复用块增长且大申请失败，再用 Snapshot 验证碎片。

## 一句话复习

> “有空闲却 OOM”先统一 Allocated、Reserved 和 Driver 口径，再用 Snapshot 证明是活跃峰值、外部分配还是碎片，不能迷信清缓存。

## 参考资料

- 官方文档：[PyTorch CUDA Memory Management](https://docs.pytorch.org/docs/stable/notes/cuda.html#cuda-memory-management)
- 官方文档：[Understanding CUDA Memory Usage](https://docs.pytorch.org/docs/stable/torch_cuda_memory.html)

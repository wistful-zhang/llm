---
title: "分布式训练的数据加载、分片与断点续训如何设计？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "中等"
tags:
  - DataLoader
  - 数据分片
  - 断点续训
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

从全局样本顺序讲起，再解释怎样按 Rank 与 DataLoader Worker 做互斥分片；只说 DistributedSampler 不够。断点要记录 Shard、样本偏移和 Shuffle 状态，而不是只有 Epoch。追问弹性扩缩容时，说明 Rank 会变化，需要重新映射剩余样本，并验证重复与遗漏。

**可以这样答：**

> 分布式数据加载要先定义可复现的全局样本顺序，再按 Data Parallel Rank 和本地 Worker 做互斥分片，并让所有 Rank 在每个 Epoch 使用一致的 Shuffle Seed。断点续训需要保存当前 Shard、样本偏移和随机状态。扩缩容后 Rank 会重排，因此要重新映射尚未消费的样本，并汇总样本 ID 检查没有重复或遗漏。

## 核心回答

数据并行训练需要让各 Rank 在同一全局顺序上获得互不冲突的样本分片，并在每个 Epoch 以确定方式重新 Shuffle。Map-style 数据集常用 DistributedSampler；必须每个 Epoch 调用 `set_epoch(epoch)`，否则不同 Epoch 可能使用相同排列。Iterable/流式数据集则要显式按 Rank 和 Worker 分片，否则每个进程可能重复消费完整数据流。

断点续训应保存 Epoch、全局样本/Token 进度、Sampler/RNG 状态和数据 Manifest。若 World Size 改变，旧 Rank 游标无法直接复用，应从逻辑全局位置重新分片，并明确允许重放还是要求精确去重。

## 展开说明

- 当数据量不能整除副本数时，`drop_last=false` 的 DistributedSampler 可能补充索引以使各 Rank 等长，因此会有少量重复；`drop_last=true` 则丢弃尾部。
- DataLoader Worker 也有独立随机状态，数据增强必须按 Base Seed、Rank、Worker 和 Epoch 可推导初始化。
- 预处理、网络存储和解压应异步预取，但队列必须有界；盲目增加 Worker 会争抢 CPU、内存和文件句柄。
- 流式数据的“精确 Resume”通常需要可寻址 Shard、样本 ID 和已提交游标，不能只保存一个本地迭代器对象。

版本边界：PyTorch DataLoader、DistributedSampler 和 DataPipes/流式框架的状态恢复能力不同；`persistent_workers`、预取与随机初始化细节也受版本和启动方式影响。

## 工程实践

在每个 Batch 日志中抽样记录稳定样本 ID、Rank、Worker 与 Epoch，检查跨 Rank 重复和遗漏。压测 GPU Data Wait、CPU、存储吞吐、预取命中与内存；恢复测试在 Epoch 中间杀进程，并比较恢复前后重复/遗漏边界，而不是只确认 Loss 继续下降。

## 常见追问

1. **为什么 DistributedSampler 要调用 `set_epoch`？**  它把 Epoch 参与 Shuffle Seed；不更新 Epoch 时，每轮很可能得到相同顺序。
2. **数据量不能整除 World Size 怎么办？**  可以丢弃尾样本以保证无重复，也可以补索引保证各 Rank 步数一致；选择取决于数据规模和是否容忍少量重复，并应写进评测口径。
3. **World Size 改变后如何恢复数据位置？**  从稳定的全局样本/Shard 游标重建新分片；按旧 Rank 的局部偏移恢复会造成重复或遗漏。

## 一句话复习

> 分布式数据管道要在全局样本顺序上做确定分片，并把 Epoch、RNG、Manifest 与逻辑游标纳入 Checkpoint。

## 参考资料

- 官方文档：[PyTorch Data Loading and Processing](https://docs.pytorch.org/docs/stable/data.html)

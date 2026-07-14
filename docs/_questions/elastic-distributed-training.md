---
title: "弹性分布式训练如何在 Worker 故障或扩缩容后恢复并保持状态一致？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "困难"
tags:
  - Elastic Training
  - 容错
  - Rendezvous
published: true
verified: true
date: 2026-07-14
---

## 核心回答

弹性训练把一组 Worker 作为一个一致性单元。Worker 通过 Rendezvous 组成 Worker Group；任一 Worker 故障或成员变化时，框架通常终止剩余 Worker，再用新的 World Size 和 Rank 重新启动整组，而不是让幸存 Rank 在旧 Collective 中继续。应用从最近一次已提交 Checkpoint 恢复，因此训练循环必须可重入且不能依赖永久 Rank。

一致恢复不仅需要模型权重，还包括 Optimizer、LR Scheduler、Grad Scaler、全局 Step、RNG 和数据游标。若 World Size 改变，有效 Batch、数据分片和 Scheduler 语义也可能改变；系统必须明确保持全局 Batch、每卡 Batch 还是学习率，并接受从最近 Checkpoint 到故障点之间的重算。

## 展开说明

- **故障检测**：Agent/Launcher 监视子进程并触发组级重启；Collective 中单 Rank 消失不能只重启一个进程后无缝接回。
- **Rendezvous**：为一次成员组装分配新 Rank；Rank 在不同重启间不稳定，不能拿 `RANK==0` 当永久节点身份。
- **一致点**：Checkpoint 只有在所有必要分片和元数据提交后才可见；外部日志或样本消费需要幂等键。
- **缩放语义**：World Size 变化会改变每步样本数、每 Epoch Step 数和数据分片，恢复代码要重新构造 Sampler 与通信组。

版本边界：TorchElastic 保证的是 Worker 管理与重启语义，不自动保证用户训练状态或数据管道 exactly-once。可变 World Size、最大重启次数和 Rendezvous 后端能力受 PyTorch 与部署环境版本约束。

## 工程实践

每隔固定 Token 或 Step 保存一致 Checkpoint，并把运行 ID、Checkpoint ID 和数据游标写入日志。故障注入覆盖单进程退出、节点掉线、网络分区、扩容与缩容；验收恢复后的 Step/LR、样本重复范围、全局 Batch、Loss 连续性和最终质量，而不只是“进程重新起来了”。

## 常见追问

1. **为什么成员变化后通常重启整个 Worker Group？**  Collective 要求所有 Rank 对通信顺序和成员集合达成一致；只替换一个 Rank 会让旧通信上下文和新 Rank 状态不匹配。
2. **怎样处理 Checkpoint 之后已经消费但尚未提交的样本？**  最简单是允许最多一个 Checkpoint 间隔的重放，并保证日志/外部写入幂等；若要求更强语义，需要把数据游标和状态提交做成同一一致点。
3. **World Size 变大后学习率一定按比例放大吗？**  不一定。若通过减小累积步数保持全局 Batch 不变，学习率可不变；只有全局 Batch 真正变化时才考虑缩放并重新验证收敛。

## 一句话复习

> 弹性训练靠组级重启、Rendezvous 和完整 Checkpoint 恢复，Rank 不是身份，World Size 变化必须重新定义数据与优化语义。

## 参考资料

- 官方文档：[PyTorch Elastic Run](https://docs.pytorch.org/docs/stable/elastic/run.html)

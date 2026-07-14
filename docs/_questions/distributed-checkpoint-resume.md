---
title: "分布式训练如何保存、重分片并精确恢复 Checkpoint？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "困难"
tags:
  - Distributed Checkpoint
  - 断点续训
  - Reshard
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** 分布式 Checkpoint 必须保存模型、优化器、调度器、随机数和数据游标，并以原子清单标记一次完整快照。
2. **再讲关键机制：** 讲清各 rank 分片写入、全局 barrier/manifest、校验和，以及 world size 改变后的重分片。
3. **主动说取舍：** 全量快照恢复精确但 I/O 重；异步与增量保存更快，却增加一致性和版本兼容难度。
4. **最后落到项目：** 做故障演练，比较恢复后 loss 连续性、样本重复/跳过数、保存 P95 和恢复时间；讲完停。

**60 秒口述示例：**

> 我会先定义“可恢复”不是只存权重。还要保存优化器状态、学习率步数、scaler、各类 RNG，以及数据加载器当前位置。各 rank 先写临时分片，校验完成后再原子发布 manifest；world size 改变时需要可重分片格式。项目中我会定期强杀 worker，检查恢复前后 loss 连续性、样本重复或跳过数、保存 P95 和 RTO。 最后还会说明重分片的版本兼容边界。


## 核心回答

大模型 Checkpoint 应让各 Rank 并行保存本地参数/Optimizer 分片，避免先在单 Rank 聚合完整状态造成显存、主存和网络峰值。Checkpoint 由数据分片与全局元数据共同组成，只有全部必需对象写完并通过校验后，才原子发布一个完成标记或 Manifest；恢复端只加载已提交版本。

精确续训还要保存 LR Scheduler、Grad Scaler、全局 Step、RNG、数据游标和训练配置。若恢复到不同 World Size，加载器需要按全局张量布局读取旧分片并重新分发，而不是假设“旧 Rank 文件对应新 Rank”。

## 展开说明

- **格式**：逻辑 State Dict 应尽量与物理分片解耦，元数据描述每个张量的全局形状、Dtype、偏移和分片位置。
- **提交**：先写临时目录/唯一前缀，校验所有分片，再发布 Manifest；对象存储上不能依赖目录 Rename 等同于本地原子操作。
- **兼容**：参数重命名、模型结构、Optimizer 类型或并行布局变化需要显式迁移，不能静默跳过不匹配状态。
- **保留**：按最近 N 个、里程碑与最佳指标分层保留；删除前确认没有运行正在引用。

RNG 与数据游标决定“接下来看到什么”，Optimizer State 决定“接下来怎样更新”。只恢复模型权重是 Warm Start，不是精确 Resume。

版本边界：PyTorch Distributed Checkpoint API、State Dict 规范和 Planner 能力会演进；跨框架或跨大版本恢复前应锁定格式版本，并用小规模迁移演练验证。

## 工程实践

定期做恢复演练：在已知 Step 强制终止，换相同和不同 World Size 恢复，核对首个 Batch ID、LR、RNG 抽样、Optimizer 统计和后续 Loss。监控保存耗时、训练暂停、总字节、失败分片、校验失败与恢复 RTO，并把 Checkpoint 写入与训练进度日志关联。

## 常见追问

1. **为什么不能只让 Rank 0 保存完整模型？**  超大模型聚合可能让 Rank 0 OOM，并把网络和存储带宽串行化；并行分片保存能扩展，但必须有全局元数据和一致提交。
2. **如何避免加载到“半个 Checkpoint”？**  数据先写到未发布版本，所有分片成功并校验后再写完成 Manifest；恢复端只枚举有有效 Manifest 的版本。
3. **换 World Size 后怎样恢复？**  按全局张量坐标读取旧 Shard，再根据新布局重分片；同时重建通信组和数据 Sampler，不能复用旧 Rank 编号映射。

## 一句话复习

> 分布式 Checkpoint 要把逻辑状态与物理分片解耦，用一致提交保证完整性，并保存足够状态让新 World Size 可重分片恢复。

## 参考资料

- 官方文档：[PyTorch Distributed Checkpoint](https://docs.pytorch.org/docs/stable/distributed.checkpoint.html)

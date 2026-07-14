---
title: "GPU 集群如何做拓扑感知调度并减少资源碎片？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "系统设计"
difficulty: "困难"
tags:
  - GPU 调度
  - 拓扑感知
  - 资源碎片
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 GPU 调度要分层满足型号、显存、整机和互联拓扑，再优化装箱与公平性。
2. **再讲关键机制**：从节点、NUMA、PCIe、NVLink/NVSwitch 到跨机网络解释并行 Rank 的通信路径。
3. **主动说取舍**：紧凑放置利于通信也制造大块资源排队，分散提高利用率却可能拖慢训练。
4. **最后落到项目**：用排队 P95、GPU 利用率、网络通信占比、碎片率和作业完成时间评估策略。

**60 秒口述示例：**

> 我会先给结论：八张空闲卡不等于能跑一个八卡作业，它们必须满足型号、显存、MIG 配置和互联约束。调度器先做硬过滤，再尽量把张量并行 Rank 放在同一 NVLink 或 NVSwitch 域，流水线跨较慢链路，最后考虑 Bin Packing、公平排队和预留整机。取舍是紧凑放置性能好，却可能增加大作业等待。项目中我会联合看排队 P95、GPU 利用率、通信占比、资源碎片率和作业完成时间。

## 核心回答

拓扑感知调度先把作业需求表达完整：GPU 数/型号/显存、是否要同机、NVLink/NVSwitch、CPU NUMA、主存、网络/RDMA 和 MIG Profile；再以原子资源组分配，尽量把通信最重的 Rank 放在最快链路内。需要多卡同时启动的训练或推理应采用 Gang Scheduling，避免只拿到部分 GPU 却长期占着等待。

减少碎片要在 Bin Packing 与可调度性间平衡：把小作业紧凑放置能腾出整机给大作业，但过度堆叠会争抢 CPU、PCIe 和网络；Spread 能提高故障隔离，却可能让张量并行跨慢链路。调度评分应考虑未来大作业可用的连续 GPU 组，而不只是当前利用率。

## 展开说明

- **节点内**：对齐 GPU、NIC、CPU 与内存 NUMA；同为 8 张 GPU，不同 PCIe/NVLink 连接可能产生完全不同的 Collective 性能。
- **节点间**：优先同交换域、同 RDMA Fabric，并让并行策略匹配层级拓扑，例如 TP 尽量留在高速域。
- **异构资源**：型号、显存和 MIG Slice 要作为明确 Resource Class，避免任务拿到数量正确但能力不匹配的设备。
- **队列策略**：配额、优先级、预留和回填共同控制公平；抢占前要考虑 Checkpoint 成本。

Kubernetes Topology Manager 主要协调单节点 CPU、内存和设备的 NUMA Hint，并不自动理解整个 GPU Fabric。跨节点 NVLink/RDMA、Gang 和高级 GPU 评分通常还需要设备插件、DRA 信息或专用调度器。

版本边界：Kubernetes Topology Manager、Dynamic Resource Allocation、设备插件及 Gang/PodGroup 能力随集群版本和发行版变化；部署前应核对 Feature Gate、驱动与调度扩展的兼容矩阵。

## 工程实践

持续采集 GPU/NIC/NUMA 拓扑并给节点打不可变或自动维护的标签，提交时做 Admission 校验。指标包括 Pending 原因、GPU 利用率、不可用碎片、队列等待、跨域通信比例、作业吞吐和抢占重算；用 1/2/4/8 卡混合作业回放检验策略，而不是只追求总体分配率。

## 常见追问

1. **为什么 8 张空闲 GPU 不一定能调度一个 8 卡作业？**  它们可能分散在多台机器、型号/MIG Profile 不同，或缺少所需高速互联；数量可加不代表形成满足约束的资源组。
2. **Bin Packing 和 Spread 怎样选择？**  通信密集且需要保留整机时倾向拓扑内紧凑放置；需要容灾或避免共享瓶颈时适度分散，最终由 SLO、并行方式和队列结构决定。
3. **Topology Manager 能否自动把张量并行 Rank 放到同一 NVLink 域？**  不能一概而论。它协调节点级 NUMA Hint；GPU Fabric 感知还依赖设备暴露的拓扑信息和调度器实现。

## 一句话复习

> GPU 调度要把卡数升级为“满足型号、显存、NUMA、互联和原子分配的资源组”，并用拓扑评分与队列策略控制碎片。

## 参考资料

- 官方文档：[Kubernetes Topology Manager](https://kubernetes.io/docs/tasks/administer-cluster/topology-manager/)
- 官方文档：[Kubernetes Schedule GPUs](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)

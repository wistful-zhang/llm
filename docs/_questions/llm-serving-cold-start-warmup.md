---
title: "大模型服务为什么会冷启动，怎样设计加载、预热与就绪检查？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "中等"
tags:
  - Cold Start
  - Warmup
  - Readiness
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

冷启动要拆成制品下载、权重加载、CUDA 初始化、编译或图捕获、首次内存分配，逐段打点才能找优化点。就绪检查也应分进程存活、模型可用、代表性形状预热成功和允许接流量；预热可降首请求抖动，却会拖慢扩容并占 GPU。

**可以这样答：**

> 冷启动不只是下载权重，还包括反序列化、CUDA 上下文、显存池、Kernel 编译与图捕获。区分 Liveness 和 Readiness：进程活着不能接流量，必须在模型加载并完成代表性长度与 Batch 预热后才就绪。不过，预热越全面，扩容越慢。部署时应分阶段计时，监控加载 P95、预热失败率、首请求 TTFT、扩容 RTO 和预留副本成本。

## 核心回答

大模型副本启动通常经历制品拉取与校验、CPU 内存映射或反序列化、权重传入 GPU、通信组建立、CUDA 上下文和内存池初始化，以及首次运行触发的 Kernel 选择、编译、自动调优或 CUDA Graph 捕获。只检测端口打开会把这些开销暴露给首批用户。

应把探针分层：Liveness 只判断进程是否需要重启；Startup Probe 给慢加载留出时间；Readiness 只有在权重、依赖、通信和代表性 Warmup 请求全部成功后才通过。预热输入应覆盖实际会触发不同执行路径的长度、Batch、模态和量化配置，但不要用超大组合穷举所有形状。

## 展开说明

降低冷启动可以从制品本地化、分层缓存、并行加载、持久化编译产物、保持最小热副本和预测扩容入手。必须校验缓存制品版本与硬件兼容性。若模型加载失败，应让副本保持 Not Ready 并暴露明确阶段，而不是进入接流量—报错—重启的循环。

预热不会替代容量管理。扩容速度慢于流量突增时，仍需要排队上限、Admission Control、降级模型或预留容量。

## 工程实践

分别统计下载、校验、Host 加载、H2D、分布式初始化和 Warmup 的耗时；用生产中常见与边界形状各做一次预热。发布时先让新副本 Ready，再逐步接流；同时保留旧副本 Drain。重点看启动 P50/P95、首次与稳态 TTFT 差值、预热失败率、扩容到可服务时间和热备 GPU 小时。

## 常见追问

1. **Liveness 与 Readiness 为什么不能共用一个探针？** 加载中的健康进程不应被反复重启，也不应提前接流量；两者分别回答“要不要重启”和“能不能服务”。
2. **为什么只用一个短 Prompt 预热可能不够？** 不同长度、Batch、模态或量化路径可能触发不同 Kernel、内存分配和图捕获，首个真实边界请求仍会抖动。
3. **最小热副本是不是越多越好？** 不是；它降低扩容延迟但增加空闲成本，应根据流量预测误差、启动 RTO 和降级能力共同决定。

## 一句话复习

> 模型真正就绪应以完整加载和代表性预热成功为准，而不是以进程或端口存活为准。

## 参考资料

- 面经主题：[公开 LLM 面试题主题汇总](https://github.com/llmgenai/LLMInterviewQuestions)
- 官方文档：[NVIDIA Triton Model Warmup](https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton-inference-server-2270/user-guide/docs/user_guide/model_configuration.html#model-warmup)
- 官方文档：[Kubernetes Pod Lifecycle and Probes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)

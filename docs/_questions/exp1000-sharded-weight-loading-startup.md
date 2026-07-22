---
title: '数百 GB 模型权重怎样并行加载，避免启动时单节点内存爆掉？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - '权重加载'
  - 'Sharding'
  - '冷启动'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明按目标并行 rank 直接读取分片、流式校验和就绪屏障，避免先聚合全模型。

**可以这样答：**

> 权重文件应按张量和目标并行布局分片，每个 Rank 只读取自己需要的部分，不能先在 CPU 聚合完整模型再切。使用流式或内存映射加载，边读取边校验 manifest、dtype、shape 和内容哈希。存储并发要有限制，避免所有 GPU 同时打爆对象存储或本地磁盘。各 Rank 完成加载和必要预热后通过屏障进入 ready，任一分片失败则整个副本不接流量。

## 常见追问

1. **SafeTensors 有什么优势？** 它提供结构化元数据和安全的张量读取，支持按范围访问，避免执行任意反序列化代码。
2. **权重放对象存储直接读可以吗？** 可以但冷启动受网络影响，常配本地缓存、分层预取和带宽限额。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)

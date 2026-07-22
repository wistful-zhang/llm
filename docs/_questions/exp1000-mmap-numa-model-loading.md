---
title: 'CPU Offload 或权重加载时，mmap 和 NUMA 配置为什么会影响性能？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'mmap'
  - 'NUMA'
  - 'CPU Offload'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释按需分页、页错误和跨 NUMA 内存访问，并说明绑核与预取。

**可以这样答：**

> mmap 允许按需映射大文件，减少一次性复制，但首次访问会产生页错误，冷启动抖动可能明显。多路 CPU 服务器上，内存页若分配在远离 GPU 或 Worker 的 NUMA 节点，会增加带宽压力和延迟。应将加载线程、内存分配和对应 GPU 绑到相近节点，并按访问顺序预取热点页。是否启用 huge page、pin memory 或直接 I/O 要用目标机器实测。

## 常见追问

1. **mmap 是否一定节省内存？** 可共享文件页并避免部分复制，但实际驻留集仍取决于访问模式和页面缓存。
2. **Pinned Memory 越多越好吗？** 不是，它不能被换出，会挤压系统内存，应只用于高频主机到设备传输缓冲。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)

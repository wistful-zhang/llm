---
title: '怎样手算一个请求的 KV Cache 大约占多少显存？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'KV Cache'
  - '显存估算'
  - '公式'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出层数×Token×KV 头×头维×K/V 两份×字节数，并说明并发相乘。

**可以这样答：**

> 常见 Decoder 每请求 KV 字节数可估为 2·L·S·Hkv·Dhead·B，2 代表 Key 与 Value，B 是每元素字节数。MHA 中 Hkv 等于注意力头数，GQA 和 MQA 会显著减小 Hkv。总容量还要乘并发请求，并加上分页块内部浪费、运行时元数据和安全余量。模型权重、激活工作区与 CUDA Graph 内存不属于 KV 公式，但同样占显存。

## 常见追问

1. **输出 Token 是否占 KV？** 占，每生成一个 Token 都会为各层追加 K 和 V，直到请求结束或缓存被释放。
2. **上下文滑窗能固定 KV 吗？** 局部注意力模型可淘汰窗口外 KV，但全局 Token 和模型语义必须按架构处理。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)

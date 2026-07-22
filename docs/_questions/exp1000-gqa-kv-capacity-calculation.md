---
title: '从 MHA 改成 GQA 后，并发容量为什么可能明显提升，怎样估算？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'GQA'
  - 'KV Cache'
  - '并发'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

以 KV 头数比例估算缓存节省，同时提醒权重和算子效率不会同比变化。

**可以这样答：**

> KV Cache 与 KV 头数近似线性相关，若查询头为 32、KV 头从 32 减到 8，缓存理论上约降为四分之一。释放的显存可以用于更多并发或更长上下文。模型总权重和 FFN 计算并不会按同样比例下降，吞吐提升还取决于注意力 kernel 与带宽。容量规划应把节省后的 KV 与模型、工作区和碎片共同放入实测。

## 常见追问

1. **MQA 的 KV 头只有一个就一定最好吗？** 缓存最省，但模型质量和并行效率可能受影响，GQA 常是折中。
2. **现有 MHA 权重能直接部署成 GQA 吗？** 不能无损直接改架构，通常需要训练时设计或经过转换和继续训练。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)

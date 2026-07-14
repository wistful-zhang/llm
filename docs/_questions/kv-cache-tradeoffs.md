---
title: "KV Cache 为什么能加速推理，又带来什么代价？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "工程实践"
difficulty: "中等"
tags:
  - KV Cache
  - 推理优化
  - 显存
published: true
date: 2026-07-13
---

## 核心回答

自回归生成时，历史 token 在每一层产生的 Key 和 Value 不会因新 token 到来而改变。KV Cache 保存这些结果，使下一步只计算新 token 在各层的完整表示，而不用重算历史 token 的隐藏状态和 K/V。对没有滑窗、淘汰或压缩的全注意力模型，缓存会随层数、有效序列数和上下文长度线性增长；新 Query 仍要读取并关注历史 Key，因此单 token 延迟不会与上下文长度无关。

## 展开说明

缓存显存可近似估算为：

2 × 层数 × Batch × 序列长度 × KV Head 数 × Head 维度 × 每元素字节数

其中 2 表示 Key 和 Value，Batch 表示同时保留缓存的有效序列数；Beam Search 会增加有效序列数，张量并行下单卡占用还取决于 K/V 如何分片。MHA 为每个 Query Head 保存 K/V；MQA 共享一组 K/V；GQA 使用少量 KV Head，在质量与缓存大小之间折中。滑动窗口模型的缓存可在窗口长度附近封顶。

KV Cache 解决的是重复计算，不等同于 Prefix Cache。后者尝试在不同请求之间复用相同前缀的缓存，还需要命中判断、隔离和淘汰策略。

## 工程实践

高并发服务通常结合分页式缓存、连续批处理、长度上限、会话淘汰和 KV 量化。优化时应同时观察 TTFT、单 token 延迟、吞吐、缓存利用率和 OOM，而不是只比较“开启缓存前后”的单请求速度。

## 常见追问

1. 为什么上下文越长，开启 KV Cache 后解码仍会变慢？
2. GQA 为什么能降低 KV Cache 显存？
3. PagedAttention 解决的是计算问题还是内存管理问题？

## 一句话复习

> KV Cache 用显存换取不重复计算历史前缀，但长上下文和高并发会让缓存本身成为瓶颈。

## 参考资料

- 面经主题：[LLM 工程师公开面试复盘中的 KV Cache 题](https://huggingface.co/blog/herooooooooo/ai-engineer-job-offer)
- 技术依据：[Hugging Face KV Cache 说明](https://huggingface.co/docs/transformers/main/cache_explanation)、[GQA](https://arxiv.org/abs/2305.13245)

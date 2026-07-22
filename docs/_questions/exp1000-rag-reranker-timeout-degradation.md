---
title: 'Reranker 超时或不可用时，RAG 应该怎样降级？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '中等'
tags:
  - 'Reranker'
  - '超时'
  - '降级'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明有界超时、保留初排结果和质量标记，避免整个请求无限等待。

**可以这样答：**

> 重排调用应有独立且小于端到端 SLA 的超时，并通过熔断避免故障放大。超时时可使用融合后的初排结果，但减少生成置信度、保留来源并记录降级标记。对高风险问答，如果初排质量不足，应返回无法确认而不是强行生成。监控要区分正常重排与降级流量的答案指标，以判断备用路径是否仍可接受。

## 常见追问

1. **可以并行跑两个 Reranker 吗？** 关键场景可做主备或竞速，但成本更高，还要处理结果尺度和一致性。
2. **降级时 Top K 要不要增大？** 可适度增加以补偿缺少重排，但会占用上下文并带来更多噪声，需要预先评测。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)

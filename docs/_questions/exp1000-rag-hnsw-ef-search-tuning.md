---
title: 'HNSW 的 efSearch 应该怎样调，为什么线上不能只追求最高 Recall？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'HNSW'
  - 'efSearch'
  - 'ANN'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 efSearch 控制查询探索宽度，并用召回、延迟和并发共同选点。

**可以这样答：**

> efSearch 越大，查询遍历的候选越多，近似召回通常提高，但 CPU、内存访问和尾延迟也会上升。先用 Flat 精确搜索得到小规模真值，再绘制不同 efSearch 下的 Recall 与 P95、P99 延迟曲线。参数还要在真实过滤比例和并发下测试，因为强过滤可能需要更深探索。生产可按查询难度或 SLA 动态选择档位，但必须设置资源上限。

## 常见追问

1. **efSearch 能小于返回的 K 吗？** 实现通常要求候选探索不小于 K，否则很难稳定返回足够邻居。
2. **提高建图参数能替代高 efSearch 吗？** 更好的图可改善查询，但会增加构建时间和内存，两者需要联合调优。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)

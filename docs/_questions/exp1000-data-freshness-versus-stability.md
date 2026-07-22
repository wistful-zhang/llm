---
title: '预训练语料追求 Freshness 时，怎样避免新数据质量和分布不稳定？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Data Freshness'
  - '数据质量'
  - '持续预训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明新近数据抓取窗口短、重复与事件热点偏重，需要稳定基线混合和延迟审计。

**可以这样答：**

> 最新数据能补充新知识，但缺少长期链接与人工筛选，垃圾、宣传和错误信息比例可能更高。突发事件还会在短期被大量重复报道，使 Data Mix 偏向热点。应保留稳定历史语料作锚点，对新数据做来源信誉、重复和时间分桶，并在小规模继续预训练中验证后再扩大权重。

## 常见追问

1. **只选权威新闻能解决吗？** 能降低部分风险，但覆盖有限且仍可能有后续更正，需要多源与时间验证。
2. **新知识一定要靠预训练更新吗？** 不一定，RAG 或工具可更快更新且可溯源，参数更新适合稳定广泛知识。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

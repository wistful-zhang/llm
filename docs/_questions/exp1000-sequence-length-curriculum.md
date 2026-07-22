---
title: '为什么预训练常从短 Sequence Length 开始，再逐步拉长？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '长度课程'
  - '训练效率'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明早期短序列降低 Attention 成本并增加样本多样性，后期再学长依赖。

**可以这样答：**

> 训练早期模型主要学习局部语言规律，使用短序列能显著减少 Attention 计算和激活显存，在同样算力下看到更多独立样本。后期拉长序列再学习长距离依赖和位置范围。切换时全局 Batch Token、学习率和数据分布都可能变化，应平滑过渡并监控短任务是否退化。

## 常见追问

1. **只在最后很少 Token 上训练长序列够吗？** 不一定，模型需要足够长依赖样本适应位置和优化分布。
2. **长度翻倍时样本数应怎样变？** 若保持每步总 Token 不变，序列条数通常相应减少。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

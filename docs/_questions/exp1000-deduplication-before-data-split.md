---
title: '为什么语料去重必须尽量发生在 Train、Validation、Test 切分之前？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
tags:
  - '数据去重'
  - '数据切分'
  - '泄漏'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明先切分会让同一内容的副本落入不同集合，造成验证结果虚高。

**可以这样答：**

> 若先随机切分再各自去重，同一文档或近重复版本可能分别落入训练集和验证集。模型在训练中已经见过等价内容，验证 Loss 和基准得分会被高估。应先在候选全集建立重复簇，再以簇为单位切分；需要时间评测时还要保留时间约束，避免旧副本把未来内容带回训练集。

## 常见追问

1. **按 URL 去重够吗？** 不够，同一内容可有镜像、参数化 URL、转载和格式不同的副本。
2. **重复簇跨时间怎么办？** 通常让整簇归属最早允许的时间段，或从评测中剔除有历史副本的样本。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

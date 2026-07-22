---
title: '按文档采样和按 Token 采样，为什么会得到不同的预训练分布？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
tags:
  - '数据采样'
  - '文档长度'
  - '预训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明按文档会让短文每 Token 权重更高，按 Token 会让长文贡献更多。

**可以这样答：**

> 每篇文档等概率时，短文虽 Token 少却与长文获得相同被选机会，因此单个短文 Token 权重更高。按 Token 均匀采样则长文因包含更多位置而更常出现，可能让书籍和代码仓库主导。应根据目标定义采样单位，并控制单文档最大贡献，避免极长重复文档吞噬训练预算。

## 常见追问

1. **先选来源再选文档能解决吗？** 能分层控制来源，但来源内部仍要定义长度和文档采样规则。
2. **切 Chunk 后再均匀采样是什么口径？** 更接近按 Chunk 或 Token 加权，长文会生成更多 Chunk。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

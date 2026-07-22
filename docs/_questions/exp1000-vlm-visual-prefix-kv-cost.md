---
title: '图片转成视觉前缀后，会怎样影响 LLM 的 KV Cache 和解码成本？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '多模态'
difficulty: '困难'
tags:
  - 'KV Cache'
  - '视觉前缀'
  - '显存'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明视觉 Token 参与 Prefill 并占用每层 KV，后续解码仍需关注该前缀。

**可以这样答：**

> 投影后的视觉 Token 通常作为上下文前缀进入 LLM，它们在 Prefill 产生每层 KV 并持续占用显存。视觉 Token 越多，首 Token 延迟和每个请求的 KV 容量都上升，进而降低并发。虽然视觉编码只做一次，后续每个生成 Token 的注意力仍会读取该前缀缓存。可通过 Resampler、选择相关区域或共享安全的视觉前缀缓存降本，但不能无损地任意删除。

## 常见追问

1. **生成开始后能释放视觉编码器特征吗？** 若已投影并写入 LLM KV，原始视觉特征通常可释放，但要看架构是否还需交叉注意力。
2. **多轮对话重复同一图片怎么办？** 可复用经过版本与权限校验的视觉表示或前缀 KV，避免重复编码。

## 延伸阅读

- [CLIP](https://arxiv.org/abs/2103.00020)

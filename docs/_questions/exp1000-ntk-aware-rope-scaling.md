---
title: 'NTK-Aware RoPE Scaling 为什么要对不同频率做非均匀调整？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'RoPE'
  - 'NTK Scaling'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分高频负责局部位置、低频负责长距离的作用，说明统一缩放的损失。

**可以这样答：**

> RoPE 的不同维度对应不同旋转频率，高频更敏感于局部位置，低频能覆盖更长距离。统一线性压缩会同时降低所有频率，容易伤害短距离分辨率。NTK-Aware 方法通过调整基频让各维度获得不同扩展程度，试图在保留局部模式的同时延长低频范围。

## 常见追问

1. **只改 RoPE Base 就能得到可靠长上下文吗？** 不能，通常还需要匹配的长文本训练和有效长度评测。
2. **为什么叫 NTK-Aware？** 设计动机来自缩放后模型核行为的近似保持，但工程实现常以频率重参数化呈现。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

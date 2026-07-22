---
title: '只看全局 Gradient Norm 为什么不足以诊断训练问题？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Gradient Norm'
  - '监控'
  - '训练诊断'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明全局值可能被大模块主导，应按层、参数类型和更新比率拆分。

**可以这样答：**

> 全局 Norm 汇总数十亿参数，Embedding、深层 FFN 或异常单层可能主导数值，其他模块梯度消失却看不出来。应按层和模块记录 Norm、非有限值、裁剪比例，并结合参数 Norm 计算 Update-to-Weight Ratio。拆分指标还能发现 Router、Norm Scale 或新加模块的学习速度与主干不匹配。

## 常见追问

1. **每个参数都记录会不会太贵？** 可以分组归约、降低采样频率，并只在异常窗口开启细粒度诊断。
2. **Gradient Norm 大就一定要裁剪吗？** 不一定，要看是否是稳定尺度、是否伴随 Loss Spike 和更新过大。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

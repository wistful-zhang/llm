---
title: '怎样判断模型没有学习是 Gradient Underflow，而不是数据或学习率问题？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Gradient Underflow'
  - '混合精度'
  - '诊断'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

要求对比高精度梯度、统计零值比例和 Scale 前后分布，不凭 Loss 猜。

**可以这样答：**

> 应在小批次上用 FP32 反传作参考，比较低精度梯度的零值比例、最小非零值和分层 Norm。若 FP32 有稳定小梯度而 FP16 大量变零，Loss Scaling 后恢复，就支持 Underflow 判断。若梯度本来就是零或方向错误，则应继续排查 Mask、冻结参数和计算图，而不是盲目增大 Scale。

## 常见追问

1. **全局 Norm 正常还能有 Underflow 吗？** 能，大模块正常值会掩盖某些层或稀有参数大量归零。
2. **BF16 也要检查零值比例吗？** 可以，虽然指数范围大，低尾数精度和算子转换仍可能损失小更新。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

---
title: 'TF32 在训练中加速了什么，它与把模型转成 FP16 有何不同？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - 'TF32'
  - 'Tensor Core'
  - '数值精度'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 TF32 使用 FP32 范围和较短乘法尾数，接口张量仍可保持 FP32。

**可以这样答：**

> TF32 是部分 NVIDIA Tensor Core 对 FP32 矩阵乘的内部计算格式，保留 8 位指数但减少乘法有效尾数。程序张量和累加通常仍按 FP32 语义处理，不需要像 FP16 混合精度那样显式转换全部参数。它提高 GEMM 吞吐但会改变数值结果，敏感实验需通过开关对比收敛和可复现性。

## 常见追问

1. **TF32 会加速所有 FP32 算子吗？** 不会，主要针对支持的矩阵乘和卷积，逐元素与归约不一定受益。
2. **为什么结果不再逐位一致？** 乘法输入尾数被截短，运算顺序与舍入误差和标准 FP32 路径不同。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

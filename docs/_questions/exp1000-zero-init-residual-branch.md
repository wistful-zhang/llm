---
title: '把残差分支最后一层零初始化有什么作用？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '零初始化'
  - '残差连接'
  - '初始化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调网络初始近似恒等映射，同时说明不能把所有层都零初始化。

**可以这样答：**

> 将残差分支最后的输出投影零初始化，会让每个 Block 在初始时近似恒等映射，深层网络的整体尺度更可控。训练开始后该投影先获得梯度，随后上游参数也逐渐参与学习。若把整条分支所有矩阵都置零，会因对称性或梯度链断开而难以学习，因此零初始化通常只用于特定末端参数。

## 常见追问

1. **Attention 的 W_O 可以这样初始化吗？** 可以作为一种稳定方案，但需和 FFN 输出投影、残差缩放及学习率一起设计。
2. **这与 ReZero 有什么关系？** ReZero 用初始为零的可学习残差系数控制整条分支，思想相似但参数化不同。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

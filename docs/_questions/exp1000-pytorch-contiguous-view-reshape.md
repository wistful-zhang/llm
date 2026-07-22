---
title: 'Tensor 的 contiguous、view 与 reshape 有什么关系？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'PyTorch'
  - '内存布局'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“Tensor 内存布局”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：无报错不代表零拷贝，热路径中的隐式复制会增加显存和延迟。

**可以这样答：**

> 核心判断是，转置会改变 stride 而不搬数据，view 需要兼容布局；reshape 可在必要时复制，contiguous 显式生成连续副本。实际验证可采用这个办法：转置二维 Tensor 后分别调用 view、reshape 并检查 storage。此外，无报错不代表零拷贝，热路径中的隐式复制会增加显存和延迟。

## 常见追问

1. **请用自己的话说明“Tensor 内存布局”的核心做法。** 转置会改变 stride 而不搬数据，view 需要兼容布局；reshape 可在必要时复制，contiguous 显式生成连续副本
2. **你准备怎样举例证明自己理解“Tensor 内存布局”？** 转置二维 Tensor 后分别调用 view、reshape 并检查 storage
3. **使用“Tensor 内存布局”前还要确认什么？** 无报错不代表零拷贝，热路径中的隐式复制会增加显存和延迟

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)

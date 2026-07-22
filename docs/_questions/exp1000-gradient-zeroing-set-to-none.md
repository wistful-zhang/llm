---
title: 'optimizer.zero_grad(set_to_none=True) 与把梯度清零有什么差别？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Gradient'
  - '显存'
  - '训练循环'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 None 可避免写零并让下一次反传直接分配，同时影响未获梯度参数的 Step 语义。

**可以这样答：**

> 把梯度张量写成零会保留内存并执行一次清零写入，设为 None 则释放引用或标记不存在，下一次反传创建新梯度。后者通常减少内存写和部分峰值，也能区分“本步没有梯度”与“梯度恰为零”。某些优化器对 None 参数跳过更新、对零梯度仍执行 Weight Decay 或动量更新，因此语义需要确认。

## 常见追问

1. **Gradient Accumulation 每个 Microbatch 都要清吗？** 不要，只在一个累积窗口完成优化器 Step 后清理。
2. **None 会导致更多分配开销吗？** 可能，但框架缓存分配器常能复用内存，实际需以 Profiling 为准。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

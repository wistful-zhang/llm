---
title: '海量分数中取 Top K 为什么常用最小堆？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '简单'
tags:
  - '算法'
  - 'Heap'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答“Top K 算法”时，先给出核心结论，再补一个能检查结论的例子，最后主动说明这条边界：如果需要稳定顺序或完整排序，还要保存 tie-breaker 并最终排序堆内容。

**可以这样答：**

> 核心判断是，维护大小 K 的最小堆，超过 K 时只让更大元素替换堆顶，时间 O(n log K)、空间 O(K)。实际验证可采用这个办法：处理重复分数、K 为零和 K 大于输入长度。此外，如果需要稳定顺序或完整排序，还要保存 tie-breaker 并最终排序堆内容。

## 常见追问

1. **请把“Top K 算法”的核心结论压缩成一句话。** 维护大小 K 的最小堆，超过 K 时只让更大元素替换堆顶，时间 O(n log K)、空间 O(K)
2. **你会用什么例子或检查验证“Top K 算法”？** 处理重复分数、K 为零和 K 大于输入长度
3. **“Top K 算法”最重要的适用边界是什么？** 如果需要稳定顺序或完整排序，还要保存 tie-breaker 并最终排序堆内容

## 延伸阅读

- [Python 3 官方文档](https://docs.python.org/3/)

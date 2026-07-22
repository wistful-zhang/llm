---
title: 'CUDA Warp Divergence 为什么会降低执行效率？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'CUDA'
  - 'Warp'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“Warp 分支分歧”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：短分支可能被谓词化，分歧影响也要结合访存和实际 profiler 判断。

**可以这样答：**

> 同一 Warp 中线程走不同分支时，硬件往往分批执行各路径并屏蔽无关线程，使有效并行度下降。要验证这一点，可以采用这个办法：比较按线程奇偶分支与按连续 Warp 分组分支的 Kernel 时间。使用时不能忽略，短分支可能被谓词化，分歧影响也要结合访存和实际 profiler 判断。

## 常见追问

1. **请用自己的话说明“Warp 分支分歧”的核心做法。** 同一 Warp 中线程走不同分支时，硬件往往分批执行各路径并屏蔽无关线程，使有效并行度下降
2. **你准备怎样举例证明自己理解“Warp 分支分歧”？** 比较按线程奇偶分支与按连续 Warp 分组分支的 Kernel 时间
3. **使用“Warp 分支分歧”前还要确认什么？** 短分支可能被谓词化，分歧影响也要结合访存和实际 profiler 判断

## 延伸阅读

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)

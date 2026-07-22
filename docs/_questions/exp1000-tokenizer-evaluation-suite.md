---
title: '怎样系统评估一个新 Tokenizer，而不是只看平均 Token 数？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '中等'
tags:
  - 'Tokenizer 评估'
  - 'Fertility'
  - '覆盖率'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出分语言压缩、Fallback、可逆性、边界稳定和模型质量五类指标。

**可以这样答：**

> 应按语言、领域和文本类型统计 Token Fertility、字符或 Byte 压缩率、UNK 与 Byte Fallback 比例。还要验证 encode-decode 可逆性、Unicode 与特殊 Token 安全、数字和空白边界，以及极长输入的最坏膨胀。Tokenizer 只是输入协议，最终还需在控制训练预算下比较模型 Loss、下游质量和实际吞吐。

## 常见追问

1. **为什么平均值会掩盖问题？** 高资源英文可能占多数，把某个低资源语言十倍膨胀的严重退化稀释掉。
2. **压缩率高就一定更快吗？** 通常 Token 更少有利，但大词表 Softmax、CPU 编码速度和内核也会影响端到端性能。

## 延伸阅读

- [HELM](https://arxiv.org/abs/2211.09110)

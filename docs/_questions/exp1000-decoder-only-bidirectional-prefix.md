---
title: 'Decoder-Only 模型怎样在同一序列里实现双向理解前缀和因果生成答案？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Decoder-Only'
  - 'Prefix Mask'
  - '条件生成'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

描述块状 Mask，并强调训练数据必须明确前缀与答案边界。

**可以这样答：**

> 可以构造块状 Attention Mask，让前缀内部任意位置互相可见，答案位置能看完整前缀和此前答案。答案内部仍保持下三角因果关系，避免看到未来标签。模型结构无需增加 Encoder，但训练管线、位置编码和高效 Attention 内核要支持这种非标准 Mask。

## 常见追问

1. **这种训练还能用 FlashAttention 吗？** 取决于内核是否支持 Prefix 或 Block Mask，普通纯因果快速路径未必可直接使用。
2. **前缀位置是否计算语言模型 Loss？** 可以不计算，常只对答案区监督，具体取决于目标设计。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

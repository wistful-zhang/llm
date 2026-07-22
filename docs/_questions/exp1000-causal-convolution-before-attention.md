---
title: '在 Attention 前加入短卷积或局部混合层，可能解决什么问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Local Mixing'
  - 'Convolution'
  - 'Attention'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从局部模式归纳偏置、Attention 负担和额外延迟三方面回答。

**可以这样答：**

> 短卷积能高效提取相邻 Token 的局部模式，让 Attention 更专注于较远或内容相关的连接。它提供平移局部性先验，对字符、代码和短语结构可能有帮助。因果生成中卷积必须只读取过去位置，并需要维护额外状态；层数和 Kernel 太大还会增加延迟与实现复杂度。

## 常见追问

1. **卷积能替代位置编码吗？** 它能提供局部顺序信息，但通常不足以表达任意长距离的精确位置。
2. **为什么一定要因果卷积？** 非因果卷积会在训练时读取未来 Token，造成标签泄漏。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

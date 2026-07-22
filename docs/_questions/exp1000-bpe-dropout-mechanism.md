---
title: 'BPE Dropout 与普通 Dropout 有什么不同？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
tags:
  - 'BPE Dropout'
  - 'Tokenizer'
  - '数据增强'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明它随机跳过部分 Merge，从而产生更细的 Tokenization，而不是丢模型激活。

**可以这样答：**

> BPE Dropout 在编码时随机不执行部分可用 Merge，让同一文本产生不同且通常更细的子词序列。它作用在数据离散化阶段，不是把网络激活置零。适量使用能提高对未见词形和边界的鲁棒性，概率过高则让序列膨胀并偏离推理时的标准切分。

## 常见追问

1. **它需要重新训练 BPE 词表吗？** 不需要，使用同一 Merge 表，只在应用 Merge 时随机跳过。
2. **为何推理时通常关闭？** 确定性切分更快、更可复现，也与缓存和长度估算一致。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

---
title: 'BPE 的 Merge Set 相同但顺序不同，Tokenization 为什么仍可能不同？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'BPE'
  - 'Merge Order'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用多个重叠 Pair 都可合并的例子说明优先级决定最终路径。

**可以这样答：**

> BPE 编码会按 Merge 的优先级处理可合并 Pair，重叠候选先合并哪一对会改变后续可见符号。即使最终拥有相同 Token 字符串集合，不同 Rank 也可能为同一文本选择不同分解。Tokenizer 资产必须保存完整有序 Merge，而不是只保存无序词表。

## 常见追问

1. **能每次选最长 Token 吗？** 那是另一种分词策略，不一定等价于按 BPE 训练顺序应用 Merge。
2. **为什么这种差异难以从词表大小发现？** 两者词表行和大小可以相同，差异藏在编码决策顺序中。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

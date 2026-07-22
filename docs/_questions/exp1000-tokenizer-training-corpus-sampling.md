---
title: '训练 Tokenizer 时，为什么不能随便从预训练语料抽一小份？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
tags:
  - 'Tokenizer Training'
  - '语料采样'
  - '多语言'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明词表只看样本中的频率，遗漏领域或语言会在后续全量训练中永久吃亏。

**可以这样答：**

> Tokenizer 词表由训练样本的字符和片段频率决定，样本偏向某语言、来源或短文会把 Merge 预算固化到错误分布。后续即使用全量预训练数据，缺失语言仍只能用碎片化 Token，除非更换词表并重训模型。应按目标数据混合分层采样，覆盖语言、代码、领域、Unicode 长尾和文档格式，并检查样本量是否让频率排名稳定。

## 常见追问

1. **Tokenizer 样本越大越好吗？** 大到频率和覆盖稳定即可，继续增加会提高训练成本且收益递减。
2. **需要和预训练 Data Mix 完全同权重吗？** 不一定，可适度上采样低资源语言，避免其在有限词表中完全失去表示效率。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

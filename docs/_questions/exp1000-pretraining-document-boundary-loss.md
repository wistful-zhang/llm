---
title: '预训练把多个文档拼接时，文档边界两侧的 Loss 应该怎样处理？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '文档边界'
  - '预训练 Loss'
  - 'EOS'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分预测 EOS、从 EOS 预测新文档开头，以及完全屏蔽跨文档注意力三种设计。

**可以这样答：**

> 文档末尾预测 EOS 是有意义的终止监督，但让最后一个正文 Token 直接预测无关文档开头会制造伪依赖。常见做法插入 EOS，并决定新文档首 Token 是否以 EOS 为条件，或用 Block Mask 完全隔开文档。选择必须与推理用途一致，并明确 Position ID 是否重置，不能只在 Loss 上随意忽略一个位置。

## 常见追问

1. **只插 EOS 就能阻止跨文档 Attention 吗？** 不能，后一个文档仍能关注 EOS 之前内容，除非额外使用样本边界 Mask。
2. **完全隔离会损失什么？** 无法利用同一真实长文跨 Chunk 的依赖，所以必须正确识别文档而非机械按长度隔开。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

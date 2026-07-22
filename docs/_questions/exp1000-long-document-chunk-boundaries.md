---
title: '长文档切成训练 Chunk 时，怎样减少边界处的语义损失？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '长文档'
  - 'Chunk'
  - '预训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较固定长度、自然段边界、重叠与跨 Chunk 记忆的成本。

**可以这样答：**

> 固定 Token 长度最易打包，却可能在句子、代码函数或公式中间截断。可以优先选择段落和章节边界，在长度不足时再回退到硬切，并保留文档 ID 与位置。重叠能让边界内容得到完整上下文，但会重复计算和改变样本权重；支持跨 Chunk 记忆则需要专门模型与训练管线。

## 常见追问

1. **每个 Chunk 都加 EOS 合理吗？** 若只是长度截断而非真实文档结束，会错误训练模型在任意边界终止。
2. **重叠区域的 Loss 要重复算吗？** 可屏蔽重复前缀 Loss，只把它作为上下文，避免同一 Token 被过度加权。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

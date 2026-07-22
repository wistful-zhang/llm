---
title: '给已训练模型新增 Token 时，Embedding 和 LM Head 应该怎样处理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
tags:
  - 'Vocabulary Extension'
  - 'Embedding'
  - '继续训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明扩展矩阵、初始化新行、权重绑定和继续训练四步。

**可以这样答：**

> Tokenizer 增加 Token 后，模型输入 Embedding 必须扩展对应行，输出 LM Head 也要扩展；若二者绑定则保持同一权重。新行可用相关子词向量均值或匹配方差的随机值初始化，但初始并没有可靠语义。需要用包含新 Token 的数据继续训练，并确保旧 Token ID 完全不变，否则原权重整体错位。

## 常见追问

1. **只新增控制 Token 也要训练吗？** 至少要让模型见到其模板位置和期望行为，否则它只是随机向量。
2. **为什么不能把新 Token 插到词表中间？** 会改变后续所有 ID 与原 Embedding 行的对应关系，除非同步重排全部权重和配置。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)

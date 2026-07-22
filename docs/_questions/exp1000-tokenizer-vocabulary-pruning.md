---
title: '如何给 Tokenizer 做 Vocabulary Pruning，又不让原模型权重失效？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '工程实践'
difficulty: '困难'
tags:
  - 'Vocabulary Pruning'
  - '模型压缩'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分仅删除从不使用的行与改变切分规则，强调 ID 重映射和继续训练。

**可以这样答：**

> 可以先统计目标流量中长期不用的 Token，删除对应 Embedding 和 LM Head 行，并建立旧 ID 到新 ID 的明确映射。若被删 Token 仍可能由原 Merge 产生，就必须同时调整 Tokenizer，让文本回退到保留子词。切分分布改变后模型需要继续训练或蒸馏，且所有缓存、适配器和输出约束都要迁移到新词表。

## 常见追问

1. **只删除词表末尾最安全吗？** ID 重排较少，但末尾不等于不使用，仍需基于数据和特殊 Token 检查。
2. **LoRA 能直接复用吗？** 非词表层通常可复用，若 LoRA 覆盖 Embedding 或 LM Head 就要同步重排。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

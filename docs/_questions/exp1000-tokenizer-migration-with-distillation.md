---
title: '更换 Tokenizer 后，怎样用蒸馏减少重新训练成本？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '困难'
tags:
  - 'Tokenizer Migration'
  - '蒸馏'
  - '继续训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明新旧 Token 序列长度不同，需在字符或文本位置对齐而非直接逐 Token 对齐。

**可以这样答：**

> 新模型先扩展或重建词表相关权重，再用同一原始文本分别经过新旧 Tokenizer。由于 Token 边界不同，不能直接让第 t 个新 Token 匹配第 t 个旧 Token，可在共享字符边界上对齐隐藏表示，或让教师提供文本级软目标和生成分布。蒸馏仍需大量继续训练，且要同时保护旧能力与验证新 Token 的学习充分性。

## 常见追问

1. **能直接复制共有 Token 的 Embedding 吗？** 字符串和语义确实相同且 ID 映射明确时可以，其他新 Token 需初始化。
2. **为什么 LM Head 蒸馏也难对齐？** 新旧词表类别空间不同，需转成字符概率、候选文本概率或借助映射聚合。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)

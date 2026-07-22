---
title: 'Decoder-Only 模型训练和批量生成时，Left Padding 与 Right Padding 怎么选？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Padding'
  - 'Batch Generation'
  - 'Position ID'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明训练可右填充，生成常左填充以让最后一列都是有效末 Token。

**可以这样答：**

> 训练整段并行计算时右填充直观，只要 Mask 和 Position ID 正确即可。批量自回归生成常用左填充，让不同长度 Prompt 的最后一个有效 Token 对齐到同一列，便于从末列 Logit 开始解码。若模型用绝对位置或 Position ID 未按有效 Token 重算，改变填充侧会造成位置偏移和输出差异。

## 常见追问

1. **RoPE 模型就不用管 Position ID 吗？** 仍要管，左侧 PAD 不应让真实 Token 的位置编号无意整体平移，除非训练时见过这种约定。
2. **右填充也能批量生成吗？** 可以，但要为每条样本准确索引最后有效位置并管理不规则 KV Cache。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

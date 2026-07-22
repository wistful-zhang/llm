---
title: '没有独立 PAD Token 时，为什么常借用 EOS，又有什么风险？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'PAD'
  - 'EOS'
  - 'Attention Mask'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明只要 Mask 和 Loss Mask 正确就可复用 ID，但边界语义和生成判断要分开。

**可以这样答：**

> Decoder-Only 模型原本按变长序列训练，可能没有专用 PAD；批处理时可用 EOS ID 填充，再用 Attention Mask 和 Loss Mask 排除填充位置。这样无需扩词表，但任何遗漏 Mask 的代码都会把 Padding 当真实结束信号学习。生成停止逻辑也应依据新生成的 EOS，而不是把输入 Padding 中已有 EOS 误判为完成。

## 常见追问

1. **PAD Embedding 需要置零吗？** 不是必要条件，只要被正确屏蔽；置零也不能替代 Attention 和 Loss Mask。
2. **为什么 Label 的 PAD 常设为 -100？** 许多交叉熵实现用 ignore_index=-100 跳过这些位置的损失。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

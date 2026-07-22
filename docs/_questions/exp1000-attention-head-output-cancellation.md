---
title: '不同 Attention Head 的输出会不会在 W_O 中互相抵消？这意味着什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Attention Head'
  - 'W_O'
  - '可解释性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 W_O 允许正负组合，因此单看 Head 注意力图会遗漏协同与抵消。

**可以这样答：**

> W_O 对拼接后的 Head 输出做任意线性组合，不同 Head 在某些输出方向上可以增强，也可以相互抵消。一个 Head 即使注意力图很尖锐，若其 Value 输出被 W_O 压低或抵消，对最终预测也可能影响很小。分析 Head 重要性应结合 Value、W_O 和因果消融，而不能只根据注意力权重判断。

## 常见追问

1. **怎样量化某 Head 的直接贡献？** 可把该 Head 经 W_O 的写入向量投影到目标 Logit 方向，并用消融验证。
2. **抵消一定是冗余吗？** 不一定，它可能实现有意义的正负校正或在不同上下文下动态平衡。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

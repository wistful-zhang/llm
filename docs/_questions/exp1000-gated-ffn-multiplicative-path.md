---
title: '门控 FFN 中两条上投影分支为什么要逐元素相乘？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Gated FFN'
  - 'GLU'
  - '模型结构'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把一条分支解释成内容、一条解释成数据依赖的门，而不是只背公式。

**可以这样答：**

> 门控 FFN 通常让一条投影产生候选内容，另一条投影经过激活后产生逐维门值，两者相乘再下投影。这样每个 Token 能按输入动态选择哪些中间特征通过，比单一激活后的固定通道更灵活。乘法交互也提高表达能力，但增加一组矩阵，所以隐藏宽度常相应缩小。

## 常见追问

1. **门值一定在 0 到 1 吗？** 不一定，SwiGLU 和 GeGLU 的激活输出并非严格概率门。
2. **为什么不用相加？** 相加只是叠加两组特征，逐元素乘法才能形成输入依赖的调制。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

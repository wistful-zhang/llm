---
title: 'Cosine Decay 为什么常保留一个 Minimum Learning Rate，而不是降到零？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
tags:
  - 'Cosine Decay'
  - '学习率'
  - '调度'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明非零尾部便于持续学习和延长训练，但最终收敛与可续训需求不同。

**可以这样答：**

> 降到零意味着计划终点后参数几乎停止更新，不适合可能继续增加数据或延长训练的项目。保留 Minimum LR 能维持小幅学习，适应后期数据和避免调度对精确总步数过度敏感。下限过高会让验证 Loss 在尾部震荡、无法充分收敛，因此应结合剩余 Token 和梯度噪声选择。

## 常见追问

1. **训练结束前做额外 Cooldown 有何作用？** 进一步降低学习率，让参数在低噪声步长下稳定收敛，便于选最终检查点。
2. **改变总步数后 Cosine 曲线怎么办？** 需重算进度或采用可延展调度，否则恢复后学习率可能突然跳变。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)

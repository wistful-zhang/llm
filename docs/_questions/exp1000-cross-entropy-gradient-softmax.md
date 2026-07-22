---
title: 'Softmax 交叉熵对 logits 的梯度为什么是 p-y？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '数学基础'
difficulty: '中等'
tags:
  - '交叉熵'
  - '梯度'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答“Softmax 交叉熵梯度”时，先给出核心结论，再补一个能检查结论的例子，最后主动说明这条边界：标签平滑、软标签或类别权重会改变 y 或缩放方式。

**可以这样答：**

> 这件事可以概括为：把 log-softmax 与负对数似然联立求导，真实类别 one-hot 为 y 时梯度简化为预测概率 p 减 y。落到实验或实现上，对三分类 logits 手算概率和每一维梯度并检查梯度和为零。同时要确认，标签平滑、软标签或类别权重会改变 y 或缩放方式。

## 常见追问

1. **请把“Softmax 交叉熵梯度”的核心结论压缩成一句话。** 把 log-softmax 与负对数似然联立求导，真实类别 one-hot 为 y 时梯度简化为预测概率 p 减 y
2. **你会用什么例子或检查验证“Softmax 交叉熵梯度”？** 对三分类 logits 手算概率和每一维梯度并检查梯度和为零
3. **“Softmax 交叉熵梯度”最重要的适用边界是什么？** 标签平滑、软标签或类别权重会改变 y 或缩放方式

## 延伸阅读

- [Deep Learning Book](https://www.deeplearningbook.org/)

---
title: 'Softmax 温度怎样改变概率与梯度？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '数学基础'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'Softmax'
  - '温度'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“Softmax 温度”：核心判断要明确，验证要可复现，并说明温度不能改变 logit 排序，极端温度还可能带来数值或校准问题。

**可以这样答：**

> logit 除以温度后再归一化，低温放大差异使分布尖锐，高温压平分布并缩小局部梯度尺度。一个直接的检查办法是：对三个 logits 分别用温度零点五、一和二计算概率。这个结论的边界是，温度不能改变 logit 排序，极端温度还可能带来数值或校准问题。

## 常见追问

1. **“Softmax 温度”最需要讲清的核心内容是什么？** logit 除以温度后再归一化，低温放大差异使分布尖锐，高温压平分布并缩小局部梯度尺度
2. **哪项具体检查可以支撑你对“Softmax 温度”的判断？** 对三个 logits 分别用温度零点五、一和二计算概率
3. **“Softmax 温度”最容易被忽略的前提是什么？** 温度不能改变 logit 排序，极端温度还可能带来数值或校准问题

## 延伸阅读

- [Deep Learning Book](https://www.deeplearningbook.org/)

---
title: '为什么对需要梯度的 Leaf Tensor 做原地操作常会报错？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '困难'
study_tier: 'archive'
tags:
  - 'PyTorch'
  - 'Autograd'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“叶子 Tensor 原地修改”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：用 data 绕过检查很危险，参数更新应使用 no_grad 或标准优化器。

**可以这样答：**

> 反向计算依赖前向保存的值和版本计数，原地修改叶子可能破坏梯度语义，因此框架会阻止不安全操作。例如，对参数做加法、在 no_grad 中更新和使用优化器更新进行比较。需要注意的是，用 data 绕过检查很危险，参数更新应使用 no_grad 或标准优化器。

## 常见追问

1. **请用自己的话说明“叶子 Tensor 原地修改”的核心做法。** 反向计算依赖前向保存的值和版本计数，原地修改叶子可能破坏梯度语义，因此框架会阻止不安全操作
2. **你准备怎样举例证明自己理解“叶子 Tensor 原地修改”？** 对参数做加法、在 no_grad 中更新和使用优化器更新进行比较
3. **使用“叶子 Tensor 原地修改”前还要确认什么？** 用 data 绕过检查很危险，参数更新应使用 no_grad 或标准优化器

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)

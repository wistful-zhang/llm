---
title: '怎样用 Einsum 的维度标记检查注意力张量 Shape？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'PyTorch'
  - 'Einsum'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“Einsum 维度推导”：核心判断要明确，验证要可复现，并说明Einsum 让语义清楚但不保证生成最快 Kernel；省略号、隐式输出和大中间张量仍可能隐藏错误或造成显存峰值。

**可以这样答：**

> 每个字母代表一个逻辑轴，相同字母要求维度一致，输入中存在但输出省略的轴会被求和；显式写输出顺序能直接审查广播、收缩和结果形状。要验证这一点，可以采用这个办法：用 bhqd,bhkd->bhqk 算注意力分数，再用 bhqk,bhkd->bhqd 聚合 Value，并逐轴标注尺寸。使用时不能忽略，Einsum 让语义清楚但不保证生成最快 Kernel；省略号、隐式输出和大中间张量仍可能隐藏错误或造成显存峰值。

## 常见追问

1. **“Einsum 维度推导”最需要讲清的核心内容是什么？** 每个字母代表一个逻辑轴，相同字母要求维度一致，输入中存在但输出省略的轴会被求和；显式写输出顺序能直接审查广播、收缩和结果形状
2. **哪项具体检查可以支撑你对“Einsum 维度推导”的判断？** 用 bhqd,bhkd->bhqk 算注意力分数，再用 bhqk,bhkd->bhqd 聚合 Value，并逐轴标注尺寸
3. **“Einsum 维度推导”最容易被忽略的前提是什么？** Einsum 让语义清楚但不保证生成最快 Kernel；省略号、隐式输出和大中间张量仍可能隐藏错误或造成显存峰值

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)

---
title: 'Bootstrap 为什么能估计统计量的不确定性？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '数学基础'
difficulty: '中等'
tags:
  - 'Bootstrap'
  - '统计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“Bootstrap 重采样”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：极小样本、强依赖序列或罕见尾部事件会让普通 bootstrap 失真。

**可以这样答：**

> 从经验分布有放回抽样，反复计算统计量，用其分布近似原统计量的抽样分布。要验证这一点，可以采用这个办法：对模型胜率或分位延迟进行成对 bootstrap 并计算区间。使用时不能忽略，极小样本、强依赖序列或罕见尾部事件会让普通 bootstrap 失真。

## 常见追问

1. **请用自己的话说明“Bootstrap 重采样”的核心做法。** 从经验分布有放回抽样，反复计算统计量，用其分布近似原统计量的抽样分布
2. **你准备怎样举例证明自己理解“Bootstrap 重采样”？** 对模型胜率或分位延迟进行成对 bootstrap 并计算区间
3. **使用“Bootstrap 重采样”前还要确认什么？** 极小样本、强依赖序列或罕见尾部事件会让普通 bootstrap 失真

## 延伸阅读

- [Deep Learning Book](https://www.deeplearningbook.org/)

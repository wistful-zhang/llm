---
title: '自定义 autograd.Function 怎样验证 backward 正确？'
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

先用自己的话说清“自定义反向函数”，再给出一项可检查的证据或例子；结尾别漏掉原地操作、高阶梯度和非连续输入需要显式声明或支持。

**可以这样答：**

> forward 保存 backward 必需的最小张量，backward 接收上游梯度并按链式法则返回每个输入梯度。具体例子是，用双精度 gradcheck 和有限差分测试随机及边界输入。真正落地前还要检查，原地操作、高阶梯度和非连续输入需要显式声明或支持。

## 常见追问

1. **如果只保留一个要点，“自定义反向函数”是什么？** forward 保存 backward 必需的最小张量，backward 接收上游梯度并按链式法则返回每个输入梯度
2. **给出一个可以复现或手工检查“自定义反向函数”的办法。** 用双精度 gradcheck 和有限差分测试随机及边界输入
3. **在哪种条件下，“自定义反向函数”会失效或被误读？** 原地操作、高阶梯度和非连续输入需要显式声明或支持

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)

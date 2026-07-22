---
title: 'Iterator 与 Generator 的协议有什么区别？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '简单'
tags:
  - 'Python'
  - '生成器'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“Python 迭代协议”展开：把定义或机制讲清楚，用具体例子验证，并说明生成器通常只能消费一次，异常、关闭和 finally 清理也要处理。

**可以这样答：**

> Iterator 实现 iter 和 next 并在结束抛 StopIteration，Generator 用 yield 自动保存执行状态并实现该协议。一个直接的检查办法是：实现流式读取大文件的生成器并验证只保留当前批。这个结论的边界是，生成器通常只能消费一次，异常、关闭和 finally 清理也要处理。

## 常见追问

1. **不铺背景，直接说明“Python 迭代协议”的核心机制或判断。** Iterator 实现 iter 和 next 并在结束抛 StopIteration，Generator 用 yield 自动保存执行状态并实现该协议
2. **把“Python 迭代协议”落到一个可检查的例子，你会怎么做？** 实现流式读取大文件的生成器并验证只保留当前批
3. **什么情况下不能直接套用“Python 迭代协议”？** 生成器通常只能消费一次，异常、关闭和 finally 清理也要处理

## 延伸阅读

- [Python 3 官方文档](https://docs.python.org/3/)

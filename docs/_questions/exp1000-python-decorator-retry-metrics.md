---
title: '怎样写一个同时记录耗时但不破坏函数签名的 Decorator？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'Python'
  - 'Decorator'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“Python 装饰器”展开：把定义或机制讲清楚，用具体例子验证，并说明装饰器不能无条件重试非幂等函数，参数和返回值也不应写入敏感日志。

**可以这样答：**

> 闭包包装调用并用 functools.wraps 保留名称、文档和签名，在 finally 中记录耗时，异步函数需单独 await。要验证这一点，可以采用这个办法：分别装饰同步、异步和抛异常函数检查指标。使用时不能忽略，装饰器不能无条件重试非幂等函数，参数和返回值也不应写入敏感日志。

## 常见追问

1. **不铺背景，直接说明“Python 装饰器”的核心机制或判断。** 闭包包装调用并用 functools.wraps 保留名称、文档和签名，在 finally 中记录耗时，异步函数需单独 await
2. **把“Python 装饰器”落到一个可检查的例子，你会怎么做？** 分别装饰同步、异步和抛异常函数检查指标
3. **什么情况下不能直接套用“Python 装饰器”？** 装饰器不能无条件重试非幂等函数，参数和返回值也不应写入敏感日志

## 延伸阅读

- [Python 3 官方文档](https://docs.python.org/3/)

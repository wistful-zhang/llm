---
title: 'Python Protocol 怎样帮助替换不同模型客户端？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'Python'
  - 'Protocol'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“结构化类型与依赖注入”展开：把定义或机制讲清楚，用具体例子验证，并说明Protocol 主要是静态约束，运行时响应语义仍需契约测试。

**可以这样答：**

> Protocol 声明调用方需要的方法形状，实现类无需继承即可通过静态检查，便于注入真实客户端和 Fake。一个直接的检查办法是：定义 generate 与 stream 接口并替换两个供应商实现。这个结论的边界是，Protocol 主要是静态约束，运行时响应语义仍需契约测试。

## 常见追问

1. **不铺背景，直接说明“结构化类型与依赖注入”的核心机制或判断。** Protocol 声明调用方需要的方法形状，实现类无需继承即可通过静态检查，便于注入真实客户端和 Fake
2. **把“结构化类型与依赖注入”落到一个可检查的例子，你会怎么做？** 定义 generate 与 stream 接口并替换两个供应商实现
3. **什么情况下不能直接套用“结构化类型与依赖注入”？** Protocol 主要是静态约束，运行时响应语义仍需契约测试

## 延伸阅读

- [Python 3 官方文档](https://docs.python.org/3/)

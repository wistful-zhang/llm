---
title: '让模型生成 SQL 时怎样限制注入、越权和误删？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
study_tier: 'archive'
tags:
  - 'SQL'
  - '最小权限'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“模型生成 SQL 的安全执行”展开：把定义或机制讲清楚，用具体例子验证，并说明SQL 可解析不代表授权正确，数据行级权限必须由数据库或服务端强制。

**可以这样答：**

> 优先使用参数化模板或受限查询 DSL，只给只读最小权限，并在执行前解析 AST、限制表列、行数和成本。例如，对注释绕过、多语句、系统表和大扫描建立拒绝测试。需要注意的是，SQL 可解析不代表授权正确，数据行级权限必须由数据库或服务端强制。

## 常见追问

1. **不铺背景，直接说明“模型生成 SQL 的安全执行”的核心机制或判断。** 优先使用参数化模板或受限查询 DSL，只给只读最小权限，并在执行前解析 AST、限制表列、行数和成本
2. **把“模型生成 SQL 的安全执行”落到一个可检查的例子，你会怎么做？** 对注释绕过、多语句、系统表和大扫描建立拒绝测试
3. **什么情况下不能直接套用“模型生成 SQL 的安全执行”？** SQL 可解析不代表授权正确，数据行级权限必须由数据库或服务端强制

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

---
title: '模型输出 Markdown 在浏览器渲染前为什么必须 Sanitization？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '工程实践'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'Markdown'
  - 'XSS'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

这题不要只报术语。先解释“安全渲染模型输出”的核心逻辑，再说明如何验证，最后指出转义一次不保证安全，解析顺序和库升级都可能改变输出。

**可以这样答：**

> Markdown 解析后仍可能产生 HTML、危险链接或事件属性，应禁用原始 HTML、限制协议并使用成熟 Sanitizer。要验证这一点，可以采用这个办法：用脚本标签、javascript 链接、SVG 和嵌套编码做安全回归。使用时不能忽略，转义一次不保证安全，解析顺序和库升级都可能改变输出。

## 常见追问

1. **面试官要求一句话概括“安全渲染模型输出”时，你怎么说？** Markdown 解析后仍可能产生 HTML、危险链接或事件属性，应禁用原始 HTML、限制协议并使用成熟 Sanitizer
2. **你会怎样用数据、代码或手算验证“安全渲染模型输出”？** 用脚本标签、javascript 链接、SVG 和嵌套编码做安全回归
3. **回答“安全渲染模型输出”时必须主动补充哪项限制？** 转义一次不保证安全，解析顺序和库升级都可能改变输出

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

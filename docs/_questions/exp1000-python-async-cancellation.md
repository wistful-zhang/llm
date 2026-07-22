---
title: 'asyncio 任务取消为什么必须正确传播 CancelledError？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '困难'
study_tier: 'archive'
tags:
  - 'Python'
  - '取消'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“异步任务取消”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：屏蔽取消或捕获所有异常会造成幽灵任务和资源泄漏。

**可以这样答：**

> 这件事可以概括为：取消会在下一个 await 注入 CancelledError，协程应在 finally 清理资源后继续传播，父任务也要等待子任务结束。落到实验或实现上，取消正在流式读取的任务并检查连接、Semaphore 和文件句柄。同时要确认，屏蔽取消或捕获所有异常会造成幽灵任务和资源泄漏。

## 常见追问

1. **请用自己的话说明“异步任务取消”的核心做法。** 取消会在下一个 await 注入 CancelledError，协程应在 finally 清理资源后继续传播，父任务也要等待子任务结束
2. **你准备怎样举例证明自己理解“异步任务取消”？** 取消正在流式读取的任务并检查连接、Semaphore 和文件句柄
3. **使用“异步任务取消”前还要确认什么？** 屏蔽取消或捕获所有异常会造成幽灵任务和资源泄漏

## 延伸阅读

- [Python 3 官方文档](https://docs.python.org/3/)

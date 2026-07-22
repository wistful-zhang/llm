---
title: 'Python 的 GIL 下线程与进程池应该怎样选择？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'Python'
  - 'GIL'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先用自己的话说清“Python 并发执行选择”，再给出一项可检查的证据或例子；结尾别漏掉多进程会复制内存并引入 IPC，线程也仍需处理共享状态竞态。

**可以这样答：**

> I/O 等待多或底层扩展释放 GIL 时线程轻量，纯 Python CPU 密集任务通常用多进程或移到原生算子。要验证这一点，可以采用这个办法：分别压测网络请求、Tokenizer 和纯 Python 循环，记录吞吐与序列化成本。使用时不能忽略，多进程会复制内存并引入 IPC，线程也仍需处理共享状态竞态。

## 常见追问

1. **如果只保留一个要点，“Python 并发执行选择”是什么？** I/O 等待多或底层扩展释放 GIL 时线程轻量，纯 Python CPU 密集任务通常用多进程或移到原生算子
2. **给出一个可以复现或手工检查“Python 并发执行选择”的办法。** 分别压测网络请求、Tokenizer 和纯 Python 循环，记录吞吐与序列化成本
3. **在哪种条件下，“Python 并发执行选择”会失效或被误读？** 多进程会复制内存并引入 IPC，线程也仍需处理共享状态竞态

## 延伸阅读

- [Python 3 官方文档](https://docs.python.org/3/)

---
title: '怎样用 Context Manager 保证模型资源被释放？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '简单'
tags:
  - 'Python'
  - '资源管理'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答“上下文管理器”时，先给出核心结论，再补一个能检查结论的例子，最后主动说明这条边界：exit 返回真会吞掉异常，除非明确需要否则应让异常继续传播。

**可以这样答：**

> enter 获取资源，exit 无论正常或异常都执行清理；也可用 contextmanager 把 try-finally 封装成 with 接口。一个直接的检查办法是：封装临时文件、GPU 会话或数据库连接并主动抛异常测试。这个结论的边界是，exit 返回真会吞掉异常，除非明确需要否则应让异常继续传播。

## 常见追问

1. **请把“上下文管理器”的核心结论压缩成一句话。** enter 获取资源，exit 无论正常或异常都执行清理；也可用 contextmanager 把 try-finally 封装成 with 接口
2. **你会用什么例子或检查验证“上下文管理器”？** 封装临时文件、GPU 会话或数据库连接并主动抛异常测试
3. **“上下文管理器”最重要的适用边界是什么？** exit 返回真会吞掉异常，除非明确需要否则应让异常继续传播

## 延伸阅读

- [Python 3 官方文档](https://docs.python.org/3/)

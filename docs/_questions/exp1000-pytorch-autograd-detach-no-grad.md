---
title: 'detach、no_grad 与 requires_grad 分别控制什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'PyTorch'
  - 'Autograd'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先用自己的话说清“Autograd 图控制”，再给出一项可检查的证据或例子；结尾别漏掉detach 共享数据，修改可能影响原 Tensor；推理模式与 no_grad 也并非完全相同。

**可以这样答：**

> requires_grad 决定叶子是否跟踪梯度，no_grad 在上下文中不记录操作，detach 返回与原 Tensor 共享存储但脱离当前图的视图。具体例子是，构造两层计算检查 grad_fn、反向结果和原地修改影响。真正落地前还要检查，detach 共享数据，修改可能影响原 Tensor；推理模式与 no_grad 也并非完全相同。

## 常见追问

1. **如果只保留一个要点，“Autograd 图控制”是什么？** requires_grad 决定叶子是否跟踪梯度，no_grad 在上下文中不记录操作，detach 返回与原 Tensor 共享存储但脱离当前图的视图
2. **给出一个可以复现或手工检查“Autograd 图控制”的办法。** 构造两层计算检查 grad_fn、反向结果和原地修改影响
3. **在哪种条件下，“Autograd 图控制”会失效或被误读？** detach 共享数据，修改可能影响原 Tensor；推理模式与 no_grad 也并非完全相同

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)

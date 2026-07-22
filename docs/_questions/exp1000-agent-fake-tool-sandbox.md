---
title: '上线前怎样用假工具和 Sandbox 测试 Agent，不让它碰真实数据？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Sandbox'
  - '假工具'
  - '安全测试'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明接口契约一致、数据隔离、网络封锁和可重复故障注入。

**可以这样答：**

> 假工具应复用生产 schema 和主要错误语义，但连接完全隔离的测试数据与身份。Sandbox 默认禁网、限制文件和计算资源，只开放测试所需能力。测试用例可控制工具响应、延迟和故障，确保同一轨迹能重复比较。发布前再在预生产环境做契约测试，防止假实现与真实接口逐渐漂移。

## 常见追问

1. **把生产工具设成 dry-run 可以吗？** 可作为补充，但必须确认 dry-run 没有隐藏副作用，也不能访问不该看的生产数据。
2. **如何发现 schema 漂移？** 从生产接口自动生成契约并在 CI 对假工具执行兼容测试。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)

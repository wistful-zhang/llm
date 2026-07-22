---
title: '为什么推荐保存 state_dict 而不是直接 Pickle 整个 Module？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '简单'
tags:
  - 'PyTorch'
  - 'Checkpoint'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“PyTorch 模型保存”展开：把定义或机制讲清楚，用具体例子验证，并说明模型结构和配置仍需单独版本化，不可信权重文件也不能随意反序列化。

**可以这样答：**

> state_dict 是参数与缓冲区的映射，代码与权重解耦，更容易检查、迁移和控制加载。一个直接的检查办法是：保存后在新实例 strict 加载，并测试缺键、多键和设备映射。这个结论的边界是，模型结构和配置仍需单独版本化，不可信权重文件也不能随意反序列化。

## 常见追问

1. **不铺背景，直接说明“PyTorch 模型保存”的核心机制或判断。** state_dict 是参数与缓冲区的映射，代码与权重解耦，更容易检查、迁移和控制加载
2. **把“PyTorch 模型保存”落到一个可检查的例子，你会怎么做？** 保存后在新实例 strict 加载，并测试缺键、多键和设备映射
3. **什么情况下不能直接套用“PyTorch 模型保存”？** 模型结构和配置仍需单独版本化，不可信权重文件也不能随意反序列化

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)

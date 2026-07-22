---
title: 'BOS Token 的作用是什么，为什么有的模型不需要显式 BOS？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'BOS'
  - 'Special Token'
  - '生成'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明它提供序列起点和首 Token 的条件，但模板或固定前缀可承担同样作用。

**可以这样答：**

> BOS 为模型提供统一序列起点，使第一个正文 Token 也有可学习的条件位置。它还能承载任务、语言或 Attention Sink 等训练形成的功能。若训练数据总有其他固定起始标记，或框架直接以空上下文定义首步分布，模型可以不使用独立 BOS，但训练和推理约定必须一致。

## 常见追问

1. **重复添加两个 BOS 会怎样？** 输入分布与训练模板不同，可能影响首段理解并浪费上下文。
2. **BOS 一定参与 Loss 吗？** 通常作为输入条件，不要求预测它；是否监督取决于标签构造。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

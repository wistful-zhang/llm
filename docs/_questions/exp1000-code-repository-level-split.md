---
title: '代码数据为什么应该按 Repository 切分，而不是随机按文件切分？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '代码数据'
  - '数据切分'
  - '泄漏'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明同仓库文件共享 API、模板、测试和重复实现，随机文件切分会泄漏。

**可以这样答：**

> 同一仓库中的源码、测试、文档和生成文件高度相关，测试文件甚至直接包含目标函数的使用与答案。随机按文件切分会让模型在训练集见到几乎相同的实现，再在验证集上获得虚高成绩。应按仓库或 Fork 簇切分，并进一步识别复制库、Vendored 依赖和跨仓库镜像。

## 常见追问

1. **Monorepo 怎么处理？** 可按独立项目边界细分，但必须避免共享代码和生成产物跨集合。
2. **同作者仓库需要放一起吗？** 不一定，但模板化项目和 Fork 关系应聚类，作者只是辅助信号。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

---
title: '用 Quality Classifier 过滤网页时，会怎样把标注偏好放大到预训练语料？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
tags:
  - 'Quality Classifier'
  - '选择偏差'
  - '网页数据'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从正负样本定义、风格代理特征、来源切片和分布反馈四层解释。

**可以这样答：**

> 分类器学习的是标注集里的“高质量”定义，可能把正式文风、长文本或特定站点当成质量代理。按高阈值过滤海量网页会系统性删除口语、方言、短答案和小众知识，把小偏差放大成训练分布缺口。应分析特征与来源切片、保留探索样本，并通过下游消融验证，而不是只看分类器 AUC。

## 常见追问

1. **为什么 AUC 高仍可能有问题？** 测试集若复制同一标注偏好，AUC 只证明拟合一致，不证明目标定义公平完整。
2. **软加权比硬过滤好吗？** 常更平滑并保留多样性，但低质量数据仍消耗算力，权重也需校准。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

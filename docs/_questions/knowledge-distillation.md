---
title: "知识蒸馏如何用 Teacher 训练 Student，温度参数有什么作用？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "NLP 与机器学习"
difficulty: "中等"
tags:
  - 知识蒸馏
  - Teacher Student
  - 模型压缩
published: true
verified: true
date: 2026-07-14
---

## 核心回答

知识蒸馏让较小 Student 同时学习真实标签和 Teacher 的软分布。温度 `T>1` 会把 logits 分布变平，暴露非目标类别之间的相对关系；经典损失将硬标签交叉熵与 Teacher、Student 在温度下分布的 KL/交叉熵加权，并常乘 `T²` 补偿梯度尺度。蒸馏迁移的是 Teacher 在给定数据上的行为，不保证复制其全部能力。

## 展开说明

除了输出 logits，可蒸馏中间表示、Attention、关系结构或生成序列。自回归模型有“Teacher 生成答案再做 SFT”的序列级蒸馏，也可对每个 Token 的完整分布做在线或离线蒸馏。Student 容量、蒸馏数据覆盖和分词器兼容性决定上限；Teacher 的偏差、幻觉和安全问题也可能一并迁移。

## 工程实践

先明确目标是降延迟、显存还是授权成本，再比较同尺寸直接训练基线。离线保存 top-k logits 可降低存储，但会丢失尾部分布；Teacher 与 Student 词表不同则需用文本序列或表示对齐。验收要覆盖任务质量、校准、安全、长尾样本以及真实硬件上的吞吐与延迟。

## 常见追问

1. **为什么软标签比 one-hot 提供更多信息？** 它展示 Teacher 对其他类别的相似度判断，例如“猫”比“汽车”更接近“狗”。
2. **为什么经典蒸馏损失常乘 `T²`？** 温度增大会缩小关于 logits 的梯度，乘 `T²` 用于大致保持软目标项的梯度量级。
3. **Student 能超过 Teacher 吗？** 在特定评测上可能因正则化、数据或架构优势超过，但不能据此认为其整体知识已超过 Teacher。

## 一句话复习

> 蒸馏用温度软化的 Teacher 分布传递类别关系，再与真实标签联合训练；效果上限由 Student 容量和数据覆盖决定。

## 参考资料

- 面试主题：[LLMs Interview Questions](https://github.com/Devinterview-io/llms-interview-questions)
- 技术依据：[Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531)

---
title: '什么情况下 PTQ 不够，需要做 QAT？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'QAT'
  - 'PTQ'
  - '低比特'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

以目标位宽、敏感任务和 PTQ 质量缺口为触发条件，并说明训练成本。

**可以这样答：**

> 当目标位宽很低、激活难量化，或 PTQ 在关键任务上出现不可接受退化时，可以考虑 QAT。QAT 在训练前向中模拟量化误差，让权重适应离散化，但需要数据、计算和更谨慎的优化。先通过逐层敏感度、混合精度和更好校准确认没有便宜方案。QAT 产物还必须与部署 kernel 的真实舍入、范围和粒度一致，否则训练收益无法落地。

## 常见追问

1. **QAT 需要原始预训练数据吗？** 不一定需要全量，但要有足够代表性数据，数据过窄会造成能力退化。
2. **LoRA 能用于 QAT 吗？** 可以降低训练成本，但基础权重量化误差和合并部署方式仍需验证。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)

---
title: '合成预训练数据与真实数据混合时，比例应该怎样确定？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Synthetic Data'
  - 'Data Mix'
  - '质量验证'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按合成目标、验证精度、覆盖增量和重复轮数定比例，不给固定百分比。

**可以这样答：**

> 合成数据若用于补充推理过程、稀有任务或格式，可以在对应能力切片中逐步提高权重。比例不能只按生成数量决定，要考虑答案验证率、与真实数据的新增覆盖、教师偏差和重复 Epoch。实践应从小比例消融，保留真实数据锚点，并分别监控目标能力与通用语言、事实性是否退化。

## 常见追问

1. **自动验证通过就等于高质量吗？** 不等于，验证器可能只检查格式或与生成器共享盲点，需要独立规则和人工抽检。
2. **多个教师能降低偏差吗？** 能增加来源多样性，但若共享训练数据和评判标准，相关错误仍会保留。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

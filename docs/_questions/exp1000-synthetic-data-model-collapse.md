---
title: '反复用模型生成数据再训练，为什么可能出现 Model Collapse？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Synthetic Data'
  - 'Model Collapse'
  - '数据分布'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明生成分布会低估长尾并累积前代偏差，区分合成数据本身与失控替代真实数据。

**可以这样答：**

> 生成模型倾向输出高概率模式，罕见表达和长尾事实被低估；下一代再学习这些样本时，分布会进一步变窄。错误、风格偏好和拒答模式也会代际累积，最终看似流畅却缺少多样性和真实性。合成数据可以有价值，但应保留足量真实数据、追踪生成谱系，并用独立来源评测长尾。

## 常见追问

1. **提高 Temperature 能避免 Collapse 吗？** 只能增加表面多样性，也会增加错误，无法恢复模型不知道的真实长尾。
2. **为什么蒸馏不一定 Collapse？** 受控蒸馏有明确教师和真实输入分布，风险可评估；无限代际替代更容易累积偏差。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

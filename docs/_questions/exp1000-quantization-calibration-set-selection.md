---
title: 'PTQ 的 Calibration Set 应该怎样选，数量越多越好吗？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
tags:
  - 'PTQ'
  - 'Calibration'
  - '数据'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调代表激活分布、覆盖长度与领域，不追求盲目扩大数量。

**可以这样答：**

> 校准集要覆盖真实输入的语言、领域、序列长度、格式和多模态组合，使观测到的激活范围具有代表性。少量高覆盖样本往往比大量重复短文本更有效。数据不能包含评测答案或敏感原文，预处理必须与生产完全一致。逐步增加样本并观察 scale 和质量是否稳定，边际收益消失后继续扩量没有必要。

## 常见追问

1. **只用随机网页文本可以吗？** 通用聊天模型可作基线，领域或代码服务仍需加入真实分布样本。
2. **长上下文必须进校准集吗？** 若生产会使用就应覆盖，因为激活与位置、内容和批处理形态可能变化。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)

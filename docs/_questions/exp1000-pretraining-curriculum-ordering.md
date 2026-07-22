---
title: '预训练做 Curriculum Learning 时，数据顺序为什么可能既有帮助又有遗忘风险？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Curriculum Learning'
  - '数据顺序'
  - '遗忘'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明先易后难可稳定优化，但后期分布切换会覆盖早期能力。

**可以这样答：**

> 先用短、干净和基础数据可让优化快速进入稳定区域，再逐步加入长文、代码或高难内容。若阶段边界过硬，后期梯度只来自新分布，模型会偏离早期语言和知识能力。更稳妥的是平滑改变采样权重、保留 Replay，并用分域验证集监控，而不是把语料一次性分阶段耗尽。

## 常见追问

1. **随机打乱不是最稳妥吗？** 它是强基线，但无法利用长度课程或质量先验，也可能让早期训练噪声过大。
2. **课程顺序会影响最终同样 Token 的结果吗？** 会，非凸优化具有路径依赖，相同数据和次数不保证相同参数。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

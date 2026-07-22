---
title: '开放网页预训练中，怎样发现低比例 Data Poisoning？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Data Poisoning'
  - '异常检测'
  - '安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明低比例攻击不会显著改变总体统计，要结合来源、重复、触发模式和行为测试。

**可以这样答：**

> 攻击者可在少量页面重复特定触发词与目标行为，总体质量指标仍看似正常。管线应监控域名和时间突增、近重复簇、异常 Token 共现与来源信誉，并隔离可疑簇。训练后还要用候选触发模式做行为测试，因为仅靠数据侧规则难以证明没有隐蔽后门。

## 常见追问

1. **去重会消除投毒吗？** 能削弱大量复制，但语义改写、跨域分散和单样本高影响攻击仍可能存在。
2. **为什么不能公开所有检测规则？** 过度公开会帮助攻击者定向绕过，但治理标准和审计结果仍应透明到合适程度。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)

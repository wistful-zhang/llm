---
title: '预训练中插入 Canary 怎样测量记忆，又应避免什么风险？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Canary'
  - '记忆'
  - '隐私评估'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明使用随机、无真实意义且受控的唯一串，并比较暴露度而非直接放真实秘密。

**可以这样答：**

> Canary 是人为插入的唯一随机序列，可用不同重复次数训练，再测模型对其完成概率或 Exposure。它帮助估计重复度与记忆风险的关系，但绝不能使用真实个人信息、密钥或可被误用的内容。Canary 资产和评测提示也要受控，避免公开后进入其他数据集并污染结论。

## 常见追问

1. **Canary 被生成一次就说明会泄露吗？** 要与随机基线、搜索空间和攻击预算比较，单次采样不足以定量。
2. **为什么设置多个重复次数？** 可以拟合训练频次与 Exposure 的关系，找到风险开始显著上升的区域。

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

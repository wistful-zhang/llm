---
title: 'Membership Inference Attack 如何判断样本是否参与训练？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
tags:
  - '隐私攻击'
  - 'Membership Inference'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“成员推断攻击”展开：把定义或机制讲清楚，用具体例子验证，并说明分布不匹配会制造虚假攻击效果，黑盒结果也不能定位具体泄漏来源。

**可以这样答：**

> 攻击利用模型对训练样本与非训练样本在损失、置信或输出稳定性上的差异推断成员身份。一个直接的检查办法是：用严格同分布成员与非成员构造攻击集并报告优势。这个结论的边界是，分布不匹配会制造虚假攻击效果，黑盒结果也不能定位具体泄漏来源。

## 常见追问

1. **不铺背景，直接说明“成员推断攻击”的核心机制或判断。** 攻击利用模型对训练样本与非训练样本在损失、置信或输出稳定性上的差异推断成员身份
2. **把“成员推断攻击”落到一个可检查的例子，你会怎么做？** 用严格同分布成员与非成员构造攻击集并报告优势
3. **什么情况下不能直接套用“成员推断攻击”？** 分布不匹配会制造虚假攻击效果，黑盒结果也不能定位具体泄漏来源

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

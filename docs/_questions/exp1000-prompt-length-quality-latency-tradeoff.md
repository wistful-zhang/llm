---
title: 'Prompt 越长信息越全，为什么质量和延迟反而可能变差？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - 'Prompt 长度'
  - '延迟'
  - '信号噪声'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从预填充成本、注意力干扰和矛盾概率三方面回答，并提出基于评测裁剪。

**可以这样答：**

> 更长的输入会增加预填充计算、首 Token 延迟和调用成本。低相关或重复信息还会稀释关键约束，增加证据冲突和位置偏差。优化时应按任务指标逐段消融，删除没有边际收益的说明与示例，并把可确定执行的规则移到代码。目标不是最短 Prompt，而是在质量、延迟和可维护性之间找到稳定点。

## 常见追问

1. **如何知道哪一段没有价值？** 对模块化 Prompt 做消融测试，比较整体和各失败类型指标，并观察不同模型上的稳定性。
2. **压缩后质量不降就可以直接上线吗？** 还需检查长尾和安全样本，并通过灰度确认线上延迟和成本收益。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

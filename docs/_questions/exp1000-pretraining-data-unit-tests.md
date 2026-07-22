---
title: '预训练数据管线应该写哪些 Unit Test，而不是只看几条样本？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - '数据测试'
  - '预训练管线'
  - '质量保障'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

覆盖确定性、边界、坏数据、隐私、分片和统计守恒。

**可以这样答：**

> 应固定黄金输入验证 Normalization、去重、文档边界、Tokenization 和 Loss Mask 的精确输出。还要测试空文档、超长文本、损坏编码、Special Token 碰撞、PII 与多语言边界。分布式部分需验证同 Seed 可复现、不同 Rank 不重叠、恢复不漏样本，并检查过滤前后文档数和 Token 数是否满足统计守恒。

## 常见追问

1. **为什么 Snapshot Test 不够？** 它能发现变化却不说明变化对错，关键规则还需语义断言和性质测试。
2. **数据统计漂移放在哪一层测？** 在集成与上线门禁中按来源、语言、长度和过滤原因比较基线分布。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

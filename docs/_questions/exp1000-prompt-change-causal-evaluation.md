---
title: '一次改了多处 Prompt 后效果变好，怎么判断究竟是哪一处起作用？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - 'Prompt 评测'
  - '消融实验'
  - '因果'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议单变量改动、固定样本参数和消融实验，并提醒模型输出有随机性。

**可以这样答：**

> 应先保留旧版本作为基线，把候选改动拆成可独立启用的部分，逐项做消融或小型因子实验。测试时固定模型版本、采样参数、工具和数据集，并对随机生成做多次运行。除了总分，还要按失败类型观察哪类样本改善或退化。若改动存在强交互，再测试必要组合，避免把偶然波动归因于某一句话。

## 常见追问

1. **样本少时怎么减少误判？** 优先使用成对比较和失败案例复核，报告置信区间，不把微小差异当成结论。
2. **线上 A/B 可以替代离线消融吗？** 不能完全替代，线上能看业务效果但成本高且难定位原因，两者应衔接使用。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

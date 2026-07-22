---
title: '训练出现单次 Loss Spike 时，应该继续、跳步还是回滚？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'Loss Spike'
  - '恢复策略'
  - '训练稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按数据异常、非有限梯度、参数已污染和可重复性分级决策。

**可以这样答：**

> 先判断 Loss 是否有限、梯度和参数是否出现 Inf，以及 Spike 是否对应异常 Batch。若只是一批难样本且更新经过正常裁剪，继续训练可能自行恢复；非有限梯度应跳过更新并调整 Scale。参数或优化器状态已经污染、后续 Loss 持续异常时，应回滚到最近健康 Checkpoint，并隔离数据和保存诊断快照。

## 常见追问

1. **看到 Spike 就降低学习率好吗？** 不一定，数据异常不会因全局降 LR 根治，还可能浪费余下训练。
2. **回滚后如何避免再次遇到同一 Batch？** 记录全局样本 ID 和数据状态，复现检查后修复或显式隔离该记录。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

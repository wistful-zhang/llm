---
title: 'Agent 长任务使用分布式锁时，为什么需要 Lease 和 Fencing Token？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '分布式锁'
  - 'Lease'
  - 'Fencing Token'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Worker 暂停后锁过期却继续写入的风险，以及单调令牌如何拒绝旧持有者。

**可以这样答：**

> Lease 防止 Worker 崩溃后永久占锁，但旧 Worker 可能长时间暂停，醒来时已经失去锁却仍继续写。每次获取锁生成单调递增的 Fencing Token，下游只接受不小于已见最大值的操作。Worker 还要续租并在失败后停止，但不能仅相信本地计时。能用乐观并发和幂等解决的场景通常比长时间持锁更简单。

## 常见追问

1. **Redis SETNX 加过期时间够吗？** 能提供基础互斥，但若下游不校验 fencing，暂停的旧持有者仍可能产生陈旧写。
2. **锁应该覆盖模型推理时间吗？** 尽量不要，推理耗时不确定，可在提交状态时短暂加锁或使用版本检查。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)

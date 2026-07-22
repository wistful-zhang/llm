---
title: '工具启动一个几分钟的异步任务后，Agent 应该怎样等待和恢复？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '困难'
tags:
  - '异步任务'
  - '轮询'
  - '恢复'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明返回 job_id、状态机、回调或退避轮询，并持久化等待状态。

**可以这样答：**

> 启动工具应立即返回稳定 job_id、状态和预计时间，而不是占住一次模型调用。编排器持久化当前任务、用户和后续步骤，通过回调或带退避的轮询获取结果。状态至少区分 queued、running、succeeded、failed、cancelled，并让取消成为幂等操作。进程重启后从持久化状态恢复，完成事件重复到达也只推进一次。

## 常见追问

1. **Agent 需要一直占着会话吗？** 不需要，可向用户返回任务已提交，完成后通过产品支持的通知或下次会话继续。
2. **轮询间隔怎么定？** 依据预计时长和服务建议使用指数退避，并设置最大间隔与总截止时间。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)

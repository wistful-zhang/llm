---
title: '一次 LLM 请求串联检索、重排、模型和工具时，超时预算怎样分配？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
tags:
  - '超时预算'
  - 'Deadline'
  - '依赖'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从端到端 SLO 倒推各阶段预算，传播剩余 deadline 并为降级预留时间。

**可以这样答：**

> 入口根据产品 SLO 生成绝对 deadline，各服务读取剩余时间而不是重新获得完整超时。为排队、检索、重排、首 Token 和网络保留预算，并给降级路径留下响应时间。并行依赖使用同一截止时间，重试只能消费剩余额度且必须判断幂等。接近 deadline 时停止低价值工作，返回部分证据或明确超时，不能让后台继续无效消耗。

## 常见追问

1. **各服务固定 2 秒可以吗？** 串联后可能超过端到端 SLO，也无法利用前一步提前完成的余量，传播 deadline 更合理。
2. **模型首 Token 超时后还继续吗？** 依据产品可选择异步完成，否则应取消推理并释放资源。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

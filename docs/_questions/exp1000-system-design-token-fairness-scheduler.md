---
title: '平台调度怎样按 Token 做租户公平，而不是按请求数量平均？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
tags:
  - '公平调度'
  - 'Token'
  - '租户'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明请求资源差异，采用加权 Token 配额、预留与实际结算。

**可以这样答：**

> 调度前估算输入 Prefill、最大 KV 和输出 Token，把它们转成可比较的资源成本。每个租户按权重获得时间窗口内 Token 额度，长请求分阶段消费，避免一次占完公平份额。执行前预留、完成后按实际结算，多余额度归还；估计持续偏差的租户受到保守系数约束。系统同时保证最小服务份额和单请求上限，防止大量小请求或单个巨型请求钻规则空子。

## 常见追问

1. **Prefill Token 和 Decode Token 价值一样吗？** 资源特征不同，可使用加权成本模型，而不是简单一比一计数。
2. **高付费租户如何优先？** 提高权重和保留容量，但仍受集群安全上限与其他租户最低份额约束。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

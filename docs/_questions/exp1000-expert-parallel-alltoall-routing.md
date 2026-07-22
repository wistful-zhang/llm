---
title: 'Expert Parallel 为什么依赖两次 All-to-All，性能瓶颈在哪里？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'Expert Parallel'
  - 'MoE'
  - 'All-to-All'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按 Token 发往 Expert 所在 Rank、专家计算、结果发回原 Rank的流程回答。

**可以这样答：**

> Router 在原 Rank 选出 Expert 后，需要把 Token 激活发送到对应 Expert 所在 Rank，这是第一次 All-to-All。专家完成 FFN 后，输出再按原 Token 顺序发回，形成第二次 All-to-All。瓶颈来自负载不均、小消息、跨节点带宽和同步尾部，必须结合容量、拓扑放置与通信计算重叠优化。

## 常见追问

1. **把热门 Expert 复制多份有用吗？** 可分散热点，但需要一致权重更新、路由副本选择和额外显存。
2. **Expert 放同节点能消除通信吗？** 只能减少跨节点流量，节点内 GPU 间仍需传输，而且容量受单节点限制。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)

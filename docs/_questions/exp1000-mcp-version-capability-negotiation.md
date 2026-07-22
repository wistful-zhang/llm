---
title: 'MCP Client 和 Server 版本不一致时，怎样做能力协商与兼容？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '困难'
tags:
  - 'MCP'
  - '版本协商'
  - '兼容性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明初始化阶段协商协议版本和 capabilities，未知字段应安全处理，破坏变更需失败明确。

**可以这样答：**

> 连接初始化时双方声明支持的协议版本和 capabilities，只启用共同支持的功能。新增可选字段应保持向后兼容，Client 不能因为看见未知字段就误执行；语义破坏变更则使用新版本并明确拒绝。工具 schema 本身也要版本化，调用方可在缓存失效后重新发现。兼容测试应覆盖旧 Client、新 Server 和相反组合，而不只测试最新版本。

## 常见追问

1. **协商失败可以静默降级吗？** 只有预定义且安全的降级才可以，否则应返回清晰错误，避免错误理解工具语义。
2. **工具名称改变算破坏变更吗？** 通常算，已有计划和权限可能引用旧名，应保留别名或发布新版本。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)

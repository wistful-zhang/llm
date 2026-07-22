---
title: 'MCP Server 使用 stdio 还是远程 HTTP 传输，应该怎样选择？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '中等'
tags:
  - 'MCP'
  - 'stdio'
  - 'HTTP'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较本地进程隔离与远程多用户服务的部署、认证和运维差异。

**可以这样答：**

> stdio 适合由 Host 启动的本地 Server，部署简单、默认不暴露网络，但生命周期和权限继承要控制。远程 HTTP 适合共享服务与独立扩缩容，却必须处理 TLS、认证、租户隔离、超时和流式连接。选择取决于数据位置和运维边界，不是协议功能越多越好。无论哪种传输，都要限制 Server 可访问的文件、网络与凭据。

## 常见追问

1. **stdio 就绝对安全吗？** 不是，本地进程仍可能读取用户文件或执行命令，需要沙箱和最小权限。
2. **远程 Server 能信任客户端传来的用户 ID 吗？** 不能，应从经过验证的认证令牌获取主体和租户。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)

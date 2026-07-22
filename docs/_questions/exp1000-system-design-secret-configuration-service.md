---
title: 'LLM 平台里的模型 Key、工具凭据和普通配置应该怎样分开管理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '中等'
tags:
  - 'Secret Manager'
  - '配置'
  - '凭据'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明秘密由专用服务加密、按工作负载短时下发，普通配置可审阅但不混放。

**可以这样答：**

> 普通配置需要可审阅和版本化，秘密则存入专用 Secret Manager，静态加密并限制读取主体。工作负载通过身份获取短期凭据或引用，模型上下文和前端永远不接触真实值。每个供应商、环境和工具使用独立权限，轮换不会要求改 Prompt 或重新构建镜像。日志、异常和配置导出统一做秘密扫描，发现泄露后立即撤销而非只删除文本。

## 常见追问

1. **Kubernetes Secret 够吗？** 可作交付机制，但还需 etcd 加密、RBAC、轮换和审计，默认 base64 不是加密。
2. **多个副本如何无中断轮换？** 短期允许新旧凭据重叠，先发布新版本验证，再撤销旧版本并监控失败。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

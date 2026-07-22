---
title: '请设计一个支持百万文档增量更新的知识库入库 Orchestrator。'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
tags:
  - '文档入库'
  - 'Orchestrator'
  - '增量更新'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按发现、下载、解析、切分、Embedding、索引和发布分阶段，说明幂等与回滚。

**可以这样答：**

> 源连接器产生带文档 ID 和版本的变更事件，工作流依次执行安全下载、解析、切分、向量化和多索引写入。每阶段输出有确定 ID、内容哈希和状态，可重试且不会重复创建；失败进入隔离队列。新版本在影子命名空间构建并校验数量、权限与样本检索后，再原子切换可见指针。删除使用 tombstone 贯穿所有派生存储，监控源到可检索的延迟和各阶段积压。

## 常见追问

1. **Embedding 服务限流怎么办？** 按批次退避并保存检查点，允许解析继续但控制中间积压的磁盘上限。
2. **解析器升级要全量重建吗？** 按内容类型和版本识别受影响文档，可分批双索引迁移而非一次停机。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

---
title: '文档入库流水线怎样做到重复执行不会产生重复 Chunk？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '幂等'
  - '入库'
  - '内容哈希'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答稳定标识、内容版本和原子替换，不要只说做去重。

**可以这样答：**

> 为源文档使用稳定 ID，并由文档 ID、版本和确定性 Chunk 序号生成子项 ID。相同内容哈希再次到达时可以跳过解析和向量化，内容变化则构建新版本后原子切换可见指针。写入使用 upsert 并记录阶段状态，重试从失败步骤继续而不是盲目追加。完成后校验期望 Chunk 数与索引实际数量，发现孤儿数据再清理。

## 常见追问

1. **用随机 UUID 做 Chunk ID 有什么问题？** 每次重跑都会生成新项，难以覆盖旧数据并造成重复召回。
2. **切分算法升级后哈希没变怎么办？** 把解析器和切分器版本纳入派生版本，触发受控重建。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)

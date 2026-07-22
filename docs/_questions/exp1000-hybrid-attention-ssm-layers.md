---
title: '混合 Attention 与 SSM 层时，层比例和放置位置应怎样考虑？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Hybrid Model'
  - 'SSM'
  - 'Attention'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把 SSM 的线性效率和 Attention 的内容寻址能力对应到不同层的职责。

**可以这样答：**

> 混合架构用多数 SSM 层承担高效序列建模，再周期性插入 Attention 层恢复精确的内容寻址和跨位置交互。Attention 太少可能损害检索与复制能力，太多又失去线性效率和小状态优势。层位置、局部窗口、训练长度与硬件内核共同决定最优比例，需要按任务做消融。

## 常见追问

1. **Attention 层应只放在高层吗？** 没有统一结论，均匀穿插常能定期重组信息，高层集中则更偏语义聚合。
2. **混合模型还需要 KV Cache 吗？** 只需为 Attention 层保存相应缓存，SSM 层保存固定大小状态。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

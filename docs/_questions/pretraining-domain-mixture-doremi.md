---
title: "DoReMi 如何自动优化预训练领域配比？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "预训练与数据"
difficulty: "困难"
tags:
  - DoReMi
  - 数据配比
  - Group DRO
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 DoReMi 用小代理模型学习领域权重，再迁移给大模型，不是手工拍比例。
2. **再讲关键机制**：解释相对参考模型的 Excess Loss，以及分布鲁棒优化如何提高落后领域的采样权重。
3. **主动说取舍**：指出代理到大模型的迁移不是理论保证，并要防止噪声域被高 Loss 误判为重要域。
4. **最后落到项目**：以各域验证 Loss、下游能力、最小覆盖权重和训练 Token 成本汇报，讲完停下来等追问。

**60 秒口述示例：**

> 我会先给结论：DoReMi 先用便宜的代理模型学习数据域配比，再把比例用于大模型训练。关键不是给原始 Loss 最大的域加权，而是看相对参考模型的 Excess Loss，让仍然“学得落后”的域获得更多采样。这里要主动补一句，噪声域也可能高 Loss，所以要设最小和最大权重并做迁移消融。落地时我会同时看各域验证 Loss、核心任务分数和每一点收益对应的 Token 成本。

## 核心回答

DoReMi 把预训练语料划分为若干 Domain，用一个较小的 Proxy Model 学习采样权重，再把得到的平均权重用于训练大模型。它不是简单偏向当前损失最高的 Domain，而是相对一个 Reference Model 计算各 Domain 的 excess loss，并采用 Group DRO 风格的更新：提高仍未学好的 Domain 权重，同时避免只因某个 Domain 天生熵高就长期过采样。

可将第 `i` 个 Domain 的信号概括为 `e_i(θ)=L_i(θ)-L_i(θ_ref)`。训练 Proxy 时交替降低加权模型损失，并以指数梯度方式更新 Domain 权重 `q_i`；最终对训练过程中的 `q` 做平均和归一化，得到目标混合。准确目标还包含论文定义的截断或平滑，不能把单步最高权重直接当最终比例。

## 展开说明

若只用原始 `L_i` 做最坏组优化，包含更多噪声或本身更难预测的 Domain 可能永远占据最高权重。Reference Model 提供同域基线，excess loss 更关注当前模型相对基线落后的部分。Exponentiated-gradient 更新可写成近似形式 `q_i ← q_i exp(η e_i)` 后投影到概率单纯形，并设置最小权重以保留覆盖。

DoReMi 的工程吸引力是先在便宜 Proxy 上优化配比，论文实验显示这些权重可迁移到更大模型。但迁移依赖 Domain 定义、Tokenizer、架构和数据质量足够一致；Proxy 太小看不出某类数据的后期收益，或 Target 出现新能力阶段时，最优比例可能改变。

## 工程实践

先保证 Domain 标签互斥规则、token 统计和基础质量可追踪，再训练 Reference 与多个随机种子的 Proxy。监控每域 loss、excess loss、权重轨迹和最小权重命中率，避免单一域因噪声尖峰垄断。正式大模型训练前，应把 DoReMi 配比与人工基线在相同 token 预算下做小规模对照，并保留可回退的采样配置。

## 常见追问

1. **为什么不直接给 loss 最大的 Domain 更多数据？** 原始 loss 混合了不可约熵和噪声；相对 Reference 的 excess loss 更接近“当前训练相对落后多少”。
2. **Proxy 学到的比例一定能迁移到大模型吗？** 不一定。论文给出经验支持，但 Domain、架构、规模阶段或数据质量改变后仍需消融验证。
3. **DoReMi 会不会把某些 Domain 权重降为零？** 实现通常使用平滑或最小权重保留覆盖；否则 Proxy 的早期误判可能让某域再也得不到学习机会。

## 一句话复习

> DoReMi 用 Proxy Model 对各 Domain 的相对 excess loss 做 Group DRO 重加权，再把平均采样比例迁移到大模型预训练。

## 参考资料

- [DoReMi: Optimizing Data Mixtures Speeds Up Language Model Pretraining](https://arxiv.org/abs/2305.10429)

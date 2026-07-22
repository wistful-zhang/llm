---
title: "DoReMi 如何自动优化预训练领域配比？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "预训练与数据"
difficulty: "困难"
study_tier: "role"
tags:
  - DoReMi
  - 数据配比
  - Group DRO
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

开头直接点出 DoReMi 的两步：用小代理模型学领域权重，再把这组权重用于大模型预训练。核心概念是相对参考模型的 Excess Loss，而不是“哪个域 Loss 高就多采样”。

接下来主动说清边界：代理模型上的最优配比未必能无损迁移，噪声域也可能因为难学而得到高权重。若被问落地，可答权重上下限、按域验证集和配比消融。

**可以这样答：**

> DoReMi 先训练参考模型，再用较小的代理模型根据各领域相对参考模型的 Excess Loss 动态调整采样权重，让仍然学得不足的领域获得更多数据，最后把稳定后的配比迁移到大模型。它比手工拍比例更系统，但高 Loss 也可能来自噪声，代理到大模型的迁移也非必然成立，因此要限制权重范围，并用分域指标和下游任务做消融。

## 核心回答

DoReMi 把预训练语料划分为若干 Domain，用一个较小的 Proxy Model 学习采样权重，再把得到的平均权重用于训练大模型。它不是简单偏向当前损失最高的 Domain，而是相对一个 Reference Model 计算各 Domain 的 excess loss，并采用 Group DRO 风格的更新：提高仍未学好的 Domain 权重，同时避免只因某个 Domain 天生熵高就长期过采样。

可将第 $$i$$ 个 Domain 的信号概括为 $$e_i(\theta) = L_i(\theta) - L_i(\theta_{\mathrm{ref}})$$。训练 Proxy 时交替降低加权模型损失，并以指数梯度方式更新 Domain 权重 $$q_i$$；最终对训练过程中的 $$q$$ 做平均和归一化，得到目标混合。准确目标还包含论文定义的截断或平滑，不能把单步最高权重直接当最终比例。

## 展开说明

若只用原始 $$L_i$$ 做最坏组优化，包含更多噪声或本身更难预测的 Domain 可能永远占据最高权重。Reference Model 提供同域基线，excess loss 更关注当前模型相对基线落后的部分。Exponentiated-gradient 更新可写成近似形式 $$q_i \leftarrow q_i \exp(\eta e_i)$$ 后投影到概率单纯形，并设置最小权重以保留覆盖。

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

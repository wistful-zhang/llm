---
title: "经典 RLHF 路线与标准离线 DPO 有什么区别？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
study_tier: "core"
tags:
  - RLHF
  - DPO
  - 偏好学习
published: true
answer_status: complete
date: 2026-07-13
---

## 面试时怎么答

用训练链路对比比背公式更容易讲清。经典 RLHF 先训练奖励模型，再让策略在线采样并用 PPO 优化，同时用参考模型约束偏移；DPO 则直接用偏好对，把策略相对参考模型的对数概率差写进分类损失。

选择部分要说到数据与控制能力：DPO 简洁稳定但受离线偏好覆盖限制，RLHF 更灵活却系统复杂、容易不稳定。不要把 DPO 说成完全没有超参数或不需要参考模型。

**可以这样答：**

> 经典 RLHF 先用偏好数据训练奖励模型，再让策略在线生成回答，用 PPO 最大化奖励并加 KL 约束；链路灵活，但要同时维护策略、价值、奖励和参考模型。标准 DPO 不单独训练奖励模型，而是直接让 chosen 相对 rejected 的概率优势高于参考模型，训练更像监督学习。DPO 工程简单稳定，RLHF 则更适合在线探索和复杂奖励，选择取决于数据覆盖与控制需求。

## 核心回答

经典 RLHF 通常在 SFT 之后，用偏好排序训练奖励模型，再用 PPO 等强化学习方法优化策略，并通过 KL 约束避免模型偏离参考模型太远。标准离线 DPO 直接在 chosen / rejected 偏好对上优化策略相对参考模型的概率差，不需要单独训练显式奖励模型，微调阶段也不需要在线 Rollout，因此流程更简单、通常更容易复现。

## 展开说明

两者的关键差异是：

- **训练组件**：RLHF 包含奖励模型和强化学习环节；DPO 主要包含策略模型、固定参考模型和偏好对。
- **数据分布**：离线 DPO 受已有偏好数据覆盖范围限制；在线 RLHF 可以用当前策略采样，但系统更复杂。
- **控制方式**：RLHF 通过奖励和 KL 惩罚控制；DPO 通过参考模型和 beta 调节相对参考策略的约束强度。
- **风险**：二者都会受到偏好噪声、长度偏差、分布漂移和代理目标失真的影响。

DPO 并不等于“一定优于 RLHF”。如果任务需要持续探索、在线反馈或复杂奖励组合，奖励模型路线仍可能更合适。

标准 DPO 的单个偏好对损失可概括为：

$$
\begin{aligned}
\mathcal{L}_{\mathrm{DPO}}
  &= -\log \sigma\!\left(\beta[\Delta_w-\Delta_l]\right), \\
\Delta_w
  &= \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\mathrm{ref}}(y_w \mid x)}, \\
\Delta_l
  &= \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\mathrm{ref}}(y_l \mid x)}
\end{aligned}
$$

其中 yw 是偏好回答，yl 是被拒回答。虽然标准离线 DPO 的优化阶段不做在线采样，但偏好数据本身仍可能来自模型生成，也存在在线 DPO 变体。

## 工程实践

训练前先检查偏好对是否真的只在目标维度上有差异，避免模型把长度、固定措辞或格式当成捷径。评估时同时看偏好胜率、KL 漂移、通用能力回归和安全边界，不只看训练损失。

## 常见追问

1. **DPO 中参考模型和 beta 分别起什么作用？** 参考模型提供策略偏离的基准，beta 控制相对偏好信号与保持参考行为的尺度；具体“强弱”还要结合实现公式解释。
2. **为什么偏好数据容易出现长度偏差？** 标注者或 Judge 常把更长、更完整的回答判优，序列 Log-prob 又随长度累加，数据与目标都可能把长度当捷径。
3. **什么场景更适合在线 RLHF？** 需要让当前策略持续探索新回答、环境可交互且有可靠在线奖励时更合适，但要承担 Rollout、稳定性和安全成本。

## 一句话复习

> 经典 RLHF 通常经历 SFT、奖励模型和强化学习，DPO 则直接从偏好对更新策略；简单不代表无风险。

## 参考资料

- 面经主题：[LLM 工程师公开面试复盘中的 DPO 题](https://huggingface.co/blog/herooooooooo/ai-engineer-job-offer)
- 技术依据：[InstructGPT / RLHF](https://arxiv.org/abs/2203.02155)、[Direct Preference Optimization](https://arxiv.org/abs/2305.18290)

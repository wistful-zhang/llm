---
title: "SimPO 如何在没有 Reference Model 时做偏好优化？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
study_tier: "role"
tags:
  - SimPO
  - Reference-free
  - 偏好优化
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

先说它省掉了什么：SimPO 不需要在训练时运行 Reference Model，而是直接比较 chosen 与 rejected 的长度归一化平均对数概率，并加入目标 Margin。这样既降低显存，也把偏好目标更贴近生成得分。

要主动提到“Reference-free 不等于无约束”。Margin、温度和长度归一化会影响行为，离线偏好覆盖不足时仍可能退化，需要通用能力与长度分布回归。

**可以这样答：**

> SimPO 直接提高 chosen 回答相对 rejected 回答的平均 Token 对数概率，并要求两者达到一个 Margin；训练时不需要 Reference Model，因此显存和计算更省。长度归一化让目标更接近生成时使用的平均得分，也减弱了单纯偏好长答案的倾向。不过 Reference-free 只表示损失里不运行参考模型，并不表示策略不会漂移；离线偏好没覆盖到的行为仍可能退化。

## 核心回答

SimPO 仍使用同一 Prompt 的 preferred/dispreferred 回答对，但把策略自身的平均 token log-probability 当作隐式奖励，并要求 chosen 至少高出 rejected 一个 Margin：

$$
\begin{aligned}
r_{\theta}(x,y)
  &= \frac{\beta}{|y|}\log \pi_{\theta}(y \mid x), \\
\mathcal{L}
  &= -\log \sigma\!\left(
    r_{\theta}(x,y_w)-r_{\theta}(x,y_l)-\gamma
  \right)
\end{aligned}
$$

因为奖励只依赖当前 Policy，SimPO 无需冻结 Reference Model，可减少显存、前向计算和实现复杂度。长度归一化让不同长度序列的分数更可比，但不是对所有长度偏差的完整证明；$$\beta,\gamma$$ 与数据长度分布仍需联合调节。

## 展开说明

标准 DPO 使用 Policy 与 Reference 的序列 log-ratio 比较，Reference 提供“不要偏离初始策略太远”的隐式锚点。SimPO 去掉该比值，改用平均 log-probability，并显式加入 Reward Margin。Margin 太小可能无法形成清晰偏好间隔，太大则可能让大量 Pair 长期处于饱和或高损失区。

Reference-free 不等于无约束：SFT 初始化、成对数据分布、长度归一化和 Margin 都构成归纳偏置。模型仍可能提高 chosen 概率的同时破坏其他能力，因此必须做通用与安全回归。平均 token log-probability 也可能偏好某类措辞，需按长度和任务类型分析。

## 工程实践

实现时确认 log-probability 只覆盖回答有效 token，分别除以 chosen 与 rejected 的真实长度，并检查 Padding Mask。记录 reward accuracy、chosen/rejected 平均 log-prob、Margin 满足率、KL 到初始模型和回答长度。与 DPO 比较时应使用相同初始化、Pair 和 token 预算，并把 Reference 前向成本计入。

## 常见追问

1. **SimPO 不需要成对数据吗？** 需要，它仍比较同一 Prompt 的 chosen 与 rejected；去掉的是 Reference Model，不是 Preference Pair。
2. **为什么要除以回答长度？** 序列 log-prob 是 token log-prob 之和，天然随长度变得更负；取平均可减弱长度造成的不可比性。
3. **Margin $$\gamma$$ 有什么作用？** 它要求 chosen 的奖励比 rejected 明确高出一段距离，而不只是略高；过大或过小都可能影响稳定性。

## 一句话复习

> SimPO 用 Policy 的平均 token log-probability 作为 Reference-free 奖励，并以显式 Margin 拉开 chosen 与 rejected。

## 参考资料

- [SimPO: Simple Preference Optimization with a Reference-Free Reward](https://arxiv.org/abs/2405.14734)

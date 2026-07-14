---
title: "ORPO 如何把 SFT 与偏好优化合并为一个阶段？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - ORPO
  - Odds Ratio
  - 偏好优化
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 ORPO 在同一目标中保留 chosen 的监督学习，并用优势比惩罚 rejected，无需单独参考模型；停顿后讲公式直觉。
2. **再讲关键机制**：解释 SFT 项保证学习好答案，Odds Ratio 项拉开 chosen/rejected 的相对可能性。
3. **主动说取舍**：指出单阶段省流程和显存，却让两个目标耦合，对偏好噪声与权重更敏感。
4. **最后落到项目**：清洗长度与风格偏差并做权重消融，监控人工胜率、拒答率、KL/困惑度和训练成本。

**60 秒口述示例：**

> 我的结论是，ORPO 把 SFT 和偏好优化合在一个阶段：一部分损失提高 chosen 的似然，另一部分通过 odds ratio 拉开 chosen 与 rejected，不需要额外 Reference Model。这里停一下，再强调它不是只做分类，仍要保证模型能生成好回答。优势是流程和显存更简单，代价是监督与偏好目标耦合，数据噪声或权重不当会伤害基础能力。项目里我会控制长度偏差、去重并做权重消融，报告人工胜率、拒答率、验证困惑度、输出长度和 GPU 小时。

## 核心回答

ORPO 在一个目标中同时提高 chosen 回答的似然，并用 Odds Ratio 拉开 chosen 与 rejected。可概括为 `L_ORPO=L_SFT+λL_OR`，其中 `L_SFT` 是 chosen 的负对数似然，`L_OR=-log σ(log odds_θ(y_w|x)-log odds_θ(y_l|x))`，`odds_θ(y|x)=p_θ(y|x)/(1-p_θ(y|x))`。

它不需要单独冻结 Reference Model，也不要求先完成 SFT 再启动一个 DPO 阶段，因此被称为 Monolithic Preference Optimization。这里的序列概率和归一化细节必须按论文实现；直接把许多 token 概率相乘会数值下溢，应在 log 空间计算。

## 展开说明

只做 chosen NLL 会提高正确回答概率，却不会直接压低同 Prompt 的 rejected；只做偏好差值又可能缺少稳定的语言建模锚点。ORPO 用 SFT 项维持 chosen 的生成学习，用 Odds Ratio 项惩罚 chosen 与 rejected 不可分，从一个 Pair 同时提取绝对和相对信号。

单阶段减少了检查点和 Reference 前向成本，但并非总比“两阶段 SFT+DPO”优越。分阶段方案便于分别使用大规模指令数据和较小偏好数据、独立调参及回滚；ORPO 更依赖 Pair 中 chosen 的绝对质量，若 chosen 文本本身较差，SFT 项会直接学习这些缺陷。

## 工程实践

计算 Odds 时使用稳定的 log 概率函数，并测试极低序列概率下没有 NaN。监控 SFT loss、OR loss、Pair accuracy、chosen/rejected log-prob、回答长度和通用能力。调 `λ` 时检查两项梯度量级；与两阶段基线比较要保持总 token 与初始化一致，不能只比较训练阶段数量。

## 常见追问

1. **ORPO 为什么还需要 SFT 项？** 它保证 chosen 本身获得标准生成学习；Odds Ratio 主要负责相对区分，二者职责互补。
2. **ORPO 是 Reference-free 吗？** 是，它不在损失中调用冻结 Reference Policy；但初始化模型仍对训练结果形成先验。
3. **单阶段一定比 SFT 后接 DPO 更好吗？** 不一定。单阶段更简洁，两阶段在数据规模不同、调参隔离和回滚方面更灵活。

## 一句话复习

> ORPO 用 `chosen NLL + λ·Odds-Ratio preference loss` 在一个阶段同时学习好回答并压开坏回答，无需独立 Reference Model。

## 参考资料

- [ORPO: Monolithic Preference Optimization without Reference Model](https://arxiv.org/abs/2403.07691)

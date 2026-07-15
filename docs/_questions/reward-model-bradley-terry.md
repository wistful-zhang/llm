---
title: "奖励模型如何用成对偏好数据训练？"
source: "公开真实面试问题汇总中的 Reward Model 与 Bradley-Terry 高频题；答案依据 InstructGPT 论文原创整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - Reward Model
  - Bradley-Terry
  - RLHF
published: true
answer_status: complete
verified: true
date: 2026-07-13
---

## 面试时怎么答

先从一对回答讲概率模型：chosen 胜过 rejected 的概率由两者奖励差经过 Sigmoid 得到，训练就是最小化负对数似然。强调只看差值，因此奖励整体加常数不影响结果。

若继续问数据质量，可谈位置偏差、长度偏差、标注冲突和同一 Prompt 内比较；评估除了 Pairwise Accuracy，还应看校准和分布外泛化。

**可以这样答：**

> 奖励模型给同一 Prompt 下的两个回答分别打分。Bradley–Terry 假设偏好 chosen 的概率等于 sigmoid(r_chosen 减 r_rejected)，训练损失就是这项概率的负对数。它只依赖奖励差，所以给所有回答的分数同时加一个常数不会改变结果。模型也会学习标注数据里的位置、长度和文风偏好，因此高奖励代表“更像标注者偏爱的回答”，不天然等于客观正确。

## 核心回答

奖励模型通常在语言模型骨干上增加输出标量的 Reward Head。对同一 Prompt 的 `chosen` 与 `rejected` 回答分别得到分数 $$r_c$$、$$r_r$$，再以 Bradley-Terry 形式建模前者胜出的概率 $$\sigma(r_c-r_r)$$，最小化 $$-\log \sigma(r_c-r_r)$$。训练只要求相对排序，不要求不同 Prompt 的绝对分数具有统一含义；因此奖励尺度、数据覆盖和偏好偏差都需要在后续策略优化前校准。

## 展开说明

同一 Prompt 下的成对比较能抵消一部分问题难度差异，但奖励模型仍可能学到长度、礼貌措辞、格式和模型身份等捷径。若每个 Prompt 有多个候选，可从一组排序构造多对比较；这些 pair 彼此相关，Batch 划分和损失权重不能假设它们完全独立。

Reward Head 常读取回答末尾或特殊结束位置的隐藏状态输出分数。Padding、截断和结束 token 若处理错误，会让模型比较错误位置。奖励模型只是在已标注分布上拟合人类偏好的代理，不等于事实验证器，也不保证在新领域可靠。

## 工程实践

评估时除成对准确率外，还应看按领域、长度差、安全类型和生成模型切片的准确率，以及与人工排序的一致性。检查分数分布、校准和 OOD 样本；上线用于 PPO/GRPO 前，用对抗回答测试是否能通过变长、套话或重复关键词骗取高分。

## 常见追问

1. **为什么奖励模型使用分数差，而不是直接回归绝对分数？** 偏好标签只说明两个回答的相对顺序，没有可靠绝对刻度；分数差还让整体平移不影响预测。
2. **一个 Prompt 有四个排序回答时，怎样构造训练对？** 可从排序生成所有有序 Pair 或采样相邻、困难 Pair；全配对信息多但相关性强，训练和评测切分必须按 Prompt 隔离。
3. **成对准确率很高，为什么策略优化后仍可能奖励黑客？** 准确率只覆盖固定验证分布，策略会生成分布外回答并寻找奖励盲区；因此需要独立 Judge、人工和在线回归。

## 一句话复习

> 奖励模型用回答分数差拟合相对偏好，它是有分布边界的代理目标，不是绝对质量函数。

## 参考资料

- 面试主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[InstructGPT](https://arxiv.org/abs/2203.02155)

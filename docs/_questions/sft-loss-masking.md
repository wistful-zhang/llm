---
title: "SFT 为什么常只计算回答部分的损失？"
source: "大厂公开真实面试案例中的 SFT Loss Mask 高频题；答案依据 InstructGPT 论文与 TRL 官方文档原创整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "简单"
tags:
  - SFT
  - Loss Mask
  - Causal LM
published: true
verified: true
date: 2026-07-13
---

## 核心回答

Decoder-Only 模型做 SFT 时，通常把系统提示、用户输入和助手回答拼成一条序列，再做下一 token 交叉熵。若目标是学习“给定指令后如何回答”，常把系统、用户和 Padding 位置的 label 设为忽略值，只让助手回答 token 贡献损失。这样可避免大量 Prompt token 主导梯度，并把训练信号集中到期望输出。不过这不是唯一正确方案；需要模型学习特定输入格式或多角色行为时，也可能对更多位置计算损失。

## 展开说明

下一 token 目标在概念上把位置 `t` 的 logit 与 token `t+1` 对齐；在 Hugging Face 等常见实现中，通常直接令 `labels = input_ids`，再把不监督的位置设为 `-100`，由模型内部 shift logits 与 labels。Loss Mask 与 Attention Mask 不同：Attention Mask 决定某位置能读取哪些上下文，Loss Mask 决定某位置的预测是否计入目标函数。把用户输入从损失中排除，不等于模型看不到它；回答 token 仍通过因果注意力读取此前 Prompt。

对多轮对话，可以只监督所有 assistant 回合，也可以只监督最后一轮。若使用序列打包，还要正确处理样本边界、结束 token 和每条样本的监督区间，否则会把下一条样本误当作上一条回答的延续。

## 工程实践

训练前应抽样打印 `input_ids`、解码文本和 labels，确认被监督的位置完全对齐。持续监控每个 Batch 的有效监督 token 数；如果整条样本都被 Mask，损失可能无意义。长回答会贡献更多 token 级损失，可按任务需要做长度分桶、样本权重或答案级归一化实验。

## 常见追问

1. Loss Mask 与 Attention Mask 的作用有何不同？
2. 多轮对话应该监督所有助手轮次还是只监督最后一轮？
3. 为什么标签通常使用 `-100`，这个值由谁解释？

## 一句话复习

> 回答区 Loss Mask 让模型看完整 Prompt、只为目标回答承担损失，但监督范围应由任务定义而不是照搬模板。

## 参考资料

- 面试主题：[AgentGuide 大厂真实面经案例集](https://github.com/adongwanai/AgentGuide/blob/main/docs/04-interview/12-company-interview-cases.md)
- 技术依据：[InstructGPT](https://arxiv.org/abs/2203.02155)、[Hugging Face TRL SFT Trainer](https://huggingface.co/docs/trl/sft_trainer)

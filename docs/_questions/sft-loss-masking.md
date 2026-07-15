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
answer_status: complete
verified: true
date: 2026-07-13
---

## 面试时怎么答

从训练目标解释：多数指令微调想优化“给定用户内容时怎样回答”，因此 Prompt 作为条件输入，Loss 只落在 Assistant Token 上，避免浪费容量去复述固定模板和用户文本。

不要说这是唯一正确做法。多轮建模、继续预训练或需要学习完整对话分布时，也可能计算更多区域。容易出错的是 Tokenization 后的角色边界、截断和 Padding，追问时重点讲这些。

**可以这样答：**

> SFT 常把系统和用户部分只作为条件输入，交叉熵仅计算 Assistant 回答区域。这样梯度集中在希望模型生成的内容上，也避免模型花大量训练信号去预测固定模板或用户原话。Loss Mask 必须在 Tokenization 后按角色边界准确构造，并与 Padding 和截断一致。只训回答并非定律；若目标是完整对话建模或继续预训练，让更多区域参与损失也可能更合理。

## 核心回答

Decoder-Only 模型做 SFT 时，通常把系统提示、用户输入和助手回答拼成一条序列，再做下一 token 交叉熵。若目标是学习“给定指令后如何回答”，常把系统、用户和 Padding 位置的 label 设为忽略值，只让助手回答 token 贡献损失。这样可避免大量 Prompt token 主导梯度，并把训练信号集中到期望输出。不过这不是唯一正确方案；需要模型学习特定输入格式或多角色行为时，也可能对更多位置计算损失。

## 展开说明

下一 token 目标在概念上把位置 `t` 的 logit 与 token `t+1` 对齐；在 Hugging Face 等常见实现中，通常直接令 `labels = input_ids`，再把不监督的位置设为 `-100`，由模型内部 shift logits 与 labels。Loss Mask 与 Attention Mask 不同：Attention Mask 决定某位置能读取哪些上下文，Loss Mask 决定某位置的预测是否计入目标函数。把用户输入从损失中排除，不等于模型看不到它；回答 token 仍通过因果注意力读取此前 Prompt。

对多轮对话，可以只监督所有 assistant 回合，也可以只监督最后一轮。若使用序列打包，还要正确处理样本边界、结束 token 和每条样本的监督区间，否则会把下一条样本误当作上一条回答的延续。

## 工程实践

训练前应抽样打印 `input_ids`、解码文本和 labels，确认被监督的位置完全对齐。持续监控每个 Batch 的有效监督 token 数；如果整条样本都被 Mask，损失可能无意义。长回答会贡献更多 token 级损失，可按任务需要做长度分桶、样本权重或答案级归一化实验。

## 常见追问

1. **Loss Mask 与 Attention Mask 的作用有何不同？** Loss Mask 决定哪些标签计入目标函数；Attention Mask 决定每个位置可读取哪些 Token，Prompt 可见并不意味着必须计算其 Loss。
2. **多轮对话应该监督所有助手轮次还是只监督最后一轮？** 若所有助手轮次质量可靠且符合目标，可以全部监督提高数据利用率；只关心末轮或历史答案含噪时，可只监督末轮。
3. **为什么标签通常使用 `-100`，这个值由谁解释？** PyTorch 的 CrossEntropyLoss 默认把 `ignore_index=-100` 的位置排除；这是损失函数约定，不是 Tokenizer 的特殊 Token ID。

## 一句话复习

> 回答区 Loss Mask 让模型看完整 Prompt、只为目标回答承担损失，但监督范围应由任务定义而不是照搬模板。

## 参考资料

- 面试主题：[AgentGuide 大厂真实面经案例集](https://github.com/adongwanai/AgentGuide/blob/main/docs/04-interview/12-company-interview-cases.md)
- 技术依据：[InstructGPT](https://arxiv.org/abs/2203.02155)、[Hugging Face TRL SFT Trainer](https://huggingface.co/docs/trl/sft_trainer)

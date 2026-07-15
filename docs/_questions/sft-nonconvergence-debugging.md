---
title: "SFT 模型不收敛时应该如何定位问题？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - SFT
  - Chat Template
  - Loss Mask
published: true
date: 2026-07-14
---

## 面试时怎么答

这是排障题，先定义“不收敛”具体指训练 Loss 不降、验证集变差，还是输出不可用。最有效的第一步是让模型过拟合几十条干净样本；若连这个都做不到，优先查数据与实现，而不是扫超参数。

随后按标签与 Mask、Tokenizer 和模板、优化器与学习率、精度和分布式同步排查。若小样本能拟合，再回到数据质量、任务冲突和验证分布。

**可以这样答：**

> 先选几十条人工确认无误的样本，关闭复杂增强，检查模型能否快速过拟合。若不能，逐项核对标签右移、Loss Mask、角色模板、EOS、截断和有效监督 Token，再看学习率、梯度范数、混合精度及各 Rank 数据是否一致。若小样本可拟合而全量不行，问题更可能在脏数据、任务配比或验证分布。每次只改变一个因素，并保存可复现的失败 Batch。

## 核心回答

先区分“不收敛”是训练 Loss 不下降，还是 Loss 下降但生成质量没有改善。最有效的第一步是让模型过拟合一个很小、人工核对过的数据集；若几十条样本都学不会，优先检查从 messages、Chat Template、tokenization、截断到 labels 的整条流水线，而不是继续增加数据或训练轮数。

逐条打印解码后的输入、每个 token 的 label 和监督 Mask，确认 Assistant 回答没有被截掉、有效监督 token 数大于零、被忽略位置才是 `-100`、BOS/EOS 没有重复。然后再检查可训练参数、LoRA 模块命中、学习率与调度、有效 Batch、梯度范数、数据冲突和评估时使用的模板。

## 展开说明

常见故障可以按症状归类：

- **Loss 不动或无梯度**：所有 label 都是 `-100`、适配器没有命中模块、参数被错误冻结、序列在回答开始前就被截断。
- **Loss 剧烈波动或 NaN**：有效监督 token 数偶尔为零、学习率过大、低精度溢出、异常长样本或脏数据。
- **Loss 下降但生成变差**：训练与推理 Chat Template 不一致、只记住固定格式、答案冲突或重复、评估生成参数改变。
- **短样本有效、长样本无效**：长度分布或 packing 有误，回答尾部经常被截断，位置与样本边界 Mask 不正确。

Chat Template 不只是展示格式，它决定角色标记、特殊 token 和生成起点。训练数据通常不应无条件加入用于推理的 generation prompt；若先渲染模板再 tokenize，还要避免 tokenizer 再次自动添加相同特殊 token。Loss Mask 与 Attention Mask 也必须分开核验。

## 工程实践

建立一个“数据单元测试页面”：展示原 messages、模板文本、token、labels、有效监督比例和截断位置。每次改模板或 tokenizer 都运行黄金样本回归。训练前做 16～64 条样本的过拟合测试；正式训练时按数据源和长度切分 Loss，并保存固定 Prompt 的周期性生成结果，避免平均 Loss 掩盖某一类数据完全失效。

## 常见追问

1. **Label 全部变成 `-100` 会怎样？** 没有任何有效监督 token，Loss reduction 可能无意义或为 NaN，模型也不会获得任务梯度。
2. **Chat Template 错误通常有什么表现？** 特殊 token 重复、角色边界错位、训练 Loss 可降但推理时续写用户文本或无法正确开始 Assistant 回答。
3. **为什么先做小数据过拟合？** 它能快速区分流水线或优化器故障与数据规模、泛化不足，显著缩小排查范围。
4. **Loss 下降为什么不代表 SFT 成功？** 模型可能只学会高频格式或重复答案，真实任务、生成模板和通用能力仍可能退化。

## 一句话复习

> SFT 不收敛先做小样本过拟合，再逐 token 核对模板、截断、labels 和可训练参数，最后才调学习率与数据配比。

## 参考资料

- [Hugging Face Transformers：Chat Templates](https://huggingface.co/docs/transformers/main/en/chat_templating)
- [Hugging Face TRL：SFT Trainer](https://huggingface.co/docs/trl/main/en/sft_trainer)
- [PyTorch：CrossEntropyLoss 与 ignore_index](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html)

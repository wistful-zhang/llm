---
title: "从输入 Prompt 到生成第一个 Token，模型内部经历了什么？"
source: "用户提供的分级面试题单；具体公司归属未独立核验，技术答案依据原论文整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
study_tier: "core"
tags:
  - Transformer
  - Prefill
  - 自回归生成
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

沿数据流讲最清楚：文本变 Token ID，进入 Embedding 和多层 Transformer，最后一个有效位置经 LM Head 得到 Logits，采样出首 Token。一定要点出这段整序列计算叫 Prefill，后续才是复用 KV Cache 的 Decode。

若面试官转向工程延迟，把排队、分词、Prefill、采样和网络拆开即可，避免把 TTFT 全归因于 GPU 计算。

**可以这样答：**

> Prompt 先经 Tokenizer 变成 Token ID，再经过词嵌入、位置表示和多层带因果掩码的 Transformer。整段输入可以并行完成 Prefill，最后一个有效位置经 LM Head 映射到词表 Logits，经过采样得到首 Token；后续生成则复用 KV Cache 逐步 Decode。线上 TTFT 还包含排队、分词和网络时间，因此需要分段观测才能找到真正瓶颈。

## 核心回答

以 Decoder-only 模型为例，系统先用 Chat Template 把角色和消息拼成模型约定的文本，再由 Tokenizer 转成 token ID。Embedding 层把 ID 映射为向量，整段 Prompt 随后依次通过多个 Transformer Block；每个 Block 通常包含因果自注意力、FFN、残差连接和归一化。位置机制的作用点随架构而异：绝对位置向量可在输入侧相加，RoPE 则通常在每层 Attention 中对投影后的 Q/K 旋转。最后一个有效位置的隐藏状态经过最终归一化与 LM Head，得到词表上每个 token 的 Logit，再经解码策略选出第一个新 token。

这次对整段 Prompt 的前向计算叫 **Prefill**。生成推理启用缓存时，它会同时建立各层的 KV Cache。第一个新 token 产生后进入 **Decode**：每一步只对最新 token 执行完整的增量前向，包括归一化、Attention、残差和 FFN，并把该 token 的 K/V 追加到缓存；历史 token 的层表示不再重算。流程持续到遇到 EOS、长度上限或其他停止条件。

## 展开说明

可以把首 token 流程口述成下面七步：

1. **模板化**：将 system、user、assistant 等角色按模型训练时的 Chat Template 编码，必要时追加“开始回答”的控制 token。
2. **分词**：Tokenizer 将字符串映射成 `input_ids`；不同 Tokenizer 对相同文本可能产生不同长度。
3. **输入表示**：查 Embedding 表得到形状近似为 `[batch, sequence, hidden]` 的向量；若模型使用绝对位置 Embedding，也可在输入侧相加。
4. **Transformer Block**：因果 Mask 保证位置 $$t$$ 只能读取不晚于 $$t$$ 的内容；Attention 聚合位置间信息，FFN 做逐位置非线性变换。使用 RoPE 的模型会在各层 Attention 的 Q/K 投影后按位置旋转。
5. **输出投影**：最后一个非 Padding 位置的隐藏状态 $$h$$ 经 LM Head 得到 $$z = W_{\mathrm{lm}}h + b$$。LM Head 可能与输入 Embedding 共享权重，但不是必须。
6. **得到分布**：$$p(\text{token} \mid \text{prompt}) = \operatorname{softmax}(z)$$。Temperature、top-k、top-p 等会在采样前改变候选分布；贪心解码则直接选最大 Logit。
7. **增量解码**：把选中的 token 追加到上下文；启用 KV Cache 时，只对新 token 走完整 Block 前向并追加其 K/V，再进行下一步生成。生成步之间存在数据依赖，不能一次算出所有未知 token。

“首 token 来自最后一个位置”是常见 Decoder-only 实现的描述；批处理中必须根据 Attention Mask 找到每条序列的最后一个有效位置。Encoder-Decoder 模型还会多出编码器和交叉注意力，不能照搬这条流程。

## 工程实践

排查“首字很慢”时要拆开模板化、分词、排队、Prefill、采样和网络发送，不能把全部时间都归因于模型。TTFT 通常同时包含排队和 Prefill；长 Prompt、冷启动、Prefix Cache 未命中或 GPU 拥塞都可能使它升高。上线时必须绑定模型、Tokenizer、Chat Template 和生成参数版本，否则即使权重没有变化，也可能因为特殊 token 或模板不一致而明显掉点。

## 常见追问

1. **Tokenizer、Embedding、Transformer Block 和 LM Head 分别做什么？** Tokenizer 把文本映射为离散 ID，Embedding 把 ID 变成连续向量，Transformer Block 反复聚合上下文并变换特征，LM Head 再把最终隐藏状态投影成词表 Logit。
2. **Prefill 为什么可以并行处理 Prompt，Decode 为什么仍要逐 token 进行？** Prompt 的所有 token 已知，Causal Mask 允许同一层一次计算所有位置；Decode 的下一个输入尚未产生，必须等当前 token 被选出后才能继续。
3. **KV Cache 缓存什么，为什么通常不缓存历史 Query？** 它保存每层历史 token 的 K/V，因为后续新 Query 仍要读取它们；历史 Query 只用于当时位置的打分，未来步骤不会复用。
4. **Temperature、top-k 和 top-p 在哪个阶段生效？** 它们作用于 LM Head 产生 Logit 之后、选定下一个 token 之前。Temperature 调整分布尖锐度，top-k/top-p 限制候选集合。
5. **批处理中如何找到每条样本用于预测首 token 的有效位置？** 应结合 Padding 方向和 Attention Mask 选取每条序列最后一个有效 token 的 Logit；不能无条件把 Padding 位置当作预测位置。

## 一句话复习

> Prompt 先经模板、分词和整段 Prefill 得到首 token 分布；启用缓存时同时建立 KV Cache，之后模型只对新 token 做完整增量前向并复用历史 K/V。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Hugging Face：Generation strategies](https://huggingface.co/docs/transformers/main/generation_strategies)
- [Hugging Face：Caching](https://huggingface.co/docs/transformers/main/cache_explanation)

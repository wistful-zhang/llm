---
title: "temperature、top_p 和 max_tokens 分别有什么作用？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "工程实践"
difficulty: "简单"
tags:
  - Sampling
  - 解码
  - 生成参数
published: true
date: 2026-07-13
---

## 面试时怎么答

把三个参数分别放到“分布形状、候选范围、结束条件”上：temperature 缩放 Logits，top_p 截取累计概率质量，max_tokens 只是输出长度上限。说明它们会共同作用，不能孤立调参。

面试官可能问低 temperature 是否等于确定性，或 max_tokens 能否保证完整回答。补充采样随机性仍取决于解码方式，长度上限也可能把答案硬截断；结构化任务通常更偏保守解码。

**可以这样答：**

> Temperature 用来缩放 Logits：小于 1 会让分布更尖锐，输出更稳定；大于 1 会增加多样性。top_p 只在累计概率达到阈值的最小候选集合中采样，动态裁掉长尾。max_tokens 不改变概率分布，只限制最多生成多少 Token，达到上限时可能把句子截断。事实问答通常希望分布更集中，创作则可适当放宽，但 temperature 和 top_p 同时收紧往往会让输出过于单一。

## 核心回答

启用随机采样时，temperature 调整 logits 的相对差异：越低分布越集中，越高越随机；top_p 只在累计概率达到阈值的最小候选集合中采样。Hugging Face 的 max_new_tokens 明确限制新生成 token 数；max_tokens 的名称和是否包含输入则取决于具体 API。长度上限用于控制成本、延迟和截断风险，不会给模型增加新知识。

## 展开说明

- **temperature**：采样概率可写为 p = softmax(logits / T)，数学上要求 T > 0。部分 API 把 temperature = 0 特判为贪心行为，它不是该公式中的合法温度。
- **top_p**：先按概率从高到低排序，再取累计概率达到阈值的最小前缀集合，对集合内概率重新归一化后采样；集合会随每一步的分布变化。
- **输出长度参数**：不同服务商可能使用 max_output_tokens、max_completion_tokens、max_new_tokens 等名称。它只是上限，模型也可能因 EOS 或停止条件提前结束；输入加输出仍受上下文窗口限制。

temperature 和 top_p 只会在启用随机采样时影响 token 选择；贪心或 Beam Search 有自己的选择规则。二者都会改变候选分布，工程上通常先固定一个，再调整另一个，避免无法解释效果来源。

## 工程实践

结构化抽取、工具参数和可复现评估通常使用低随机性，并配合 Schema 校验；创意生成可提高随机性，但应通过多样性和质量指标验证。max_tokens 要结合业务输出长度分布设置，过小会截断，过大则放大尾延迟和费用风险。

## 常见追问

1. **top_p 与 top_k 有什么区别？** top_k 固定保留概率最高的 k 个候选；top_p 保留累计概率达到阈值的最小集合，候选数会随分布尖锐度变化。
2. **temperature = 0 是否保证每次完全一致？** 不保证。框架可能把它实现为贪心，但并行归约、模型版本、批处理和浮点非确定性仍可能改变并列或接近 Logit 的选择。
3. **为什么输出仍可能在 max_tokens 前结束？** max_tokens 是上限而非目标长度；模型生成 EOS、命中 Stop Sequence、客户端取消或安全策略中止都会提前结束。

## 一句话复习

> temperature 和 top_p 控制如何选 token，max_tokens 控制最多选多少个 token。

## 参考资料

- 面经主题：[大模型公开面试题汇总](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 官方资料：[Hugging Face Generation Strategies](https://huggingface.co/docs/transformers/main/en/generation_strategies)

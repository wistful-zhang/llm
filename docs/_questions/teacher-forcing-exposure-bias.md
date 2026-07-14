---
title: "Teacher Forcing 是什么，为什么会产生 Exposure Bias？"
source: "用户提供的分级面试题单；具体公司归属未独立核验，技术答案依据原论文整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
tags:
  - Teacher Forcing
  - Exposure Bias
  - 自回归生成
published: true
date: 2026-07-14
---

## 核心回答

Teacher Forcing 指训练自回归模型时，预测位置 `t` 总是使用数据中的真实前缀 `x_<t`，而不是把模型刚预测的 token 再喂回去。这样所有目标位置可配合 Causal Mask 一次并行训练，监督信号稳定且效率高。

推理时没有真实后续 token，模型只能基于自己生成的前缀继续预测。一旦早期出错，后续会进入训练中较少见的前缀分布，错误可能累积；这种训练前缀分布与生成前缀分布的不一致通常称为 **Exposure Bias**。它是潜在问题，不意味着每个模型或每条输出都会持续恶化，影响大小还取决于数据、模型能力和解码方式。

## 展开说明

训练目标通常是：

```text
L_TF = -Σ_t log pθ(x_t | x_<t)
```

这里的 `x_<t` 来自真实样本。推理时的条件前缀则包含模型样本 `x̂_<t`：

```text
x̂_t ~ pθ(· | x̂_<t)
```

两种前缀分布不同，且训练的 Token-level 最大似然也不直接优化完整回答的任务指标。Scheduled Sampling 会在训练时按一定概率混合真实 token 与模型生成 token，希望逐渐缩小差距；但它引入顺序采样开销，混合前缀未必来自一致的数据分布，训练目标也更难解释，因此不是现代 LLM 预训练或 SFT 的默认做法。

现代实践通常仍以 Teacher-forced 最大似然为基础，再通过高质量多轮数据、模型生成数据回流、偏好优化、在线强化学习或序列级评测缓解行为层面的偏差。不同方法解决的问题不同：例如 DPO 使用离线偏好对，但不等于让模型在训练时完整经历自身 Rollout；PPO、GRPO 等在线采样方法才会显式从当前或近似当前策略生成回答。

## 工程实践

评估时不能只看 Teacher-forced Loss，应让模型自由生成，按回答长度和多轮深度观察重复、跑题、格式失效与错误累积。构造多轮 SFT 数据时要确保历史 assistant 消息与真实部署格式一致；若线上会接收有噪声或不完美历史，也应加入代表性样本。对 Scheduled Sampling 或在线训练方案，要同时衡量质量收益、Rollout 成本、策略陈旧和安全回归。

## 常见追问

1. **Teacher Forcing 为什么能让训练阶段并行计算所有目标位置？** 真实序列已经给出所有前缀，Causal Mask 可以在一次前向中限制各位置只看历史。模型不必等待自己先生成前一个 token。
2. **训练和自回归推理所看到的前缀分布有什么不同？** 训练使用数据中的真实前缀，推理使用模型此前生成的前缀。模型出错后，后续条件可能偏离训练数据分布。
3. **Exposure Bias 是否意味着生成错误一定会无限放大？** 不一定。模型可能自行恢复，解码约束和强上下文也能抑制错误；严重程度应通过自由生成、多轮和长输出评测判断。
4. **Scheduled Sampling 的思路和局限是什么？** 它逐渐用一部分模型预测替代真实前缀，让训练接触自身输出；代价是引入顺序生成、混合前缀偏差和更复杂的优化目标，所以不是现代 LLM 的默认训练方式。
5. **DPO 与在线 PPO/GRPO 在是否使用当前策略 Rollout 上有何差异？** 标准离线 DPO 读取已收集的 chosen/rejected 对，不要求训练时从当前策略生成；PPO/GRPO 通常需要在线或近在线 Rollout，因此能探索新回答但系统成本更高。

## 一句话复习

> Teacher Forcing 用真实前缀高效学习下一 token；推理只能跟随自身输出，前缀分布错位会带来 Exposure Bias，但是否严重必须靠自由生成评测判断。

## 参考资料

- [Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215)
- [Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks](https://arxiv.org/abs/1506.03099)

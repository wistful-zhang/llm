---
title: "GRPO 中 πθ、πold 与 Rollout 策略分别是什么，如何同步？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - GRPO
  - Rollout
  - 策略陈旧
published: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** GRPO 用组内奖励归一化得到优势，`πθ` 是当前策略、`πold` 固定采样分布；rollout 与更新间必须控制策略陈旧度。
2. **再讲关键机制：** 说明同一 prompt 采样一组回答、算奖励与组内 Advantage，再用 old-policy ratio 做裁剪更新。
3. **主动说取舍：** 同步越频繁 rollout 更 on-policy 但 GPU 等待多；异步吞吐高，却会让 importance ratio 漂移。
4. **最后落到项目：** 监控策略版本差、ratio 分布、clip fraction、KL、rollout 吞吐和训练空转；说完停。

**60 秒口述示例：**

> 我会先澄清三个对象：当前策略 `πθ` 被优化，冻结的 `πold` 产生或记录 rollout 概率，组内多条回答的奖励做中心化得到 Advantage。更新时用概率比并裁剪，避免一步改太大。系统取舍是同步程度：太同步浪费生成和训练资源，太异步又产生旧策略数据。项目里我会看版本 lag、ratio 分布、clip fraction、KL、rollout tokens/s 和训练空转率。


## 核心回答

`πθ` 是当前正在更新的策略；`πold` 是本批优化中固定的旧策略，用于构造重要性比率；Rollout 策略是实际执行生成的模型副本。在同步实现中会在生成前复制当前参数，但只有权重版本、Tokenizer、采样变换、数值精度和生成引擎语义都一致时，才可近似把 `πrollout` 与 `πold` 视为同一行为分布。否则应保存 Rollout log probability，并监控或校正训练—生成分布偏差；异步系统还会叠加 Rollout 副本参数滞后，因此三者必须用明确版本区分。

对同一 Prompt 采样回答 `y_i ~ πrollout(·|x)`，组内奖励可形成优势：

```text
A_i = (r_i - mean(r)) / (std(r) + ε)
ρ_i,t(θ) = πθ(y_i,t | x, y_i,<t) / πold(y_i,t | x, y_i,<t)
```

GRPO 再使用裁剪后的概率比更新 `πθ`，并常加入相对参考策略的 KL 约束。参考策略 `πref` 用于限制长期漂移，不等于 `πold`。

## 展开说明

经典同步循环是：冻结当前策略为行为快照、生成一批回答并保存旧 log probability、计算奖励和组内优势、对该批数据做有限次更新，然后重新同步。工程上把生成与训练放在不同进程或推理引擎，可以提高设备利用率，但参数复制、队列和大 Batch 会增加样本年龄。

当 `πrollout` 过旧时，采样分布与 `πθ` 的差距增大，概率比更容易落到裁剪区间，导致有效更新减少；严重时还会出现高方差、支持集不匹配和奖励分布漂移。重要性比率只能在有限分布差异下校正，不能把任意陈旧数据自动变成可靠的 on-policy 数据。还要区分两个层面：PPO/GRPO 的裁剪比率约束新旧训练策略更新，生成引擎修正比率处理 Rollout 与训练端 log probability 的实现偏差，它们不一定是同一个比率。

缓解方法包括提高同步频率、限制每批优化轮数、缩短 Rollout 队列、为样本记录 policy version、丢弃或降权过旧样本，以及监控 ratio、clip fraction 和样本年龄。GRPO 被称为 on-policy 还是 off-policy 不能只看算法名字：新鲜 Rollout 且少量复用时接近 on-policy，长时间复用或异步滞后会增加 off-policy 程度。

## 工程实践

每条轨迹保存生成模型版本、旧 token log probability、生成时间和更新消费时间。监控 policy lag、importance ratio 分布、clip fraction、KL、组内奖励方差和每个版本的样本量。同步时要保证所有 Rollout worker 完整切换到同一检查点后才标记新版本，避免同一 Batch 混入无法追踪的参数版本。

## 常见追问

1. **`πold` 与参考模型 `πref` 是同一个模型吗？** 不是；`πold` 是本批数据的行为快照，`πref` 通常是长期冻结、用于 KL 约束的基准模型。
2. **为什么 Rollout 模型要与训练模型解耦？** 生成和反向传播的计算形态不同，解耦便于分别调度和提高利用率，但会引入同步与样本陈旧问题。
3. **Batch 很大为什么可能加重策略陈旧？** 收集和消费整批数据耗时更长，前部样本在被更新时对应的行为策略可能已经落后多个优化步。
4. **GRPO 一定是严格 on-policy 吗？** 不一定；取决于 Rollout 是否来自当前策略、数据复用次数和异步滞后程度。

## 一句话复习

> `πθ` 负责学习，`πold` 定义本批行为概率，Rollout 副本负责生成；版本同步越滞后，GRPO 的 off-policy 风险越高。

## 参考资料

- [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models](https://arxiv.org/abs/2402.03300)
- [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948)
- [Hugging Face TRL：GRPO Trainer](https://huggingface.co/docs/trl/main/en/grpo_trainer)

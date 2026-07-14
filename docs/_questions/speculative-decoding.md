---
title: "推测解码为什么能加速生成，什么时候反而收益不大？"
source: "公开 LLM 推理面试题整理；依据推测解码原论文原创整理"
review_status: "待复习"
category: "工程实践"
difficulty: "中等"
tags:
  - 推测解码
  - 推理优化
  - 延迟
published: true
verified: true
date: 2026-07-13
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说小 Draft 串行提议多个 Token，大 Target 一次并行验证，以减少 Target Decode 步数。
2. **再讲关键机制**：解释接受率、拒绝后的修正采样，以及为何能保持 Target 的原目标分布。
3. **主动说取舍**：Draft 越强接受率可能更高，但自身生成也更慢；短输出、低 Batch 或模型不匹配收益小。
4. **最后落到项目**：比较接受率、每轮接受 Token、端到端 Tokens/s、P50/P99 和额外显存，停下来等追问。

**60 秒口述示例：**

> 我的结论是推测解码不靠近似 Target 输出，而是用便宜 Draft 连续提议多个 Token，再让 Target 一次前向验证整段；按接受拒绝规则和修正分布采样，可以保持 Target 原分布。加速来自减少昂贵 Target 的串行调用次数。取舍是 Draft 太弱接受率低，太强又自身耗时。项目中我会按输入输出长度和并发分桶测接受率、每轮接受 Token 数、端到端 Tokens/s、P50/P99 和显存，不能只看理论倍数。

## 核心回答

自回归模型通常一次只能确定下一个 token。推测解码先让更便宜的 draft 模型连续提出若干候选 token，再让 target 模型用一次并行前向验证这段候选；一次接受多个 token 时，就减少了 target 模型串行解码步数。经典随机采样算法通过接受/拒绝和校正分布保持 target 模型的输出分布，而不是近似替换它。

收益主要取决于候选接受率、target 一次验证多个 token 的效率以及 draft 开销。两个模型分词不兼容、领域差异大、候选经常被拒、并发已经很高或验证 kernel 不高效时，额外 draft 计算和显存可能抵消收益。

## 展开说明

可以用“每轮被接受的平均 token 数”理解加速来源，但不能只看接受率：

- draft 太小可能快但预测差，太大则接受率提高却自身昂贵，需要找端到端最优点。
- 候选长度越长，潜在一次通过更多 token，但后部被拒后收益递减，并增加验证工作。
- 低并发、交互式请求更容易从减少串行步数获益；高并发服务还要比较它与连续批处理争用算力的影响。
- Greedy 验证容易理解；带 temperature 的采样必须使用正确的拒绝与校正规则，不能简单地“相同就收下、不同就全丢弃”后声称分布不变。
- 自推测、并行头或检索式 draft 是同一目标的不同实现，性能结论不能直接互换。

## 工程实践

在真实输入/输出长度、采样参数和并发分布下做 A/B，记录接受长度分布、draft 与 target 耗时、TTFT、TPOT、吞吐、峰值显存和输出一致性。先保证关闭推测解码时的基线参数完全相同；若是随机采样，做分布级回归而不是要求逐 token 文本一致。

## 常见追问

1. **为什么 target 模型可以一次验证多个候选 token？** Draft 已给出整段候选前缀，Target 可像 Prefill 一样在一次前向中并行计算这些位置的条件分布，再按顺序判断接受。
2. **推测解码如何在随机采样下保持目标分布？** 它按 Target 与 Draft 概率比接受候选，被拒绝时从校正后的剩余分布采样；正确实现不会把 Draft 分布当最终分布。
3. **draft 模型越强，为什么不一定越快？** 更强 Draft 可能提高接受率，却增加每个提议 Token 的计算；总收益取决于接受长度与 Draft/Target 成本比。

## 一句话复习

> 推测解码用便宜候选换取 target 的并行验证，速度取决于接受收益能否覆盖 draft 与验证开销。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的推测解码题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 原始论文：[Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192)、[Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318)

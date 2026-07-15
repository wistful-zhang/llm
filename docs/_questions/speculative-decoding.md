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

回答的关键不是“用小模型先生成”，而是目标模型能并行验证一段候选，并通过接受与校正机制保持原目标分布。讲清 draft 提议、target 验证、接受前缀和拒绝处校正这四步即可。

追问什么时候无收益时，谈接受率、验证开销和系统瓶颈：草稿不准、输出很短、目标模型未受内存带宽限制，或两模型争抢资源时，加速都可能消失。

**可以这样答：**

> 推测解码先让较小的 Draft 模型连续提出若干 Token，再让 Target 模型一次前向并行检查这些位置。按概率接受连续候选，在首个拒绝处从校正分布采样，因此可以保持与 Target 原解码相同的分布，而不是牺牲质量换速度。收益取决于接受率和验证成本；两模型差异大、输出短或资源竞争严重时，额外草稿计算可能抵消加速。

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

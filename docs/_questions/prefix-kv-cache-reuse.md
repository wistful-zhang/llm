---
title: "Prefix KV Cache 如何复用公共前缀并保证租户隔离？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "中等"
tags:
  - Prefix Cache
  - KV Cache
  - 多租户
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 Prefix Cache 复用完全相同且配置兼容的前缀 KV，主要降低重复 Prefill；停顿后强调不是语义缓存。
2. **再讲关键机制**：解释 Token 级前缀哈希、块引用计数、写时复制、模型与位置配置指纹。
3. **主动说取舍**：指出长公共前缀命中收益大，却占用显存；跨租户共享还会带来侧信道与越权风险。
4. **最后落到项目**：默认租户隔离并按收益淘汰，监控命中 Token 率、节省 Prefill、TTFT、显存和隔离事件。

**60 秒口述示例：**

> 我的结论是，Prefix KV Cache 只复用 Token 完全一致、模型和位置配置兼容的公共前缀，从而跳过重复 Prefill；它不是“问题意思相近就复用答案”的语义缓存。这里停一下，再讲缓存键要包含模型、Tokenizer、模板和租户边界，KV 块用引用计数与写时复制管理。取舍是长系统提示命中收益高，但缓存会挤占并发显存，跨租户共享还有侧信道风险。项目里默认租户隔离，按节省计算淘汰，并监控命中 Token 率、TTFT、显存占用和隔离告警。

## 核心回答

当多个请求的起始 Token 完全一致时，它们在相同模型、Adapter 和注意力配置下会产生相同的前缀 KV，可以直接复用而不必重复 Prefill。系统通常按 Token Block 建立哈希表或 Radix Tree，命中最长公共前缀后只计算未命中的后缀，并用引用计数与 Copy-on-Write 管理共享 Block。

这不是语义缓存：意思相近但 Token 不同不能直接复用 KV。正确性键至少应覆盖模型与权重版本、Tokenizer、Adapter、Token 序列以及会改变注意力结果的配置；安全上还要按租户或权限域命名空间隔离，并防范命中时延形成的侧信道。

## 展开说明

Prefix Cache 的收益约等于省掉的前缀 Prefill 计算，适合固定 System Prompt、多轮会话、Few-shot 示例和树状推理。输出很长而前缀很短时，收益会被 Decode 主导；前缀高度离散时，维护索引反而增加开销。

- **索引**：Radix Tree 擅长查最长公共前缀；Block Hash 便于分布式目录和固定块管理。
- **生命周期**：共享块不能在仍有请求引用时被回收，分支写入需要 Copy-on-Write。
- **淘汰**：可结合 LRU、块大小、重算成本和租户配额，而不应只看最近访问时间。
- **一致性**：模型、LoRA、RoPE/位置语义或 Prompt 模板变化时必须形成新命名空间或失效旧缓存。

版本边界：SGLang 论文中的 RadixAttention 是一种具体实现；其他引擎可能采用块哈希、不同的 Eviction 或跨实例缓存协议，论文性能不能直接外推到任意版本和流量分布。

## 工程实践

监控命中请求率、命中 Token 率、节省的 Prefill Tokens、TTFT、目录查询时间、逐租户占用和 Eviction/重算量。测试必须覆盖模型热更新、Adapter 切换、租户权限变化、哈希碰撞、共享块写时复制和缓存目录陈旧，不能只验证普通命中路径。

## 常见追问

1. **为什么“文本看起来一样”仍可能不能命中？**  Tokenizer 版本、聊天模板、特殊 Token 或 Unicode 规范化可能让 Token 序列不同；KV Cache 必须按模型真正看到的 Token 与执行配置判等。
2. **Radix Tree 和 Block Hash 怎样选择？**  Radix Tree 自然表达变长公共前缀，Block Hash 更适合固定页和分布式定位；工程上可以用树做逻辑匹配、哈希做物理块寻址。
3. **为什么租户隔离不能只依赖“内容不可读”？**  即使调用方拿不到 KV 数值，也可能通过命中造成的 TTFT 差异推断别的租户是否使用过某个前缀；应分命名空间、做配额与审计，敏感场景可禁用跨用户共享。

## 一句话复习

> Prefix Cache 复用的是配置一致、Token 完全相同的前缀 KV，而不是相似问题的答案，正确性和租户边界必须进入缓存键。

## 参考资料

- 原始论文：[SGLang: Efficient Execution of Structured Language Model Programs](https://arxiv.org/abs/2312.07104)

---
title: "模型权重、Tokenizer 与 Adapter 的供应链风险如何治理？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
verified: true
review_status: "待复习"
category: "评测与安全"
difficulty: "中等"
tags:
  - Supply Chain
  - Safetensors
  - Artifact Security
published: true
date: 2026-07-14
---

## 面试时怎么答

模型制品供应链题按“进入系统前如何建立信任”来答：核验来源、签名与哈希，限制安全加载格式，在隔离环境扫描并生成 SBOM，再做行为回归。风险不仅是 Pickle 执行，还包括权重后门、Tokenizer/Adapter 篡改和许可证；签名只能证明来源，不能证明行为安全。

**可以这样答：**

> 模型、Tokenizer 和 Adapter 都是供应链制品，必须验证来源、完整性、加载格式、依赖和许可证，不能因为“只是权重”就直接上线。风险既包括 Pickle 反序列化执行，也包括权重后门、Tokenizer 篡改和 Adapter 串换；安全格式只能减少代码执行面，不能证明行为无害。防护方案里要在隔离环境拉取，校验签名与哈希，生成 SBOM，做恶意文件扫描和行为回归，并监控未签名制品、追溯覆盖率和紧急撤回 RTO。

## 核心回答

模型仓库不只有权重，还可能包含 Tokenizer、配置、模板、Adapter、量化元数据和自定义代码。风险包括 Pickle 反序列化执行任意代码、`trust_remote_code` 加载恶意实现、文件被替换、依赖投毒、Adapter 后门，以及 Tokenizer 或 Chat Template 悄悄改变输入语义。能成功加载或指标正常都不能证明产物可信。

治理需要建立从来源到部署的可验证链：固定不可变版本或 Commit，校验哈希与签名，记录构建来源和依赖清单，在隔离环境扫描与转换，再由内部制品库发布。Safetensors 以仅存储张量的数据格式降低 Pickle 代码执行风险，但它不验证模型行为、来源或完整签名，因此只是供应链的一层。

## 展开说明

权重与执行代码应分开审查。若模型必须使用自定义代码，应固定源码版本、做代码审计并在无网络低权限环境加载；不能因为仓库知名就默认开启远程代码。Tokenizer 文件虽然通常不执行代码，却能改变特殊 Token、截断和模板，造成安全策略或评测失效。

Adapter 体积小但能显著改变行为。加载前要验证基座模型、目标模块、词表和许可证兼容性，并运行安全与能力回归。将未经审查的 Adapter 动态挂载到共享服务，可能影响其他租户或污染 KV Cache、日志和路由。

SLSA 等供应链框架强调来源证明、构建完整性和逐级控制。模型场景还要保存数据、训练代码、超参数和转换工具版本，才能追踪一个部署 Artifact 如何产生。

## 工程实践

只从允许来源拉取固定 Revision，下载后验证摘要，在隔离 CI 中禁网加载并扫描文件类型、压缩炸弹和自定义代码。优先使用安全张量格式，禁止生产直接加载任意 Pickle；生成 SBOM/模型清单和 Provenance，签名后推送内部只读仓库。部署门禁验证签名、许可证、基座兼容和安全回归，运行时使用只读文件系统与最小权限。

## 常见追问

1. **Safetensors 是否代表模型绝对安全？** 不是。它降低反序列化代码执行风险，但不保证权重无后门、来源可信或行为安全。
2. **为什么 Tokenizer 也要版本化？** Token ID、特殊标记和 Chat Template 变化会改变模型实际输入，并可能破坏训练、权限或评测假设。
3. **固定仓库名称为什么不够？** 分支和标签可能移动，应固定不可变 Commit 或内容摘要并验证签名。
4. **Adapter 为什么需要与完整模型同级审查？** 少量可训练权重也能改变拒答、工具选择和特定触发行为。

## 一句话复习

> 模型供应链安全要把权重、代码、Tokenizer 和 Adapter 都视为不可信制品，用固定版本、签名、隔离扫描和行为回归建立来源到部署的证据链。

## 参考资料

- [Hugging Face Safetensors：官方文档](https://huggingface.co/docs/safetensors/index)
- [SLSA：Supply-chain Levels for Software Artifacts Specification](https://slsa.dev/spec/)

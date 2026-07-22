---
title: '代码执行 Sandbox 应怎样做 Escape 与资源耗尽测试？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
study_tier: 'archive'
tags:
  - 'Sandbox'
  - '安全测试'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“沙箱攻击测试”：核心判断要明确，验证要可复现，并说明通过已知用例不代表不存在零日漏洞，高风险租户需更强隔离和持续补丁。

**可以这样答：**

> 测试文件系统、系统调用、网络、凭据、容器边界和 CPU、内存、进程数限制，并让控制平面可强制终止。具体例子是，运行 fork bomb、磁盘填满、内网探测和挂载逃逸的无害模拟。真正落地前还要检查，通过已知用例不代表不存在零日漏洞，高风险租户需更强隔离和持续补丁。

## 常见追问

1. **“沙箱攻击测试”最需要讲清的核心内容是什么？** 测试文件系统、系统调用、网络、凭据、容器边界和 CPU、内存、进程数限制，并让控制平面可强制终止
2. **哪项具体检查可以支撑你对“沙箱攻击测试”的判断？** 运行 fork bomb、磁盘填满、内网探测和挂载逃逸的无害模拟
3. **“沙箱攻击测试”最容易被忽略的前提是什么？** 通过已知用例不代表不存在零日漏洞，高风险租户需更强隔离和持续补丁

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

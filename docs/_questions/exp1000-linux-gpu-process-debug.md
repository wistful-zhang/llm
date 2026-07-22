---
title: 'Linux 上 GPU 被占满时怎样定位到进程和启动命令？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '简单'
tags:
  - 'Linux'
  - 'GPU'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“GPU 进程排查”：核心判断要明确，验证要可复现，并说明不要未经授权直接 kill，利用率低但占显存也可能是正常驻留服务。

**可以这样答：**

> 关键点是，先用设备工具查看 PID、显存和利用率，再通过 ps、proc 和容器信息确认用户、命令、父进程和资源归属。验证时可以这样做：制造已退出但仍有子进程持卡、容器 PID 映射等场景。但不要未经授权直接 kill，利用率低但占显存也可能是正常驻留服务。

## 常见追问

1. **“GPU 进程排查”最需要讲清的核心内容是什么？** 先用设备工具查看 PID、显存和利用率，再通过 ps、proc 和容器信息确认用户、命令、父进程和资源归属
2. **哪项具体检查可以支撑你对“GPU 进程排查”的判断？** 制造已退出但仍有子进程持卡、容器 PID 映射等场景
3. **“GPU 进程排查”最容易被忽略的前提是什么？** 不要未经授权直接 kill，利用率低但占显存也可能是正常驻留服务

## 延伸阅读

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)

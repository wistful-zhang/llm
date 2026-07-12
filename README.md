# LLM Interview Notes

一份持续更新的 LLM 面试题笔记，同时也是一个可以直接发布到 GitHub Pages 的网站。

## 内容方向

- LLM 基础：Transformer、注意力、位置编码、推理参数
- 训练与对齐：预训练、SFT、RLHF、DPO、LoRA
- RAG：切分、召回、重排、评估与优化
- Agent：工具调用、规划、记忆与可靠性
- 工程实践：推理服务、量化、缓存、监控与成本
- 系统设计：从需求澄清到完整方案

## 新增一道题

1. 复制 [`docs/_templates/question.md`](docs/_templates/question.md)。
2. 放到 `docs/_questions/`，文件名使用简短的英文，例如 `kv-cache.md`。
3. 填写题目、简答、展开说明和追问。
4. 本地提交并推送，GitHub Pages 会自动更新。

题目元数据示例：

```yaml
---
title: "为什么 KV Cache 能加速推理？"
category: "LLM 基础"
difficulty: "中等"
tags: [推理, Transformer]
date: 2026-07-12
---
```

## 发布网站

建议在 GitHub 上创建一个名为 `llm` 的仓库（与 `docs/_config.yml` 中的 `baseurl` 一致），然后进入：

`Settings → Pages → Build and deployment → Deploy from a branch`

选择 `main` 分支和 `/docs` 目录，保存即可。网站地址通常是：

`https://wistful-zhang.github.io/llm/`

如果使用其他仓库名，把 [`docs/_config.yml`](docs/_config.yml) 中的 `baseurl: "/llm"` 改成对应的 `baseurl: "/仓库名"`。

## 本地预览（可选）

GitHub Pages 会在云端构建，平时直接写 Markdown 即可。如果需要本地预览并且已经安装 Ruby：

```bash
cd docs
bundle install
bundle exec jekyll serve --baseurl=""
```

然后访问 `http://localhost:4000`。

## 目录结构

```text
.
├── README.md
└── docs/
    ├── _questions/     # 每道面试题一个 Markdown 文件
    ├── _templates/     # 新题模板
    ├── _layouts/       # 页面布局
    ├── assets/         # 样式和搜索脚本
    ├── index.html      # 网站首页
    └── _config.yml     # GitHub Pages / Jekyll 配置
```

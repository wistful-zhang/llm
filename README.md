# 大模型面经

一个可复用、可在线编辑、可自动发布的大模型面试题库。内容保存在自己的 GitHub 仓库中，通过 Pages CMS 使用中文表单编辑，并由 GitHub Actions 自动发布到 GitHub Pages。

## 特性

- 每道题一个独立文件，便于搜索、分类、版本管理和协作
- 中文表单填写题目、分类、难度、标签与日期
- 所见即所得的富文本解答编辑器，不要求掌握 Markdown
- 保存后自动提交到 GitHub，并触发网站更新
- 支持全文搜索、分类筛选、响应式页面与题目详情页
- 不绑定用户名、仓库名或固定域名，适用于任何 GitHub 账号
- 同时支持公开分享与私人笔记两种使用模式

## 创建自己的题库

推荐使用模板，而不是 Fork：

1. 在仓库页面点击 **Use this template → Create a new repository**。
2. 选择自己的 GitHub 账号、仓库名称和可见性。
3. 公共题库：选择 **Public**，然后在 `Settings → Pages` 中把 Source 设置为 **GitHub Actions**。
4. 私人题库：选择 **Private**，并且不要启用公开 Pages。
5. 打开 [Pages CMS](https://app.pagescms.org/)，用 GitHub 登录。
6. 安装 GitHub App 时选择 **Only select repositories**，只授权自己的题库仓库。
7. 在“站点设置”中修改网站名称和介绍，在“面试题与解答”中新增内容。

GitHub Actions 会自动识别账号和仓库名，因此不需要手动修改 `baseurl`、用户名或网站路径。

## 公开与私有

| 使用方式 | 仓库 | 网站 | 适合场景 |
| --- | --- | --- | --- |
| 公开分享 | Public | 启用 GitHub Pages | 面经分享、作品展示、社区协作 |
| 私人笔记 | Private | 不启用 Pages | 个人复习、包含非公开内容的笔记 |
| 企业内部 | Private / Internal | Enterprise Cloud 私有 Pages | 企业内部知识库 |

重要提示：私有仓库不自动代表 Pages 网站也是私有的。除 GitHub Enterprise Cloud 提供的私有 Pages 访问控制外，请把发布到 Pages 的内容视为公开信息。不要上传密码、Token、个人隐私、公司机密或受保密协议约束的题目。

另外，公共仓库的 Fork 仍然是公共仓库，不能改成私有。如果想建立独立的私人题库，请使用 **Use this template** 创建私有仓库。

## 在线管理

网站右上角的“管理题库”会进入通用的 Pages CMS 管理页。只有获得目标仓库写入权限的 GitHub 用户才能保存；普通访客只能浏览公开题库。

后台包含两个入口：

- **面试题与解答**：新增、修改或删除题目
- **站点设置**：修改网站名称、介绍、首页文案和页脚

## 手动新增题目

不使用 CMS 时，也可以复制 [`docs/_templates/question.md`](docs/_templates/question.md) 到 `docs/_questions/`。题目元数据示例：

```yaml
---
title: "为什么 KV Cache 能加速推理？"
category: "LLM 基础"
difficulty: "中等"
tags: [推理, Transformer]
date: 2026-07-13
---
```

## 本地预览

安装 Ruby 与 Bundler 后：

```bash
cd docs
bundle install
bundle exec jekyll serve --baseurl=""
```

访问 `http://localhost:4000`。

## 项目结构

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/       # 提交题目和问题的表单
│   └── workflows/pages.yml   # 自动构建与发布
├── .pages.yml                # Pages CMS 中文表单配置
├── docs/
│   ├── _data/settings.yml    # 可视化站点设置
│   ├── _questions/           # 面试题内容
│   ├── _templates/           # 手动新增模板
│   ├── _layouts/             # 页面布局
│   └── assets/               # 样式与搜索脚本
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## 参与贡献

如果要改进当前公共题库，可以提交 Issue 或 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。如果是建立自己的题库，请使用模板创建独立仓库。

## License

项目代码与示例内容采用 [MIT License](LICENSE)。提交内容即表示你有权公开该内容，并同意按此许可证分发。


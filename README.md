# 大模型面经

一个可复用、可在线编辑、可自动发布的大模型面试准备与复盘项目。题库内容保存在自己的 GitHub 仓库中，通过 Pages CMS 使用中文表单编辑，并由 GitHub Actions 自动发布到 GitHub Pages；网站还支持随机模拟、薄弱题复盘和仅保存在浏览器中的真实面试进度记录。

## 特性

- 每道题一个独立文件，便于搜索、分类、版本管理和协作
- 中文表单填写题目、分类、难度、标签与日期
- 所见即所得的富文本解答编辑器，不要求掌握 Markdown
- 保存后自动提交到 GitHub；Public 仓库中通过发布校验的题目会自动进入阅读网站
- 题目公开与答案完成分开控制：可以先只发布问题，稍后用 Codex 或网页编辑器补答案
- 支持全文搜索、分类筛选、响应式页面与题目详情页
- 单题页支持最长 60 秒口述模式，先隐藏答案练习，再对照该题的参考说法和追问复盘
- 支持按分类、难度随机抽题，计时口述、自我评价和薄弱题重练
- 未完成练习可在当前浏览器恢复，练习结果不会写入 GitHub
- 支持记录真实面试的公司匿名代号、岗位、多轮进度、结果、下一步和复盘
- 自动区分已面公司数、面试轮次、进行中流程和 Offer 数，同公司多轮不会重复计算公司
- 个人面试记录默认只保存在当前浏览器，支持 JSON 备份恢复和 CSV 导出，不写入公开仓库
- 自定义分类会自动出现在首页筛选栏，不需要修改模板
- 后台可修改网站名称、介绍、首页两行标题、主题配色和页脚
- 自动校验题目标题、分类、难度、日期和答案内容
- 内置题目带“资料核验”标记，包含可直接口述的回答、带接法的追问，并在题解末尾列出公开面经线索与一手技术资料
- 不绑定用户名、仓库名或固定域名，适用于任何 GitHub 账号
- 同时支持公开分享与私人笔记两种使用模式
- 面试后可只填题目：既可以保存为个人草稿，也可以公开为“待解答”问题

## 创建自己的题库

推荐使用模板，而不是 Fork：

不熟悉 GitHub 的用户可以在网站顶部点击“使用”，按照 6 张操作示意图完成公开 / 私有选择、Pages 配置和后台新增题目；未发布网站时，直接按下面的步骤操作。

1. 在仓库页面点击 **Use this template → Create a new repository**。
2. 选择自己的 GitHub 账号、仓库名称和可见性。
3. 公开题库：选择 **Public**，然后在 `Settings → Pages` 中把 Source 设置为 **GitHub Actions**。
4. 私有题库：选择 **Private**，并且不要启用公开 Pages。
5. 打开 [Pages CMS](https://app.pagescms.org/)，用 GitHub 登录。
6. 安装 GitHub App 时选择 **Only select repositories**，只授权自己的题库仓库。
7. 在“站点设置”中修改网站名称和介绍，在“面试题与解答”中新增内容。

GitHub Actions 会自动识别账号和仓库名，因此不需要手动修改 `baseurl`、用户名或网站路径。

如果希望别人也能从你的新题库继续创建独立副本，可以在仓库 **Settings → General** 中开启 **Template repository**。网页中的模板按钮会优先寻找最初的模板来源，不会写死某个用户名。

## 公开与私有

| 使用方式 | 仓库 | 网站 | 适合场景 |
| --- | --- | --- | --- |
| 公开分享 | Public | 启用 GitHub Pages | 面经分享、作品展示、社区协作 |
| 私有笔记 | Private | 不启用 Pages | 个人复习、包含非公开内容的笔记 |
| 企业内部 | Private / Internal | Enterprise Cloud 私有 Pages | 企业内部知识库 |

重要提示：私有仓库不自动代表 Pages 网站也是私有的。除 GitHub Enterprise Cloud 提供的私有 Pages 访问控制外，请把发布到 Pages 的内容视为公开信息。另一个常见误区是：`published: false` 只会让题目不出现在阅读网站；如果仓库是 Public，草稿源文件仍公开可见。不要上传密码、Token、个人隐私、公司机密或受保密协议约束的题目。

另外，公开仓库的 Fork 仍然是公开仓库，不能改成私有。如果想建立独立的私有题库，请使用 **Use this template** 创建私有仓库。

## 在线管理

公开题库可以从网站顶部的“网页编辑”进入 Pages CMS。私有题库没有公开网站入口，请直接收藏 [Pages CMS](https://app.pagescms.org/)。只有获得目标仓库写入权限的 GitHub 用户才能保存。

推荐把“题目是否公开”和“答案是否完成”分开管理：

- **只给自己速记**：只填题目，保持“在阅读网站显示这道题”关闭
- **只发布问题**：打开网站显示开关，答案状态保持“待解答”；页面会提供复制给 Codex 的补答指令
- **稍后补答案**：补完后把分类和难度改为正式值、复习状态改好，再把答案状态改为“已完成”
- **整理 / 复习状态**：手动使用“待整理 / 待复习 / 已掌握”管理进度；模拟面试自评不会改写题目文件
- **站点设置**：修改网站名称、介绍、首页文案、主题配色和页脚

第一次完成 GitHub App 授权后，日常维护不需要打开源码。只有修改页面布局、开发新功能或排查底层构建故障时才需要查看代码。

## 真实面试记录与隐私

网站顶部的“记录”用于保存真实求职进度。一条记录代表一个面试轮次，同一家公司同一岗位的多轮记录会归入同一流程；统计中的“已面公司”按公司名称或匿名代号去重，预约和取消不会被算作已经面试。

这些记录使用浏览器本地存储，不会提交到 GitHub，也不会被同一公开网站的其他访问者看到。它不是云同步：换设备、清理浏览器或更换仓库地址前，请导出 JSON 备份，在新设备上使用“恢复 JSON”合并数据。共享电脑上的同一浏览器用户仍可能看到本地内容，因此建议使用公司匿名代号，不要保存面试官姓名、联系方式、会议链接、精确薪资、公司机密或受 NDA 约束的信息。

## 手动新增题目

不使用 CMS 时，也可以复制 [`docs/_templates/question.md`](docs/_templates/question.md) 到 `docs/_questions/`。题目元数据示例：

```yaml
---
title: "为什么 KV Cache 能加速推理？"
source: "自己的面试速记或公开资料整理"
verified: false
category: "LLM 基础"
difficulty: "中等"
tags: [推理, Transformer]
review_status: "待复习"
published: true
answer_status: complete
date: 2026-07-13
---
```

手动复制模板时，请把日期改成当天的 `YYYY-MM-DD`；忘记修改占位日期时，内容校验会给出明确错误。

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
├── scripts/validate-content.mjs # 题目内容自动校验
├── docs/
│   ├── _data/settings.yml    # 可视化站点设置
│   ├── _questions/           # 面试题内容
│   ├── _templates/           # 手动新增模板
│   ├── _layouts/             # 页面布局
│   ├── practice.html          # 随机模拟面试与复盘页面
│   ├── interviews.html        # 本地面试进度、统计与备份页面
│   └── assets/                # 样式、搜索、模拟与面试记录脚本
├── tests/                     # 随机抽题和状态恢复测试
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## 参与贡献

如果要改进当前公开题库，可以提交 Issue 或 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。如果是建立自己的题库，请使用模板创建独立仓库。

## License

模板代码与示例内容采用 [MIT License](LICENSE)。你在自己仓库新增的笔记由你管理；只有向本项目提交 Issue 或 Pull Request 的内容，才需要确认拥有公开和分发权限。


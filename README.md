# 大模型面经

一个可复用、可在线编辑、可自动发布的大模型面试准备与复盘项目，内置 1000 道可检索、可随机练习的题目。可以直接在网站 UI 中快速记题并保存为浏览器本机草稿，不要求 Markdown；需要同步时，再交给 Codex、GitHub 或 Pages CMS 写入仓库草稿，审核后才公开到阅读网站。网站还支持随机模拟、薄弱题复盘和仅保存在浏览器中的真实面试进度记录。

## 先选你的使用方式

| 你的目标 | 最短路径 |
| --- | --- |
| 只想刷题和模拟面试 | 当前模板可从仓库右侧 **Website** 进入；自己的 Public 副本从 `Settings → Pages → Visit site` 进入，不需要站内账号 |
| 想马上记下一道题 | 打开网站“＋记题”，使用普通文字填写并保存到当前浏览器；无需后台，答案可以留空 |
| 想记录真实面试 | 打开网站的“面试记录”，数据只保存在当前浏览器，可导出 JSON |
| 想建立自己的题库 | 点击仓库顶部 **Use this template**，不要使用 Fork 保存私人题目 |
| 只想提交一道问题 | 使用 [题目 Issue 表单](../../issues/new?template=question.yml)，答案可以留空 |
| 想改进模板或当前题库 | 阅读 [参与贡献](CONTRIBUTING.md)，通过 Issue 或 Fork + Pull Request 提交 |

模板副本自带当前完整题库，可以直接练习，再继续添加自己的题目。当前模板版本见 [`TEMPLATE_VERSION`](TEMPLATE_VERSION)；副本是独立仓库，不会自动收到基础模板后续更新，长期使用前请阅读[更新记录](CHANGELOG.md)和[升级指南](UPGRADING.md)。

## 特性

- 每道题一个独立文件，便于搜索、分类、版本管理和协作
- 站内“＋记题”支持普通表单、本机 CRUD、搜索、口述练习、JSON 备份和安全 Markdown 导出，不必先进入后台
- 中文表单填写题目、分类、难度、标签与日期
- 所见即所得的富文本解答编辑器，不要求掌握 Markdown
- 在 Pages CMS 中保存后自动提交到 GitHub；Public 仓库中通过发布校验的题目会自动进入阅读网站
- 题目公开与答案完成分开控制：可以先只发布问题，稍后用 Codex 或网页编辑器补答案
- 支持全文搜索、分类、难度和答案核验状态筛选；千题列表分批显示，答案索引按需加载
- 单题页支持最长 60 秒口述模式，先隐藏答案练习，再对照该题的参考说法和追问复盘
- 支持按分类、难度随机抽题，计时口述、自我评价和薄弱题重练
- 未完成练习可在当前浏览器恢复，练习结果不会写入 GitHub
- 支持记录真实面试的公司匿名代号、岗位、多轮进度、结果、下一步和复盘
- 每个面试流程可选择“仅当前浏览器”或“准备匿名分享”；默认不上传，分享仍需匿名预览和二次确认
- 自动区分已面公司数、面试轮次、进行中流程和 Offer 数，同公司多轮不会重复计算公司
- 个人面试记录默认只保存在当前浏览器，支持 JSON 备份恢复和 CSV 导出，不写入公开仓库
- 自定义分类会自动出现在首页筛选栏，不需要修改模板
- 后台可修改网站名称、介绍、首页两行标题、主题配色和页脚
- 自动校验题目标题、分类、难度、日期和答案内容，并从源 Markdown、隐私规则、构建后 HTML 与浏览器 CSP 多层拦截危险公开内容
- 内置 232 道“资料核验”题和 768 道“答案待复核”扩展题；两者都包含可直接口述的回答与带接法的追问，网页不会混淆核验状态
- 不绑定用户名、仓库名或固定域名，适用于任何 GitHub 账号
- 同时支持 Public 公开分享与 Private 仓库编辑；Private 模式不部署在线阅读或随机模拟页面
- 面试后可只填题目：可以保存为 Private 仓库草稿，也可以在 Public 题库公开为“待解答”问题

## 创建自己的题库

推荐使用模板，而不是 Fork：

不熟悉 GitHub 的用户可以在网站顶部点击“创建题库”，按照 6 张操作示意图完成公开 / 私有选择、Pages 配置和后台新增题目；未发布网站时，直接按下面的步骤操作。

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
| 私有笔记 | Private | 不启用 Pages | 通过 Pages CMS 编辑个人笔记；不提供在线浏览和随机模拟 |
| 企业内部 | Private / Internal | Enterprise Cloud 私有 Pages | 企业内部知识库 |

重要提示：私有仓库不自动代表 Pages 网站也是私有的。除 GitHub Enterprise Cloud 提供的私有 Pages 访问控制外，请把发布到 Pages 的内容视为公开信息。另一个常见误区是：`published: false` 只会让题目不出现在阅读网站；如果仓库是 Public，草稿源文件仍公开可见。不要上传密码、Token、个人隐私、公司机密或受保密协议约束的题目。

另外，公开仓库的 Fork 仍然是公开仓库，不能改成私有。如果想建立独立的私有题库，请使用 **Use this template** 创建私有仓库。

## 在线管理

日常速记优先使用网站顶部的“＋记题”：题目直接保存到当前浏览器，不进入公开题数或随机模拟，也不会自动上传 GitHub。需要同步时，页面会替你生成 Markdown 和投稿内容；你不必学习格式，但仍要在 GitHub 完成身份确认与 Commit，或把“写入仓库草稿”指令交给已打开自己仓库的 Codex。生成文件保持 `published: false`，审核后才决定是否展示。纯静态 Pages 无法在没有授权的情况下安全写仓库，因此本站不会要求你粘贴密码、PAT 或 Token。

公开题库的主人需要批量修改正式题目时，可以从“站主管理”进入 Pages CMS；普通访客应使用“投稿与纠错”，不会获得管理权限。私有题库没有公开网站入口，请直接收藏 [Pages CMS](https://app.pagescms.org/)。只有获得目标仓库写入权限的 GitHub 用户才能把内容保存进仓库。

推荐把“题目是否公开”和“答案是否完成”分开管理：

- **只给自己速记**：先用“＋记题”保存为当前浏览器草稿；需要跨设备同步到 GitHub 时使用 Private 仓库。Public 仓库中即使关闭网页发布开关，源文件仍公开
- **只发布问题**：打开网站显示开关，答案状态保持“待解答”；页面会提供复制给 Codex 的补答指令
- **稍后补答案**：补完后把分类和难度改为正式值、复习状态改好，再把答案状态改为“已完成”
- **整理 / 复习状态**：手动使用“待整理 / 待复习 / 已掌握”管理进度；模拟面试自评不会改写题目文件
- **站点设置**：修改网站名称、介绍、首页文案、主题配色和页脚

“复制给 Codex 的补答指令”不代表任何 AI 都能自动修改 GitHub。Codex 打开你自己的题库仓库并拥有工作区写权限后，可以直接修改文件和校验；要继续同步 GitHub，还必须已经完成 GitHub 身份验证，并对远端仓库有写权限。使用普通 AI，或任一条件不满足时，请先生成答案，再粘贴回 Pages CMS，手动更新答案状态并保存。

第一次完成 GitHub App 授权后，日常维护不需要打开源码。只有修改页面布局、开发新功能或排查底层构建故障时才需要查看代码。

Pages CMS 获得授权后可以读取和修改所选仓库，并可能缓存配置、内容和权限信息；Private 仓库内容也会经过该第三方服务。建议只授权题库仓库，并在 GitHub 的 `Settings → Applications → Installed GitHub Apps` 中定期复查或撤销。不使用 Pages CMS 时，可以直接在 GitHub 网页编辑器中复制题目模板维护。

## 真实面试记录与隐私

网站顶部的“记录”用于保存真实求职进度。一条记录代表一个面试轮次，同一家公司同一岗位的多轮记录会归入同一流程；统计中的“已面公司”按公司名称或匿名代号去重，预约和取消不会被算作已经面试。

快速记题草稿和面试记录都使用浏览器本地存储，不会提交到 GitHub，也不会自动出现在其他访问者的页面里。它不是账号隔离、加密或云同步：同一浏览器资料中的其他使用者，以及同一 `username.github.io` Origin 下的其他项目脚本，理论上可能读取同源存储。换设备、清理浏览器、更换仓库地址，或从当前公开站点切换到自己的网站前，请分别导出题目和面试记录 JSON，再在目标站点恢复。Private 仓库不会部署记录页面；可以继续使用当前公开记录页，或在自己的电脑上本地预览，但浏览器记录不会因此写入 Private 仓库。完整边界见[隐私说明](docs/privacy.md)。

本地记录默认是私人求职数据。只有把经历匿名化、确认不含个人隐私、公司机密、未授权题库或 NDA 内容，并明确整理发布后，才应作为公开面经分享。关闭题目的网页发布开关不等于私密：如果题库仓库是 Public，未发布的源文件仍可被看到。共享电脑上的同一浏览器用户也可能看到本地记录，因此建议使用公司匿名代号，不要保存面试官姓名、联系方式、会议链接或精确薪资。

需要分享时，把对应流程的分享计划改为“准备匿名分享”，使用页面生成的不含公司名称、精确日期、来源、下一步、自评和私人复盘的匿名草稿，再到 Pages CMS 的“匿名公开面经”表单中检查、补充并确认发布。公开面经会进入 `/experiences/`；选择准备分享只会增加整理入口，不会绕过二次确认。

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

修改脚本、模板或内容校验时，可在仓库根目录运行：

```bash
npm run check
```

维护千题扩展批次时，先运行 `npm run questions:expand:check`，生成 Markdown 后再用 `npm run questions:audit` 复核疑似同义题。批次格式和核验边界见 [`scripts/question-batches/README.md`](scripts/question-batches/README.md)。

## 项目结构

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/       # 提交题目和问题的表单
│   └── workflows/pages.yml   # 自动构建与发布
├── .pages.yml                # Pages CMS 中文表单配置
├── scripts/validate-content.mjs # 题目与公开面经内容校验
├── docs/
│   ├── _data/settings.yml    # 可视化站点设置
│   ├── _questions/           # 面试题内容
│   ├── _experiences/         # 明确确认后发布的匿名面经
│   ├── _templates/           # 手动新增模板
│   ├── _layouts/             # 页面布局
│   ├── practice.html          # 随机模拟面试与复盘页面
│   ├── interviews.html        # 本地面试进度、统计与备份页面
│   ├── experiences.html       # 匿名公开面经列表
│   └── assets/                # 样式、搜索、模拟与面试记录脚本
├── tests/                     # 随机抽题和状态恢复测试
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## 参与贡献

如果要改进当前公开题库，可以提交 Issue 或 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。如果是建立自己的题库，请使用模板创建独立仓库。

题库主人、可信编辑和普通贡献者的权限不同：主人和明确授权的编辑可以通过 Pages CMS 直接写入仓库；普通贡献者不需要写权限，应使用 Issue 或 Fork + Pull Request。不要为了收集投稿而把 Pages CMS 写权限授予陌生人。

## 独立副本与升级

Use this template 创建的是独立历史，适合自己的公开或私有题库；Fork 保留与当前公开仓库的关系，适合贡献代码和内容，但不适合私人笔记。副本不会自动收到更新，升级时必须保护 `docs/_questions/`、`docs/_experiences/` 和 `docs/_data/settings.yml`，具体见 [UPGRADING.md](UPGRADING.md)。

## License

当前仓库的模板代码与内置公开题库采用 [MIT License](LICENSE)。你在独立副本中新增的笔记仍由你决定授权方式；为了避免根目录许可证造成歧义，建议在自己的 README 中明确个人内容许可证。向本项目提交 Issue 或 Pull Request，表示你确认拥有公开和分发权限，并同意项目按 MIT License 收录该贡献。


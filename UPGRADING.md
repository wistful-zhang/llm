# 升级自己的题库副本

通过 **Use this template** 创建的题库是完全独立的仓库，不会自动获得基础模板后续的安全修复和新功能。这是 GitHub 模板的正常行为，不是部署故障。

## 升级前先保护数据

1. 分别在“＋题目”和“面试记录”中导出 JSON；这些浏览器数据不在 GitHub 仓库里。
2. 确认自己的题目、匿名公开面经和站点设置已经提交到 GitHub。
3. 给仓库建立一个备份分支，或从 GitHub 下载 ZIP。
4. 在单独升级分支中操作，通过 Pull Request 检查差异，不要直接覆盖默认分支。

这些路径通常属于你自己的内容，升级时不要整目录替换：

- `docs/_questions/`
- `docs/_experiences/`
- `docs/_data/settings.yml`

从 1.1.x 升级到 1.2.0 时，千题扩展会新增大量 `docs/_questions/exp1000-*.md`。如果你的副本已经有同名文件或不希望带入整套扩展题，请只合并首页筛选、脚本和样式改动；不要覆盖自己的 `docs/_questions/`。新增题标记为“参考答案待校对”，不会改变你原有题目的核验状态。

从 1.2.x 升级到 1.3.0 时，需要一起复制 `docs/community.html`、`docs/assets/js/community*.{js,mjs}`、两个新的 Issue Form、布局和样式改动。社区入口会自动读取副本自己的 `site.github.repository_nwo`，不需要填写原仓库用户名。请确认副本已启用 Issues；Public 仓库可在站内展示动态，Private 仓库成员需要直接在 GitHub 中查看和评论。

从 1.3.x 升级到 1.4.0 时，独立社区入口会被题目内协作替代。请一起复制 `question-collaboration-core.mjs`、`question-comments.js`、`public-questions.js`、两个新 Issue Form，以及题目布局、首页、增加题目页和样式改动；删除旧 `community*.js`、`community-question.yml` 和 `question-review.yml`。在 Public 仓库中创建 `public-question` 与 `question-comments` 标签并保持 Issues 开启。旧本机题目缺少 `visibility` 时会自动按“只留给自己”读取，不需要手工迁移 JSON。

从 1.4.x 升级到 1.5.0 时，新增的 `study_tier` 只表示备考顺序。如果要保留自己的题目，不要整目录覆盖 `docs/_questions/`；可以为每道题补上 `core`、`role`、`extended` 或 `archive`，也可先留空，旧题会兼容为“未分级”。请一起合并首页、模拟面试、题目布局、样式、`.pages.yml`、校验器和 `scripts/question-study-tier.mjs`；新题会默认进入 `archive`，避免未整理内容直接进入核心路径。

从 1.5.x 升级到 1.6.0 时，请一起合并 `docs/_data/study_tracks.yml`、首页、学习分级页、模拟面试脚本、样式和 `scripts/question-study-tier.mjs`。基础题库把 40 道深题从 `core` 调整为 `role`；如果你已经维护自己的分级，可以只采用路线与筛选代码，不覆盖 `docs/_questions/`。网页新题导出会补上 `study_tier: archive`，旧的浏览器 JSON 无需迁移。

从 1.6.x 升级到 1.7.0 时，上游主题库会移除 768 个 `exp1000-*.md` 批量扩展题，只保留 232 道资料核验题。不要直接删除自己后来编辑、补充来源或改名的题目；先给仓库打标签并导出备份，再按自己的核验状态决定是否精简。上游原始 1000 题保存在 `questions-1000-snapshot-2026-08-06` 标签和对应 Release 中，详见 `QUESTION_ARCHIVE.md`。

从 1.7.x 升级到 1.8.0 时，请先在旧站点的“＋题目”导出 JSON，再一起合并记题页、首页、本机题目脚本、`question-drafts-core.mjs`、题目布局、搜索索引、`.pages.yml`、安全解析器、样式和测试。数据格式会从 schema v1 自动迁移到 v2，但 localStorage key 故意仍以 `question-drafts:v1` 结尾，确保浏览器能找到既有题目；不要手工改 key。新版本写回 v2 后，旧版页面会安全拒绝读取而不会覆盖追问，因此不要在升级后继续同时使用旧页面编辑同一份浏览器数据。

1.8.0 的“发布到我的题目”表示保存后立即进入当前浏览器的首页题目区，不代表静态 Pages 已经获得 GitHub 写权限。若要让其他人或其他设备看到，仍需从题目卡同步到自己的 GitHub 仓库并完成网站发布。正式题目新增 `followups` 扁平字符串列表；已有题目的正文 `## 常见追问` 不需要迁移或拆分。

从 1.8.0 升级到 1.8.1 不需要迁移本机数据。请一起合并 `latex-input-core.mjs`、记题页与脚本、公式渲染脚本、题目布局、样式和公式校验器；新版本会为用户输入启用 MathJax 安全过滤。公式源码仍使用成对 `$$`，既有题目无需改写。

1.6.0 当时把题目评论改为正文下方的内嵌输入框，并使用 [utterances](https://github.com/apps/utterances) 显示 GitHub Issue 回复。这段只用于识别旧副本：该方案已经退役，不要再为新副本安装评论应用。旧 Issue 和回复仍保留在 GitHub，但不会自动出现在新的站内评论数据库中。

## 升级到下一版本的站内评论（尚未发布）

下一版本把正式题目的评论从 GitHub Issues 迁移为题库主人自行部署的 Cloudflare Worker + D1 + Turnstile。升级时需要一起合并 `comments-worker/`、`docs/comment-setup.md`、`docs/assets/js/question-comments.js`、`docs/assets/js/native-comments-core.mjs`、`docs/_layouts/question.html`、`docs/_layouts/default.html`、`docs/_data/comment_runtime.yml`、`scripts/build-comments-config.mjs`、发布工作流、CSP、样式和相关测试，再按“站内评论开通”页面完成部署。

每个模板副本或 Fork 都必须在自己的 Cloudflare 账号中创建 Worker 和 D1，并在自己的仓库 Actions Variables 中设置 `COMMENTS_API_URL`。不要复制上游仓库构建出的运行时地址；变量留空时页面不会连接任何后端，也不会回退到原作者的评论库。Private / Internal 题库应保持评论关闭。

旧 GitHub Issue 评论不会自动迁移到 D1。需要保留时，应由题库主人先导出、确认作者授权和隐私边界，再制定单独迁移方案；不要把 GitHub 用户名直接冒充为新站内昵称。公开增加题目仍使用 GitHub Issue Form，因此 Public 题库若保留公开补题功能，Issues 仍需开启；这与正式题目下方的站内评论是两条独立路径。

## 推荐升级方法

先在自己仓库标题下方寻找 **generated from**，它指向创建副本时使用的基础模板。若看不到该标记，请从自己保存的创建记录、README 或可信维护者说明确认来源；不要把名称相似的陌生仓库直接当成上游。

1. 对比自己仓库与基础模板的 `TEMPLATE_VERSION`，再查看近期 Release、提交说明和 `CHANGELOG.md`。
2. 只复制需要的布局、脚本、样式、工作流、校验器和测试改动。
3. 如果数据格式版本发生变化，先阅读对应迁移说明。
4. 运行 `npm run check`，再通过 Pull Request 合并。
5. 合并后确认 GitHub Actions 全部绿色，并实际打开题库、增加题目、题目评论、模拟面试和面试记录页检查。

模板仓库与个人副本的 Git 历史彼此独立，直接 `git merge` 上游通常不适合新手。没有把握时，可以保留现有稳定版本，或让 Codex 在你的仓库中对照上游改动并保护上述内容目录。

## 仓库改名或转移 Owner

本机题目、面试记录和练习进度会按仓库标识隔离。改名或转移前先分别导出题目与面试记录 JSON；新网址上线后再恢复。公开网站地址改变时，也要检查 README、仓库 Website 和分享链接。

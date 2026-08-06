# 题目归档说明

当前主题库只保留 232 道逐题附有参考资料、标记为 `verified: true` 的题目。此前 768 道 `exp1000-*.md` 批量扩展题只有类别级通用“延伸阅读”，尚未逐题核对答案和资料，已于 2026-08-06 从主分支移出。

这些题没有丢失：

- [GitHub 固定标签](../../tree/questions-1000-snapshot-2026-08-06)：`questions-1000-snapshot-2026-08-06`
- [同名 GitHub Release](../../releases/tag/questions-1000-snapshot-2026-08-06)：提供 768 题 ZIP 和带 SHA-256 的清单
  - `unverified-questions-768.zip`：`D1302FDACB3C4C9088DD47D16991C83786BE7FEC495FD9AA5814795DF3388502`
  - `manifest.csv`：`307F7827AAFFE45DDB3B4F434706F1E785681B7013D0B1F07DAB38B6FEE31D54`
- 本地维护者备份：`backups/题库归档-2026-08-06/`

本项目把该标签和 Release 作为固定快照，维护时不应移动或删除；它们不会随主分支继续建题而变化。模板副本只包含当前活跃题库，不会自动复制原项目的标签或 Release 资产。

## 恢复单题

先从 Release 的 ZIP 取出对应 Markdown，或在原仓库执行：

```powershell
git restore --source=questions-1000-snapshot-2026-08-06 -- docs/_questions/具体文件名.md
```

取回后先把文件从 `exp1000-原文件名.md` 重命名为不带 `exp1000-` 的正常文件名，并把 frontmatter 设为 `published: false`、`verified: false`、`study_tier: archive`，避免旧批次未经整理就进入公开题库。逐题核对题目来源、答案事实和对应的一手资料，并按当前格式补齐“面试时怎么答 / 核心回答 / 展开说明 / 工程实践 / 常见追问 / 一句话复习 / 参考资料”七个章节后，才能改为 `verified: true`；最后再决定是否发布、放入哪个学习层级，并运行 `npm run check`。

## 恢复全部题目

不推荐一次性恢复。确有需要时，先新建分支，再执行：

```powershell
git restore --source=questions-1000-snapshot-2026-08-06 -- ':(glob)docs/_questions/exp1000-*.md'
git status --short
```

这一步只适合在独立归档分支中查阅或导出。恢复只表示把文件取回，不代表内容已经核验，也不应直接合并进公开主题库；主库检查会继续拦截 `exp1000-` 旧批次文件，确需重新采用时请按上面的单题流程整理。

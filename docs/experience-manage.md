---
title: 分享匿名面经
description: 把浏览器中的私人面试记录安全整理成可以公开分享的匿名面经。
permalink: /experiences/manage/
---

<div class="container prose standalone-page experience-manage-page" markdown="1">

<span class="status-badge">默认私有 · 明确确认后才公开</span>

# 分享匿名面经

“面试记录”里的公司、进度和复盘始终先保存在当前浏览器。把可见性改成“可整理公开”也不会自动上传；它只会出现一个整理入口，避免误操作泄露私人求职数据。

<div class="privacy-warning" markdown="1">

**真正私密的内容不要进入 Public 仓库。** 即使关闭“在公开网站显示”，源文件仍可能在 GitHub 中被看到。面试官姓名、联系方式、会议链接、截图、精确薪资、内部评价、公司机密和受 NDA 约束的题目不要发布。

</div>

## 私有和公开分别保存在哪里

| 模式 | 保存位置 | 谁能看到 |
| --- | --- | --- |
| 仅自己 | 当前浏览器的本地存储 | 使用同一浏览器资料的用户 |
| 可整理公开 | 仍在当前浏览器；只增加整理入口 | 仍然只有本机用户 |
| 已公开 | 自己的 GitHub 仓库和公开网页 | 互联网访问者 |

## 安全发布四步

1. 在“面试记录”中把某个流程设为“可整理公开”，保存后点击“整理公开面经”。
2. 检查生成的公开草稿。系统不会带入匿名来源、下一步、精确日期、自评分或私人复盘；公司默认写成“某公司”。
3. 打开 [Pages CMS](https://app.pagescms.org/)，进入自己的仓库，再进入“匿名公开面经”并点击 **Add an entry**。公司只能填写匿名代号，面试时间只填写月份，不保存具体日期。
4. 用中文表单填写或粘贴公开内容，确认“内容已匿名，并且有权公开”，最后再打开“在公开网站显示这篇面经”并保存。

## 取消已经公开的面经

把浏览器中的记录改回“仅自己”，只会关闭本地的公开整理入口，不会改动 GitHub 上已经发布的文章。要下线文章，请在 Pages CMS 的“匿名公开面经”中找到它，关闭“在公开网站显示这篇面经”并保存；如果还要从 Public 仓库当前版本中移除源文件，请直接删除这条面经。Git 历史仍可能保留旧版本，因此敏感内容不应先发布再撤回。

<div id="publish-experience" class="capture-panel" markdown="1">

## 打开可视化发布表单

不需要写 Markdown，也不要把浏览器中的整份 JSON 上传到仓库。Pages CMS 只负责你主动整理后的公开版本。

<a class="primary-button cms-button" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">打开 Pages CMS 发布匿名面经 ↗</a>
<a class="secondary-button" href="{{ '/interviews/' | relative_url }}">返回面试记录</a>

</div>

## 使用 Codex 帮忙整理

Codex 打开你自己的仓库并拥有工作区写权限后，可以直接新增面经文件并校验；要继续同步 GitHub，还必须已经完成 GitHub 身份验证，并对远端仓库有写权限。任一条件不满足时，请让 AI 只生成匿名正文，再把结果粘贴到 Pages CMS 表单中，由你最终确认公开。

</div>

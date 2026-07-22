---
title: 站主管理与网页编辑
permalink: /manage/
---

<div class="container prose standalone-page manage-page onboarding-page" markdown="1">

<span class="status-badge">无需源码 · 表单编辑</span>

# 在网页上记录自己的面经

<div class="owner-notice" role="note">
  <strong>这是题库主人的编辑入口，不是本站投稿表单。</strong>
  <span>只有拥有目标仓库写入权限的 GitHub 用户才能保存；其他访客可以创建自己的题库，或从面经社区公开投稿和评论。</span>
</div>

只想快速记下一道题时，不必进入这里：使用[站内快速记题]({{ '/capture/' | relative_url }})，先保存到当前浏览器，整理好后再决定是否发布。本页更适合批量管理已经进入 GitHub 仓库的正式题目。

Pages CMS 会把所有内容显示成中文表单。日常记题、补答案和发布不需要打开源码，也不需要 Git 命令。

公司、岗位、面试结果和个人复盘属于个人求职数据，推荐使用[面试记录]({{ '/interviews/' | relative_url }})：它默认只保存在当前浏览器，不会写入 GitHub。只有经过匿名化整理、确认可以分享，并且你明确发布的面经或题目才应公开；这里的 Pages CMS 负责题目、答案和匿名公开面经。注意：关闭网页发布只是不在阅读网站显示，Public 仓库中的未发布源文件仍然可见。准备分享完整经历时，请先阅读[匿名面经发布步骤]({{ '/experiences/manage/' | relative_url }})。

<nav class="journey-grid" aria-label="选择操作">
  <a class="journey-card" href="{{ '/interviews/' | relative_url }}"><strong>记录一次面试</strong><span>保存公司代号、岗位、轮次、结果和复盘，自动统计公司数。</span><b>打开本地记录 →</b></a>
  <a class="journey-card" href="#question-only-workflow"><strong>记录一道题</strong><span>Private 仓库可个人速记；Public 仓库可先公开问题、以后再补答案。</span><b>查看记题流程 →</b></a>
  <a class="journey-card" href="{{ '/start/' | relative_url }}"><strong>第一次使用</strong><span>先完成仓库可见性、Pages 和后台授权设置。</span><b>查看完整图解 →</b></a>
  <a class="journey-card" href="{{ '/community/' | relative_url }}"><strong>向当前题库投稿</strong><span>只提交问题也可以；帖子公开后，其他人可以继续评论补充。</span><b>打开面经社区 →</b></a>
</nav>

<section id="question-only-workflow" class="capture-panel question-only-workflow">
  <span class="status-badge">可以：先发问题，再让 Codex 补答</span>
  <h2>只发布一道问题，最少只操作 4 步</h2>
  <ol class="capture-steps">
    <li>打开“面试题与解答”，点击 <strong>Add an entry</strong>（手机端是 <code>+</code>）。</li>
    <li>填写<strong>面试题目</strong>，把<strong>在阅读网站显示这道题</strong>打开。</li>
    <li><strong>答案状态</strong>保持“待解答（只显示问题）”；解答、分类和难度都可以先不整理。</li>
    <li>点击 <strong>Save</strong>。网站会显示“待解答”，不会显示半成品，也不会把这道题放进模拟面试。</li>
  </ol>
  <p><strong>以后让 AI 回答：</strong>打开这道题的阅读页，点击“复制给 Codex 的补答指令”。Codex 打开你自己的题库仓库并拥有工作区写权限后，可以直接修改对应文件和完成校验；要继续同步 GitHub，还必须已经完成 GitHub 身份验证，并对远端仓库有写权限。使用普通 AI，或任一条件不满足时，请把生成内容粘贴回 Pages CMS，手动把答案状态改成“已完成”并保存。</p>
  <a class="primary-button cms-button" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">打开 Pages CMS，只发布问题 ↗</a>
</section>

<section id="capture-workflow" class="capture-panel">
  <span class="status-badge">先速记，再整理</span>
  <h2>刚面试完：先保存为仓库草稿</h2>
  <p>不要等答案写完整。趁记忆还清楚，先保存问题原貌和现场思路。</p>
  <ol class="capture-steps">
    <li>打开“面试题与解答”，点击 <strong>Add an entry</strong>（手机端是 <code>+</code>）。</li>
    <li>只需先填写<strong>面试题目</strong>；“解答草稿区”可以留空，也可以写关键词、自己的回答和追问。</li>
    <li>“整理 / 复习状态”保持<strong>待整理</strong>，“在阅读网站显示这道题”保持关闭；答案状态保持<strong>待解答</strong>，分类和难度可先用<strong>待整理 / 待评估</strong>。</li>
    <li>点击 <strong>Save</strong>。面试 / 记录日期会自动使用本地当天日期。</li>
  </ol>
  <a class="primary-button cms-button" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">打开 Pages CMS，开始记题 ↗</a>
  <p class="privacy-warning"><strong>仓库草稿不等于私密：</strong>“发布到阅读网站”关闭后只是不出现在网页；Public 仓库中的草稿源文件仍对所有人可见。只有 Private 仓库草稿才限本人和受邀协作者查看，但 Private 模式不提供在线题库浏览或随机模拟。不要把公司机密、面试官姓名、联系方式、未公开题库或受 NDA 约束的内容上传到任何非受控位置。</p>
</section>

<h2 id="daily-workflow">答案整理好后再设为已完成</h2>

<ol class="daily-steps">
  <li><strong>补全答案</strong><span>可以自己写，也可以复制指令交给 AI；Codex 只有在已打开自己的仓库且具有工作区写权限时才能直接改文件，同步远端还需要 GitHub 身份验证和仓库写权限，否则请把生成结果粘贴回 Pages CMS。</span></li>
  <li><strong>完成归类</strong><span>把分类、难度改为正式值，复习状态改为“待复习”或“已掌握”。</span></li>
  <li><strong>确认答案完成</strong><span>把答案状态改为“已完成”，需要公开时打开网站显示开关，再点击 Save。</span></li>
</ol>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/05-add-question.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 只发布待解答问题示意图（在新窗口打开）"><img src="{{ '/assets/guides/05-add-question.svg' | relative_url }}" loading="lazy" alt="Pages CMS 打开网站显示开关、让答案保持待解答并保存的示意图"></a>
  <figcaption>发布开关控制题目是否可见，答案状态控制题解是否展示。示意图合并展示关键字段，实际表单会纵向排列。点击查看大图。</figcaption>
</figure>

<details class="mode-details">
  <summary><span class="status-badge">仅首次</span><strong>登录并授权 Pages CMS</strong><span class="summary-hint">展开图解</span></summary>
  <div class="mode-details-body">
    <ol>
      <li>打开 Pages CMS，点击 <strong>Sign in with GitHub</strong>。</li>
      <li>点击 <strong>Install GitHub App → Only select repositories</strong>。</li>
      <li>只选择自己的题库仓库，再点击 <strong>Install</strong>。</li>
      <li>在 <strong>Open a project</strong> 中打开题库和默认分支（通常是 <code>main</code>）；建议把这个项目页加入浏览器书签。</li>
    </ol>
    <figure class="guide-figure guide-wide">
      <a href="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 授权示意图（在新窗口打开）"><img src="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" loading="lazy" alt="Pages CMS 登录并只授权题库仓库的示意图"></a>
      <figcaption>只需授权一次。看不到仓库时，用 Manage GitHub App 补选仓库。</figcaption>
    </figure>
  </div>
</details>

## 保存后会发生什么

- 点击 Save 后，Pages CMS 会先把文件写入 GitHub，随后 Actions 自动检查；检查失败只会阻止本次网站更新，不会撤回 Public 仓库中的提交。
- 打开网站显示开关、答案状态为“待解答”：阅读网站只显示题目和补答入口，不展示整理区内容，也不进入模拟面试。
- 打开网站显示开关、答案状态为“已完成”：通过答案校验后显示完整题解，并进入搜索与模拟面试。
- 私有题库只保存到私有仓库，不部署公开网页。
- 平时不需要每次查看 GitHub Actions；只有保存报错或公开网页长时间未更新时再检查。
- Pages CMS 中的“检查内容并更新网站”可以手动重跑校验和发布，不需要进入源码页面。

{% if site.github.repository_url %}<div class="manage-actions"><a class="secondary-button" href="{{ site.github.repository_url }}/actions/workflows/pages.yml" target="_blank" rel="noopener noreferrer">遇到问题？检查保存 / 发布状态 ↗</a><a class="secondary-button" href="{{ '/practice/' | relative_url }}">去模拟面试</a><a class="secondary-button" href="{{ '/' | relative_url }}">返回题库</a></div>{% endif %}

## 题目解答怎么整理

推荐按七段整理：

1. **面试时怎么答**：说明这道题适合怎样开口、讲到哪里、可能从哪里追问，再给一段自然的参考说法。原理题讲因果，系统题讲约束和失败路径，项目题讲真实经历；不要套统一四步。
2. **核心回答**：保存准确知识点，供回答后核对，不要求逐字背诵。
3. **展开说明**：面试官继续深挖时再讲公式、流程和边界。
4. **工程实践**：说清选择依据、指标、故障和替代方案。
5. **常见追问**：每个追问后直接写 1～2 句接法。
6. **一句话复习**：留下临场前最值得记住的一句话。
7. **参考资料**：优先放原论文、标准或官方文档。

富文本编辑器提供标题、列表、加粗、引用和代码块按钮，不要求手写 Markdown。没有真实项目经验时，可以写“如果让我设计，我会……”，再说明验证指标；不要虚构经历。

## 后台还能做什么

- 搜索题目、答案、匿名来源、分类和标签
- 分开控制“题目是否公开”和“答案是否完成”，可以先分享问题、稍后补答案
- 用“待整理 / 待复习 / 已掌握”手动管理内容与复习状态；模拟面试自评不会自动修改题目文件
- 新增、修改或删除题目，自由创建正式分类
- 修改网站名称、首页介绍、两行标题、主题颜色和页脚

## 公开 / 私有在哪里修改

Pages CMS 没有仓库公开 / 私有开关：

- **创建新仓库时**：在 Create a new repository 页面的 **Visibility** 中选择。
- **已有仓库**：进入 **Settings → General → Danger Zone → Change repository visibility**。

从公开改为私有前，要先停止 Pages 发布；从私有改为公开后，要启用 Pages 并手动运行一次工作流。具体操作见[模式选择与切换图解]({{ '/start/' | relative_url }}#mode-choice)。如果既要保留普通个人非公开笔记，又想分享整理后的题库，可以分别使用一个 Private 速记仓库和一个 Public 分享仓库；公司机密、未授权题库或受 NDA 约束的内容不要上传到 GitHub。

## 常见问题

- **看不到仓库**：点击 Pages CMS 账号旁齿轮或 Manage GitHub App，补选仓库。
- **只想公开问题**：打开“在阅读网站显示这道题”，答案状态保持“待解答”即可；答案可以为空。
- **完整答案没有显示**：确认“答案状态”已从“待解答”改为“已完成”，并把分类、难度和复习状态改为正式值。
- **公开网页没有更新**：点击上方“检查保存 / 发布状态”，查看是否仍在运行或出现红色错误。
- **私有题库没有网站入口或随机模拟**：这是当前模式的明确限制；请收藏 [Pages CMS](https://app.pagescms.org/) 的项目页用于编辑。若要使用在线浏览和模拟，需要把经过授权、可以公开的内容放入 Public 题库。
- **想换颜色或标题**：打开 Pages CMS 的“站点设置”，不需要改源码。

</div>

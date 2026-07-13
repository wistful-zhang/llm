---
title: 网页编辑题库
permalink: /manage/
---

<div class="container prose standalone-page manage-page onboarding-page" markdown="1">

<span class="status-badge">无需源码 · 表单编辑</span>

# 在网页上记录自己的面经

<div class="owner-notice" role="note">
  <strong>这是题库主人的编辑入口。</strong>
  <span>只有拥有目标仓库写入权限的 GitHub 用户才能保存；其他访客请返回题库阅读或模拟练习。</span>
</div>

Pages CMS 会把所有内容显示成中文表单。日常记题、补答案和发布不需要打开源码，也不需要 Git 命令。

<nav class="journey-grid" aria-label="选择操作">
  <a class="journey-card" href="#capture-workflow"><strong>刚面试完</strong><span>先把记得的原题抢救下来，答案可以稍后补。</span><b>约 1～2 分钟速记 →</b></a>
  <a class="journey-card" href="#daily-workflow"><strong>整理已有草稿</strong><span>补答案、正式分类和难度，再决定是否公开。</span><b>进入整理流程 →</b></a>
  <a class="journey-card" href="{{ '/start/' | relative_url }}"><strong>第一次使用</strong><span>先完成仓库可见性、Pages 和后台授权设置。</span><b>查看完整图解 →</b></a>
</nav>

<section id="capture-workflow" class="capture-panel">
  <span class="status-badge">推荐：先速记，再整理</span>
  <h2>刚面试完：先记为待整理内容</h2>
  <p>不要等答案写完整。趁记忆还清楚，先保存问题原貌和现场思路。</p>
  <ol class="capture-steps">
    <li>打开“面试题与解答”，点击 <strong>Add an entry</strong>（手机端是 <code>+</code>）。</li>
    <li>只需先填写<strong>面试题目</strong>；“当时的速记 / 解答”可以留空，也可以写关键词、自己的回答和追问。</li>
    <li>“整理 / 复习状态”保持<strong>待整理</strong>，“发布到阅读网站”保持关闭；分类和难度可先用<strong>待整理 / 待评估</strong>。</li>
    <li>点击 <strong>Save</strong>。面试 / 记录日期会自动使用本地当天日期。</li>
  </ol>
  <a class="primary-button cms-button" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">打开 Pages CMS，开始记题 ↗</a>
  <p class="privacy-warning"><strong>草稿不等于私密：</strong>“发布到阅读网站”关闭后只是不出现在网页；如果仓库是 Public，草稿源文件仍能在 GitHub 被看到。不要记录公司机密、面试官姓名、联系方式、未公开题库或受 NDA 约束的内容。</p>
</section>

<h2 id="daily-workflow">整理好后再发布</h2>

<ol class="daily-steps">
  <li><strong>补全答案</strong><span>整理核心回答、展开说明、工程实践和常见追问。</span></li>
  <li><strong>完成归类</strong><span>把分类和难度改为正式值，状态改为“待复习”或“已掌握”。</span></li>
  <li><strong>检查并发布</strong><span>移除隐私和未授权内容，打开“发布到阅读网站”，再点击 Save。</span></li>
</ol>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/05-add-question.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 快速记录题目示意图（在新窗口打开）"><img src="{{ '/assets/guides/05-add-question.svg' | relative_url }}" loading="lazy" alt="Pages CMS 快速记录题目、默认保存为待整理内容的示意图"></a>
  <figcaption>先填题目就能保存；答案、正式分类和难度可以以后补。示意图合并展示关键字段，实际表单会纵向排列。点击查看大图。</figcaption>
</figure>

<details class="mode-details">
  <summary><span class="status-badge">仅首次</span><strong>登录并授权 Pages CMS</strong><span class="summary-hint">展开图解</span></summary>
  <div class="mode-details-body">
    <ol>
      <li>打开 Pages CMS，点击 <strong>Sign in with GitHub</strong>。</li>
      <li>点击 <strong>Install GitHub App → Only select repositories</strong>。</li>
      <li>只选择自己的题库仓库，再点击 <strong>Install</strong>。</li>
      <li>在 <strong>Open a project</strong> 中打开题库和 <code>main</code> 分支；建议把这个项目页加入浏览器书签。</li>
    </ol>
    <figure class="guide-figure guide-wide">
      <a href="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 授权示意图（在新窗口打开）"><img src="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" loading="lazy" alt="Pages CMS 登录并只授权题库仓库的示意图"></a>
      <figcaption>只需授权一次。看不到仓库时，用 Manage GitHub App 补选仓库。</figcaption>
    </figure>
  </div>
</details>

## 保存后会发生什么

- 系统先自动检查题目格式；不完整的草稿也可以正常保存。
- 公开题库中，只有打开“发布到阅读网站”并通过发布校验的题目才会进入网站、搜索和模拟面试。
- 私有题库只保存到私有仓库，不部署公开网页。
- 平时不需要每次查看 GitHub Actions；只有保存报错或公开网页长时间未更新时再检查。

{% if site.github.repository_url %}<div class="manage-actions"><a class="secondary-button" href="{{ site.github.repository_url }}/actions/workflows/pages.yml" target="_blank" rel="noopener noreferrer">遇到问题？检查保存 / 发布状态 ↗</a><a class="secondary-button" href="{{ '/practice/' | relative_url }}">去模拟面试</a><a class="secondary-button" href="{{ '/' | relative_url }}">返回题库</a></div>{% endif %}

## 题目解答怎么整理

可以依次写：核心回答、展开说明、工程实践、常见追问、一句话复习。富文本编辑器提供标题、列表、加粗、引用和代码块按钮，不要求手写 Markdown。

## 后台还能做什么

- 搜索题目、答案、匿名来源、分类和标签
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
- **草稿无法发布**：发布前必须补答案，并把分类、难度从“待整理 / 待评估”改为正式值。
- **公开网页没有更新**：点击上方“检查保存 / 发布状态”，查看是否仍在运行或出现红色错误。
- **私有题库没有网站入口**：这是预期行为，请直接收藏 [Pages CMS](https://app.pagescms.org/) 的项目页。
- **想换颜色或标题**：打开 Pages CMS 的“站点设置”，不需要改源码。

</div>

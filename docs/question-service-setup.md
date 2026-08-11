---
title: 共享题目服务设置
description: 题库主人只配置一次，让访客以后在网页里直接发布公开题，不需要 GitHub Issue 或人工审核。
permalink: /questions/setup/
---

<div class="container prose standalone-page" markdown="1">

<span class="status-badge">题库主人仅配置一次</span>

# 让“公开”按钮真正一键发布

GitHub Pages 只能读取文件，不能接收访客写入。项目因此提供一个很小的 Cloudflare Worker + D1 服务：题库主人部署一次后，访客选择“公开”并保存，题目会直接进入共享题库，不登录 GitHub、不创建 Issue，也没有审核队列。

私人题不使用这个服务，仍然只保存在发布者自己的浏览器。

## 准备内容

- 一个 Cloudflare 账号
- 当前题库的正式网址，例如 `https://name.github.io/llm`
- Node.js 20 或更新版本

## 一次性部署

1. 在终端进入仓库的 `comments-worker` 目录，执行 `npm ci` 和 `npx wrangler login`。
2. 执行 `npm run db:create`，把返回的 `database_id` 填进 `wrangler.jsonc`。
3. 在 Cloudflare Turnstile 创建 Managed 小组件，把题库网站的 hostname 加入允许列表；将 site key 填入 `TURNSTILE_SITE_KEY`。
4. 在 `wrangler.jsonc` 中把 `SITE_URL` 改成题库正式网址，并为每个独立题库设置不同的 `SITE_ID`。
5. 分别运行以下命令，按提示输入随机且不可复用的值：

   ```text
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put HASH_SECRET
   npx wrangler secret put ADMIN_TOKEN
   ```

   `HASH_SECRET` 和 `ADMIN_TOKEN` 至少使用 32 个随机字符。不要把任何 Secret、Token 或密码写入仓库。

6. 执行 `npm run deploy`。命令会先应用 D1 migration，再发布 Worker。记下返回的 `https://...workers.dev` 根网址。
7. 在 GitHub 仓库打开 **Settings → Secrets and variables → Actions → Variables**，新增 `QUESTIONS_API_URL`，值只填写 Worker 根网址。还要开放题下评论时，再新增 `COMMENTS_API_URL` 并填写**同一个**根网址；不要为公开题和评论各建一套数据库。
8. 在 **Actions → 内容检查与网站发布** 手动运行一次。发布完成后，到网站的“＋题目”选择“公开”做一次测试。

## 发布后如何管理

- 发布者：在原浏览器的“＋题目”页面修改或撤回自己的公开题。
- 题库主人：访问 Worker 根网址后的 `/admin`，使用 `ADMIN_TOKEN` 处理需要事后下架的内容。
- 所有人：发布成功后立即可见，不需要等待题库主人批准。

这一个 Worker 同时提供公开题和题下评论。公开题服务使用 Turnstile、蜜罐、幂等请求和按日限流减少滥用。管理员下架是事后治理，不是发布前审核。清除浏览器数据会丢失发布者的修改凭据；JSON 备份只保存题目内容，不包含这些凭据，因此不能用于在另一台设备接管公开题。

## 没有配置时

仓库内置题、私人题、搜索、模拟面试和面试记录仍可正常使用。网页会明确提示“尚未开通公开发布”，不会把只存在当前浏览器的题目冒充成已经公开。

</div>

# 原生评论服务（Cloudflare Worker + D1）

这是题目页“贴吧式”评论区的独立后端。访客不需要 GitHub 账号：通过 Turnstile 后即可用昵称发布，评论会立即出现在题目下方。服务仅面向一个站点，数据保存在站点维护者自己的 Cloudflare D1 中。

## 能力与边界

- 按题目 slug 展示扁平楼层和游标分页；可回复任意可见楼层，每条评论只保留一个 `replyTo` 引用，不生成嵌套树。
- 发布时使用 Turnstile、蜜罐、严格的 D1 原子限流和 UUID 幂等。
- 发布者凭浏览器生成的 `editToken` 编辑或删除自己的评论；后端只保存 HMAC。
- 举报进入管理队列；`/admin` 提供隐藏、恢复、删除和处理举报的简单界面。
- 评论默认立即公开。管理员可以锁定某道题的评论区。
- 不保存原始 IP 或 User-Agent。来源地址仅在请求期间用于生成按 UTC 日轮换的 HMAC 限流键，过期键由定时任务清理。
- 评论是纯文本。展示端必须继续使用 `textContent`，不要把评论插入 `innerHTML`。

这是一个无账号评论区，不是强身份系统。昵称可以重复，`editToken` 丢失后无法自助找回，管理员仍可通过管理页处理内容。

## 可视化部署

Cloudflare 的 Deploy Button 支持仓库子目录。使用下面的地址格式，把 `OWNER/REPOSITORY` 和分支替换成实际公开仓库：

```text
https://deploy.workers.cloudflare.com/?url=https://github.com/OWNER/REPOSITORY/tree/main/comments-worker
```

`comments-worker` 已把运行代码、`package.json`、Wrangler 配置、D1 migrations 和 secret 示例全部放在子目录内，不依赖仓库根目录，符合子目录作为独立应用部署的要求。部署页会根据 `wrangler.jsonc` 创建 D1，根据 `package.json` 的 `cloudflare.bindings` 显示六项配置说明，并从 `.dev.vars.example` 识别三个 secret。`deploy` 脚本使用 D1 binding `DB` 执行迁移，因此用户在界面中改数据库名称也不会影响迁移。

部署前仍需先在 Turnstile 创建小组件，才能填写配对的 site key 和 secret。部署完成后，把 Worker 根网址配置到题库网站的 `COMMENTS_API_URL` 并重新构建网站。

## 手动部署

需要 Node.js 20.18.1+ 和 Cloudflare 账号。以下命令都在 `comments-worker` 目录执行。

1. 安装工具并登录：

   ```powershell
   npm install
   npx wrangler login
   ```

2. 创建 D1：

   ```powershell
   npm run db:create
   ```

   把命令返回的 `database_id` 填入 `wrangler.jsonc`。若自行修改数据库名称，只需让其中的 `database_name` 和 `database_id` 指向所选数据库；迁移与部署脚本始终通过 binding `DB` 定位它。

3. 在 Cloudflare Turnstile 创建 **Managed** 小组件，把正式网站的 hostname 加入允许列表。将 site key 填入 `TURNSTILE_SITE_KEY`。

4. 修改 `wrangler.jsonc` 的三个公开变量：

   - `SITE_URL`：网站完整地址，例如 `https://your-name.github.io/llm`。
   - `SITE_ID`：这套评论数据的稳定标识，部署后不要随意更换。
   - `TURNSTILE_SITE_KEY`：Turnstile 的公开 site key。

5. 配置三个 secret。不要把值写入 Git：

   ```powershell
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put HASH_SECRET
   npx wrangler secret put ADMIN_TOKEN
   ```

   `HASH_SECRET` 和 `ADMIN_TOKEN` 均应使用至少 32 个随机字符。实现会用 `HASH_SECRET` 对 `editToken` 做 HMAC-SHA-256 后再保存，因此更换它确实会让旧评论的编辑凭证失效，也会改变当日限流键；请把它作为长期密钥备份。

6. 迁移并部署：

   ```powershell
   npm run deploy
   ```

   Windows 也可以运行 `./scripts/deploy.ps1`，脚本会在占位配置未替换时直接停止。迁移应先于 Worker 发布。

7. 打开 `https://<你的-worker>/v1/config` 检查：

   ```json
   {
     "siteId": "llm-interview-notes",
     "turnstileSiteKey": "...",
     "writeEnabled": true
   }
   ```

   `writeEnabled: false` 表示至少一个写入 secret/site key 缺失或 `HASH_SECRET` 太短。

## 本地调试

复制配置后，用 Wrangler 的本地 secret 文件（该文件必须保持在 Git 之外）提供密钥，再执行：

```powershell
npm run db:migrate:local
npm run dev
```

Turnstile 本地调试请使用 Cloudflare 提供的测试 key。题目页的发布和举报共用同一个小组件，action 固定为 `question-comment`；后端会严格核对该 action，并确认验证结果中的 hostname 等于 `SITE_URL` 的 hostname。

## 前端 API 契约

所有公开 JSON 接口只允许 `SITE_URL` 所在 origin（以及 Worker 自身的同源管理页）跨域访问，不会返回 `Access-Control-Allow-Origin: *`。

### 配置与读取

- `GET /v1/config`
- `GET /v1/questions/{slug}/comments?cursor=<floor>&limit=20`

读取响应：

```json
{
  "comments": [
    {
      "id": "UUID",
      "floor": 1,
      "nickname": "路人甲",
      "body": "我会先回答结论……",
      "createdAt": "2026-08-06T08:00:00.000Z",
      "updatedAt": "2026-08-06T08:00:00.000Z",
      "replyTo": null,
      "status": "visible"
    }
  ],
  "total": 1,
  "nextCursor": null,
  "locked": false
}
```

`cursor` 是上一页最后一个楼层；结果按楼层升序。已由作者删除的楼层仍会返回，`status` 为 `deleted` 且正文为空。后台隐藏的评论不会出现在公开接口。

### 发布、编辑与删除

- `POST /v1/questions/{slug}/comments`

  ```json
  {
    "nickname": "路人甲",
    "body": "评论正文",
    "parentId": null,
    "turnstileToken": "Turnstile 返回值",
    "requestId": "客户端为本次操作生成的 UUID",
    "editToken": "客户端生成并仅保存在本机的高强度随机串",
    "website": ""
  }
  ```

  `website` 是隐藏蜜罐字段，正常用户必须留空。可以回复同一道题下的任意可见楼层；页面仍按楼层完全扁平展示，只显示“回复某楼”的引用。成功响应为 `{ "comment": {...}, "total": 1, "idempotent": false }`；用相同 `requestId` 和 `editToken` 重试不会重复发帖。

- `PATCH /v1/comments/{id}`：正文为 `{ "body": "新正文", "editToken": "..." }`。
- `DELETE /v1/comments/{id}`：正文为 `{ "editToken": "..." }`。

前端应在第一次评论时用 `crypto.getRandomValues` 生成至少 32 字节的 `editToken`，按评论 ID 保存在本机。不要把它发给分析服务、写进 URL 或公开日志。

### 举报

- `POST /v1/comments/{id}/reports`

  ```json
  {
    "reason": "垃圾广告",
    "turnstileToken": "Turnstile 返回值",
    "requestId": "UUID",
    "website": ""
  }
  ```

举报不会自动隐藏评论，由管理员处理，避免匿名用户利用举报接口让正常内容下线。

## 管理

部署后访问 `https://<你的-worker>/admin`。输入 `ADMIN_TOKEN` 后可查看最新评论与待处理举报，也可以下载 JSON 备份。导出包含 `threads`、`comments`、`reports` 和 `moderationLog`，明确排除评论编辑凭证摘要、举报者 HMAC、限流表和管理员令牌。令牌只写入当前标签页的 `sessionStorage`，不会写入 URL、cookie 或 `localStorage`；关闭标签页即清除。

管理页的“最新评论”卡片可以直接锁定或重新开放对应题目的评论区。需要自动化时也可以调用同一管理 API：

```http
PATCH /v1/admin/questions/{slug}
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
Origin: https://<你的-worker>

{"locked":true}
```

管理员操作会写入 `moderation_log`。请定期备份 D1，并为评论区准备内容规范、举报处理周期和数据删除联系方式。

## 安全运维清单

- Git 仓库中只能出现 site key；三个 secret 只能通过 `wrangler secret put` 配置。
- 变更正式域名时同时更新 `SITE_URL` 与 Turnstile hostname allowlist。
- 不要在 Worker 日志中打印请求头、请求正文、token 或 Turnstile 响应。
- 定期查看 `/admin` 的举报队列并备份 D1。
- 若 `ADMIN_TOKEN` 泄露，立即轮换；若 `HASH_SECRET` 泄露，也要轮换并接受旧评论无法再自助编辑。
- 高风险滥用场景可先锁定题目，再结合 Cloudflare WAF/自定义规则处理。

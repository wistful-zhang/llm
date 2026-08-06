$ErrorActionPreference = "Stop"

$configPath = Join-Path $PSScriptRoot "..\wrangler.jsonc"
$config = Get-Content -LiteralPath $configPath -Raw
if ($config.Contains("REPLACE_WITH_D1_DATABASE_ID") -or $config.Contains("REPLACE_WITH_TURNSTILE_SITE_KEY")) {
  throw "请先在 comments-worker/wrangler.jsonc 中填写 D1 database_id 和 Turnstile site key。"
}

Push-Location (Join-Path $PSScriptRoot "..")
try {
  & npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
  if ($LASTEXITCODE -ne 0) { throw "D1 迁移失败。" }
  & npx wrangler deploy --config wrangler.jsonc
  if ($LASTEXITCODE -ne 0) { throw "Worker 部署失败。" }
}
finally {
  Pop-Location
}

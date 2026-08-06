import { writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_OUTPUT = fileURLToPath(new URL('../docs/_data/comment_runtime.yml', import.meta.url));

export const validateCommentsApiUrl = (value, { allowLocalhost = false } = {}) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.length > 300 || /[\s"'`;]/.test(raw)) throw new Error('COMMENTS_API_URL 包含不安全字符');

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('COMMENTS_API_URL 必须是完整网址');
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(allowLocalhost && local && url.protocol === 'http:')) {
    throw new Error('COMMENTS_API_URL 必须使用 HTTPS');
  }
  if (url.username || url.password || url.search || url.hash || !url.hostname) {
    throw new Error('COMMENTS_API_URL 不能包含账号、查询参数或片段');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('COMMENTS_API_URL 只填写 Worker 根网址，不要附加路径');
  }
  return url.origin;
};

export const renderCommentsRuntimeConfig = (apiUrl) => [
  '# 由 scripts/build-comments-config.mjs 在构建时生成；这里只包含公开的 Worker 网址。',
  `api_url: ${JSON.stringify(apiUrl)}`,
  '',
].join('\n');

export const writeCommentsRuntimeConfig = async ({ apiUrl, output = DEFAULT_OUTPUT, allowLocalhost = false }) => {
  const safeApiUrl = validateCommentsApiUrl(apiUrl, { allowLocalhost });
  await writeFile(output, renderCommentsRuntimeConfig(safeApiUrl), 'utf8');
  return safeApiUrl;
};

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    const apiUrl = await writeCommentsRuntimeConfig({
      apiUrl: process.env.COMMENTS_API_URL || '',
      output: process.env.COMMENTS_CONFIG_OUTPUT || DEFAULT_OUTPUT,
      allowLocalhost: process.env.COMMENTS_ALLOW_INSECURE_LOCALHOST === 'true',
    });
    process.stdout.write(apiUrl
      ? `站内评论构建配置已生成：${apiUrl}\n`
      : '未配置 COMMENTS_API_URL，本次构建不会连接任何评论后端。\n');
  } catch (error) {
    process.stderr.write(`站内评论配置错误：${error.message}\n`);
    process.exitCode = 1;
  }
}

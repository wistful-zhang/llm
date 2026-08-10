import { writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_OUTPUT = fileURLToPath(new URL('../docs/_data/question_runtime.yml', import.meta.url));

export const validateQuestionsApiUrl = (value, { allowLocalhost = false } = {}) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.length > 300 || /[\s"'`;]/.test(raw)) throw new Error('QUESTIONS_API_URL 包含不安全字符');

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('QUESTIONS_API_URL 必须是完整网址');
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(allowLocalhost && local && url.protocol === 'http:')) {
    throw new Error('QUESTIONS_API_URL 必须使用 HTTPS');
  }
  if (url.username || url.password || url.search || url.hash || !url.hostname) {
    throw new Error('QUESTIONS_API_URL 不能包含账号、查询参数或片段');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('QUESTIONS_API_URL 只填写共享服务根网址，不要附加路径');
  }
  return url.origin;
};

export const renderQuestionsRuntimeConfig = (apiUrl) => [
  '# 由 scripts/build-question-config.mjs 在构建时生成；这里只包含公开的共享服务网址。',
  `api_url: ${JSON.stringify(apiUrl)}`,
  '',
].join('\n');

export const writeQuestionsRuntimeConfig = async ({ apiUrl, output = DEFAULT_OUTPUT, allowLocalhost = false }) => {
  const safeApiUrl = validateQuestionsApiUrl(apiUrl, { allowLocalhost });
  await writeFile(output, renderQuestionsRuntimeConfig(safeApiUrl), 'utf8');
  return safeApiUrl;
};

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    const apiUrl = await writeQuestionsRuntimeConfig({
      apiUrl: process.env.QUESTIONS_API_URL || '',
      output: process.env.QUESTIONS_CONFIG_OUTPUT || DEFAULT_OUTPUT,
      allowLocalhost: process.env.QUESTIONS_ALLOW_INSECURE_LOCALHOST === 'true',
    });
    process.stdout.write(apiUrl
      ? `公开题共享服务配置已生成：${apiUrl}\n`
      : '未配置 QUESTIONS_API_URL，本次构建只提供私人题和仓库内置题。\n');
  } catch (error) {
    process.stderr.write(`公开题共享服务配置错误：${error.message}\n`);
    process.exitCode = 1;
  }
}

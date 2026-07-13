import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const questionsDir = fileURLToPath(new URL('../docs/_questions/', import.meta.url));
const allowedDifficulties = new Set(['简单', '中等', '困难']);
const seenTitles = new Map();
const errors = [];
const questionsPathExists = existsSync(questionsDir);
const questionsPathIsDirectory = questionsPathExists && statSync(questionsDir).isDirectory();
const files = questionsPathIsDirectory
  ? readdirSync(questionsDir).filter((name) => name.endsWith('.md')).sort()
  : [];

if (questionsPathExists && !questionsPathIsDirectory) {
  errors.push('docs/_questions 必须是目录');
}

const unquote = (value) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const field = (frontmatter, name) => {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'));
  return match ? unquote(match[1]) : '';
};

for (const filename of files) {
  const source = readFileSync(join(questionsDir, filename), 'utf8').replace(/^\uFEFF/, '');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);

  if (!match) {
    errors.push(`${filename}: 缺少有效的 YAML frontmatter`);
    continue;
  }

  const [, frontmatter, body] = match;
  const title = field(frontmatter, 'title');
  const category = field(frontmatter, 'category');
  const difficulty = field(frontmatter, 'difficulty');
  const published = field(frontmatter, 'published');
  const date = field(frontmatter, 'date');

  if (title.length < 4 || title.length > 160) {
    errors.push(`${filename}: title 长度应为 4～160 个字符`);
  }
  if (!category || category.length > 30) {
    errors.push(`${filename}: category 必填且不能超过 30 个字符`);
  }
  if (!allowedDifficulties.has(difficulty)) {
    errors.push(`${filename}: difficulty 必须是“简单”“中等”或“困难”`);
  }
  if (published && !['true', 'false'].includes(published)) {
    errors.push(`${filename}: published 必须是 true 或 false`);
  }
  const parsedDate = new Date(`${date}T00:00:00Z`);
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsedDate.valueOf()) &&
    parsedDate.toISOString().slice(0, 10) === date;
  if (!isValidDate) {
    errors.push(`${filename}: date 必须是有效的 YYYY-MM-DD 日期`);
  }
  if (!body.trim()) {
    errors.push(`${filename}: 题目解答不能为空`);
  }

  if (title) {
    if (seenTitles.has(title)) {
      errors.push(`${filename}: 题目标题与 ${seenTitles.get(title)} 重复`);
    } else {
      seenTitles.set(title, filename);
    }
  }
}

if (errors.length > 0) {
  console.error(`内容校验失败（${errors.length} 项）：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`内容校验通过：${files.length} 道题目`);
}

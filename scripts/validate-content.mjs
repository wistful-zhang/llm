import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const questionsDir = fileURLToPath(new URL('../docs/_questions/', import.meta.url));
const allowedDifficulties = new Set(['待评估', '简单', '中等', '困难']);
const publishableDifficulties = new Set(['简单', '中等', '困难']);
const allowedReviewStatuses = new Set(['待整理', '待复习', '已掌握']);
const seenTitles = new Map();
const seenNormalizedTitles = new Map();
const errors = [];
let publishedCount = 0;
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

const rawField = (frontmatter, name) => {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'));
  return match ? match[1].trim() : '';
};

const normalizeTitle = (value) => value
  .normalize('NFKC')
  .toLocaleLowerCase('zh-CN')
  .replace(/[\s\p{P}]+/gu, '');

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
  const sourceNote = field(frontmatter, 'source');
  const reviewStatus = field(frontmatter, 'review_status');
  const published = rawField(frontmatter, 'published');
  const date = field(frontmatter, 'date');
  const isPublished = published === 'true';
  if (isPublished) publishedCount += 1;

  if (title.length < 2 || title.length > 160) {
    errors.push(`${filename}: title 长度应为 2～160 个字符`);
  }
  if (!category || category.length > 30) {
    errors.push(`${filename}: category 必填且不能超过 30 个字符`);
  }
  if (isPublished && category === '待整理') {
    errors.push(`${filename}: 发布前必须把 category 从“待整理”改为正式分类`);
  }
  if (!allowedDifficulties.has(difficulty)) {
    errors.push(`${filename}: difficulty 必须是“待评估”“简单”“中等”或“困难”`);
  }
  if (isPublished && !publishableDifficulties.has(difficulty)) {
    errors.push(`${filename}: 发布前必须把 difficulty 从“待评估”改为正式难度`);
  }
  if (sourceNote.length > 80) {
    errors.push(`${filename}: source 不能超过 80 个字符`);
  }
  if (!allowedReviewStatuses.has(reviewStatus)) {
    errors.push(`${filename}: review_status 必须是“待整理”“待复习”或“已掌握”`);
  }
  if (isPublished && reviewStatus === '待整理') {
    errors.push(`${filename}: 发布前必须把 review_status 从“待整理”改为“待复习”或“已掌握”`);
  }
  if (!['true', 'false'].includes(published)) {
    errors.push(`${filename}: published 必须是未加引号的 YAML 布尔值 true 或 false`);
  }
  const parsedDate = new Date(`${date}T00:00:00Z`);
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsedDate.valueOf()) &&
    parsedDate.toISOString().slice(0, 10) === date;
  if (!isValidDate) {
    errors.push(`${filename}: date 必须是有效的 YYYY-MM-DD 日期`);
  }
  if (isPublished && !body.trim()) {
    errors.push(`${filename}: 发布到网站前必须补充题目解答`);
  }

  if (title && isPublished) {
    if (seenTitles.has(title)) {
      errors.push(`${filename}: 题目标题与 ${seenTitles.get(title)} 重复`);
    } else {
      seenTitles.set(title, filename);
    }

    const normalizedTitle = normalizeTitle(title);
    if (seenNormalizedTitles.has(normalizedTitle)) {
      errors.push(`${filename}: 题目标题与 ${seenNormalizedTitles.get(normalizedTitle)} 仅有大小写、空格或标点差异`);
    } else {
      seenNormalizedTitles.set(normalizedTitle, filename);
    }
  }
}

if (errors.length > 0) {
  console.error(`内容校验失败（${errors.length} 项）：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`内容校验通过：共 ${files.length} 道，已发布 ${publishedCount} 道，草稿 ${files.length - publishedCount} 道`);
}

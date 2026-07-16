import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import {
  hasPublishedExperienceFrontmatter,
  hasRenderedExperienceMarker,
  validateRenderedExperienceHtml,
} from './experience-publication.mjs';

const siteDir = resolve(process.argv[2] || '_site');
const sourceDir = resolve(process.argv[3] || 'docs/_experiences');
const errors = [];
let renderedExperienceCount = 0;
let expectedExperienceCount = 0;

const listHtmlFiles = (directory) => readdirSync(directory, { withFileTypes: true })
  .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
  .flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(path);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.html') ? [path] : [];
  });

if (!existsSync(siteDir) || !statSync(siteDir).isDirectory()) {
  errors.push('找不到 Jekyll 构建目录：' + siteDir);
} else {
  listHtmlFiles(siteDir).forEach((path) => {
    const html = readFileSync(path, 'utf8');
    if (!hasRenderedExperienceMarker(html)) return;
    renderedExperienceCount += 1;
    const filename = relative(siteDir, path);
    errors.push(...validateRenderedExperienceHtml(html, filename));
  });
}

if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
  errors.push('找不到公开面经源目录：' + sourceDir);
} else {
  const countPublished = (directory) => readdirSync(directory, { withFileTypes: true })
    .reduce((count, entry) => {
      if (entry.name.startsWith('.')) return count;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return count + countPublished(path);
      if (!entry.isFile() || !/\.(?:md|markdown)$/i.test(entry.name)) return count;
      return count + (hasPublishedExperienceFrontmatter(readFileSync(path, 'utf8')) ? 1 : 0);
    }, 0);
  expectedExperienceCount = countPublished(sourceDir);
}

if (renderedExperienceCount !== expectedExperienceCount) {
  errors.push(
    '公开面经源文件为 ' + expectedExperienceCount +
    ' 篇，但构建结果中找到 ' + renderedExperienceCount +
    ' 篇；请检查固定布局和发布状态',
  );
}

if (errors.length > 0) {
  console.error('渲染后公开面经校验失败（' + errors.length + ' 项）：');
  errors.forEach((error) => console.error('- ' + error));
  process.exitCode = 1;
} else {
  console.log('渲染后公开面经校验通过：共 ' + renderedExperienceCount + ' 篇');
}

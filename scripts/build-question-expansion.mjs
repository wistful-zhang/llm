import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseQuestionDocument } from './question-publication.mjs';
import { isStudyTier, studyTierForExpansionBatch } from './question-study-tier.mjs';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const questionsDir = join(rootDir, 'docs', '_questions');
const batchesDir = join(rootDir, 'scripts', 'question-batches');
const generatedPrefix = 'exp1000-';
const targetQuestionCount = 1000;
const write = process.argv.includes('--write');

const normalizeTitle = (value) => String(value || '')
  .normalize('NFKC')
  .toLocaleLowerCase('zh-CN')
  .replace(/[\s\p{P}]+/gu, '');

const plainLine = (value) => String(value || '')
  .normalize('NFC')
  .replace(/\s+/g, ' ')
  .trim();

const yamlString = (value) => `'${plainLine(value).replace(/'/g, "''")}'`;

const referenceFor = (record) => {
  const category = plainLine(record.category);
  const topic = plainLine(`${record.title} ${(record.tags || []).join(' ')}`);

  if (category === '评测与安全' && /安全|隐私|攻击|注入|越权|越狱|红队|毒性|滥用|泄露|成员推断|模型反演/.test(topic)) {
    return ['OWASP Top 10 for LLM Applications', 'https://owasp.org/www-project-top-10-for-large-language-model-applications/'];
  }
  if (category === '编程与框架') {
    if (/CUDA|Triton|GPU/.test(topic)) return ['NVIDIA CUDA C++ Programming Guide', 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/'];
    if (/Hugging Face|HF |Transformers|PEFT/.test(topic)) return ['Hugging Face Transformers 文档', 'https://huggingface.co/docs/transformers/'];
    if (/PyTorch|Autograd|Tensor/.test(topic)) return ['PyTorch 官方文档', 'https://docs.pytorch.org/docs/stable/'];
    return ['Python 3 官方文档', 'https://docs.python.org/3/'];
  }
  if (category === '训练与对齐') {
    if (/LoRA|QLoRA|PEFT|Adapter/.test(topic)) return ['Hugging Face PEFT 文档', 'https://huggingface.co/docs/peft/'];
    return ['Hugging Face TRL 文档', 'https://huggingface.co/docs/trl/index'];
  }

  const references = [
    [/数学/, ['Deep Learning Book', 'https://www.deeplearningbook.org/']],
    [/NLP|机器学习/, ['Stanford CS224N', 'https://web.stanford.edu/class/cs224n/']],
    [/编程|框架/, ['PyTorch 官方文档', 'https://docs.pytorch.org/docs/stable/']],
    [/项目|行为面/, ['Microsoft Careers：Interview tips', 'https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html']],
    [/Transformer|模型结构|LLM 基础|分词|表示/, ['Attention Is All You Need', 'https://arxiv.org/abs/1706.03762']],
    [/预训练|数据/, ['Hugging Face Datasets 文档', 'https://huggingface.co/docs/datasets/']],
    [/训练工程|优化|并行|显存/, ['PyTorch 分布式训练文档', 'https://docs.pytorch.org/docs/stable/distributed.html']],
    [/Prompt|上下文/, ['Anthropic Prompt Engineering', 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview']],
    [/RAG|检索|搜索|知识库/, ['Retrieval-Augmented Generation', 'https://arxiv.org/abs/2005.11401']],
    [/多模态|视觉|语音/, ['CLIP', 'https://arxiv.org/abs/2103.00020']],
    [/Agent|工具|协议/, ['ReAct', 'https://arxiv.org/abs/2210.03629']],
    [/推理|部署|量化|性能/, ['NVIDIA TensorRT-LLM 文档', 'https://docs.nvidia.com/tensorrt-llm/']],
    [/评测|Benchmark/, ['HELM', 'https://arxiv.org/abs/2211.09110']],
    [/安全|隐私|治理/, ['OWASP Top 10 for LLM Applications', 'https://owasp.org/www-project-top-10-for-large-language-model-applications/']],
    [/微调|PEFT/, ['Hugging Face PEFT 文档', 'https://huggingface.co/docs/peft/']],
    [/系统设计|工程|MLOps|可观测性/, ['Google SRE Book', 'https://sre.google/sre-book/table-of-contents/']],
  ];
  return references.find(([pattern]) => pattern.test(category))?.[1]
    || ['Hugging Face Transformers 文档', 'https://huggingface.co/docs/transformers/'];
};

const renderQuestion = (record) => {
  const tags = record.tags.map((tag) => `  - ${yamlString(tag)}`).join('\n');
  const followups = record.followups
    .map(({ q, a }, index) => `${index + 1}. **${plainLine(q)}** ${plainLine(a)}`)
    .join('\n');
  const [referenceTitle, referenceUrl] = referenceFor(record);
  const studyTier = studyTierForExpansionBatch(record.batch, record.slug);

  return `---
title: ${yamlString(record.title)}
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: ${yamlString(record.category)}
difficulty: ${yamlString(record.difficulty)}
study_tier: ${yamlString(studyTier)}
tags:
${tags}
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

${plainLine(record.guide)}

**可以这样答：**

> ${plainLine(record.answer)}

## 常见追问

${followups}

## 延伸阅读

- [${referenceTitle}](${referenceUrl})
`;
};

const errors = [];
const batchFiles = existsSync(batchesDir)
  ? readdirSync(batchesDir).filter((name) => /^batch-[a-z0-9-]+\.mjs$/i.test(name)).sort()
  : [];
const batches = [];

for (const filename of batchFiles) {
  const module = await import(`${pathToFileURL(join(batchesDir, filename)).href}?v=${Date.now()}`);
  if (!Array.isArray(module.default)) {
    errors.push(`${filename}: 默认导出必须是数组`);
    continue;
  }
  module.default.forEach((record, index) => batches.push({ ...record, batch: filename, row: index + 1 }));
}

const existingFiles = readdirSync(questionsDir)
  .filter((name) => /\.(?:md|markdown)$/i.test(name) && !name.startsWith(generatedPrefix));
const existingTitles = new Map();
const existingNormalizedTitles = new Map();

for (const filename of existingFiles) {
  const source = readFileSync(join(questionsDir, filename), 'utf8');
  const parsed = parseQuestionDocument(source, filename);
  const title = plainLine(parsed.values.get('title'));
  if (!title) continue;
  existingTitles.set(title, filename);
  existingNormalizedTitles.set(normalizeTitle(title), filename);
}

const seenSlugs = new Map();
const seenTitles = new Map(existingTitles);
const seenNormalizedTitles = new Map(existingNormalizedTitles);
const seenGuides = new Map();
const seenAnswers = new Map();
const generatedPaths = new Set();
const allowedDifficulties = new Set(['简单', '中等', '困难']);

for (const record of batches) {
  const owner = `${record.batch} 第 ${record.row} 条`;
  const slug = plainLine(record.slug);
  const title = plainLine(record.title);
  const category = plainLine(record.category);
  const difficulty = plainLine(record.difficulty);
  const tags = Array.isArray(record.tags) ? record.tags.map(plainLine).filter(Boolean) : [];
  const guide = plainLine(record.guide);
  const answer = plainLine(record.answer);
  const followups = Array.isArray(record.followups) ? record.followups : [];
  const studyTier = studyTierForExpansionBatch(record.batch, record.slug);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    errors.push(`${owner}: slug 必须是 1～100 位英文 kebab-case`);
  }
  if (seenSlugs.has(slug)) errors.push(`${owner}: slug 与 ${seenSlugs.get(slug)} 重复`);
  else seenSlugs.set(slug, owner);
  if (title.length < 8 || title.length > 160) errors.push(`${owner}: title 长度应为 8～160 个字符`);
  if (seenTitles.has(title)) errors.push(`${owner}: 标题与 ${seenTitles.get(title)} 重复`);
  else seenTitles.set(title, owner);
  const normalizedTitle = normalizeTitle(title);
  if (seenNormalizedTitles.has(normalizedTitle)) {
    errors.push(`${owner}: 标题与 ${seenNormalizedTitles.get(normalizedTitle)} 仅有大小写、空格或标点差异`);
  } else {
    seenNormalizedTitles.set(normalizedTitle, owner);
  }
  if (!category || category.length > 30) errors.push(`${owner}: category 必填且不能超过 30 个字符`);
  if (!allowedDifficulties.has(difficulty)) errors.push(`${owner}: difficulty 必须是简单、中等或困难`);
  if (!isStudyTier(studyTier)) errors.push(`${owner}: study_tier 不是合法备考层级`);
  if (tags.length < 2 || tags.length > 4 || new Set(tags).size !== tags.length) {
    errors.push(`${owner}: tags 必须包含 2～4 个不重复标签`);
  }
  if (guide.length < 24 || guide.length > 320) errors.push(`${owner}: guide 应为 24～320 个字符，短句要能说明答题结构`);
  if (answer.length < 80 || answer.length > 600) errors.push(`${owner}: answer 应为 80～600 个字符`);
  const normalizedGuide = normalizeTitle(guide);
  const normalizedAnswer = normalizeTitle(answer);
  if (seenGuides.has(normalizedGuide)) errors.push(`${owner}: guide 与 ${seenGuides.get(normalizedGuide)} 重复`);
  else seenGuides.set(normalizedGuide, owner);
  if (seenAnswers.has(normalizedAnswer)) errors.push(`${owner}: answer 与 ${seenAnswers.get(normalizedAnswer)} 重复`);
  else seenAnswers.set(normalizedAnswer, owner);
  if (/作为(?:一个|一名)(?:AI|人工智能)|综上所述|希望(?:以上|这些)内容/.test(`${guide}${answer}`)) {
    errors.push(`${owner}: 回答包含明显的生成式套话，请改成面试中的自然表达`);
  }
  if (followups.length < 2 || followups.length > 4) errors.push(`${owner}: followups 应包含 2～4 个追问`);
  followups.forEach((followup, index) => {
    const question = plainLine(followup?.q);
    const response = plainLine(followup?.a);
    if (question.length < 4 || question.length > 120) errors.push(`${owner}: 第 ${index + 1} 个追问问题长度不合理`);
    if (response.length < 12 || response.length > 360) errors.push(`${owner}: 第 ${index + 1} 个追问答案长度不合理`);
  });
  generatedPaths.add(`${generatedPrefix}${slug}.md`);
}

const existingGenerated = readdirSync(questionsDir)
  .filter((name) => name.startsWith(generatedPrefix) && /\.md$/i.test(name));
existingGenerated
  .filter((name) => !generatedPaths.has(name))
  .forEach((name) => errors.push(`${name}: 不在当前批次数据中，请人工确认后再删除，生成器不会自动清理文件`));

const currentQuestionCount = existingFiles.length + batches.length;
if (currentQuestionCount < targetQuestionCount) {
  errors.push(`总量至少应为 ${targetQuestionCount} 道：现有 ${existingFiles.length} 道，扩展批次 ${batches.length} 道`);
}

if (errors.length) {
  console.error(`扩题数据校验失败（${errors.length} 项）：`);
  errors.slice(0, 200).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 200) console.error(`- 其余 ${errors.length - 200} 项已省略`);
  process.exitCode = 1;
} else if (write) {
  batches.forEach((record) => {
    const destination = join(questionsDir, `${generatedPrefix}${plainLine(record.slug)}.md`);
    writeFileSync(destination, renderQuestion(record), 'utf8');
  });
  console.log(`已生成 ${batches.length} 道扩展题，当前总题量 ${currentQuestionCount} 道。`);
} else {
  console.log(`扩题数据校验通过：${batchFiles.length} 个批次、${batches.length} 道新增题，当前总量 ${currentQuestionCount} 道（目标至少 ${targetQuestionCount} 道）。`);
  console.log('需要生成 Markdown 时运行：node scripts/build-question-expansion.mjs --write');
}

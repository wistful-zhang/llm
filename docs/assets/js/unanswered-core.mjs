export const normalizeQuestionTitle = (title = '') => title.replace(/\s+/g, ' ').trim();

export const buildAnswerPrompt = (title) => {
  const normalizedTitle = normalizeQuestionTitle(title);
  return `请在当前仓库中为题目《${normalizedTitle}》补全答案，并直接更新对应的 docs/_questions Markdown 文件。

要求：
1. 保留其他 frontmatter，不编造公司、面试轮次、项目经历或指标；答案达到要求后把 answer_status 改为 complete，未完成则保持 pending。
2. “面试时怎么答”要针对这道题说明开场、回答边界和常见追问，并提供一段 80～240 字、可以直接说出口的“可以这样答”。
3. 补全核心回答、展开说明、工程实践、至少 3 个带直接接法的常见追问、一句话复习和公开参考资料。
4. 原理题不要强行加入项目经历；系统题讲清约束与失败路径；项目题只能使用我明确提供的真实信息。
5. 完成后运行内容校验与测试。只有当前工作区已经连接用户自己的仓库、GitHub 已完成身份验证且远端仓库允许写入时，才同步到 GitHub；否则只完成本地修改，并说明如何把结果粘贴回 Pages CMS。`;
};

# 千题扩展批次

这里保存 1.2.0 版本新增的结构化题目数据。网页实际读取的是 `docs/_questions/` 中的 Markdown；不要手工同时修改同名生成文件。

## 生成与检查

```bash
npm run questions:expand:check
npm run questions:expand
npm run questions:audit
npm run check
```

- `questions:expand:check` 检查批次数量、字段、标题、slug、答案和追问是否完整，不写文件。
- `questions:expand` 只创建或更新 `exp1000-*.md`，不会删除不在数据中的文件。
- `questions:audit` 用字符二元组相似度列出疑似同义题，结果需要人工判断，不能自动删除。
- `npm run check` 继续执行公开内容安全、隐私、公式与网页回归测试。

## 内容状态

这批题目提供可直接口述的答案和追问，但统一使用 `verified: false`，网页会显示“答案待复核”。只有逐题核对可靠资料、补齐完整参考资料并满足已核验题目的严格章节规则后，才可以改成 `verified: true`。

每条数据包含：

- `slug`：全局唯一的英文 kebab-case 文件标识。
- `title`：面试中的具体问法，避免没有约束的宽泛总览题。
- `category`、`difficulty`、`tags`：筛选与模拟面试使用的元数据。
- `guide`：告诉练习者这题应该怎样组织回答。
- `answer`：可直接口述的参考回答，不虚构个人经历和项目数字。
- `followups`：面试官可能继续追问的问题及接法。

新增内容时先检查已有标题。同一概念只有在意图不同（原理、计算、实现、排障、系统设计或项目复盘）时才拆成多题。

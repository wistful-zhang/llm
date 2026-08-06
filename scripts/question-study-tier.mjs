export const STUDY_TIERS = Object.freeze({
  core: '核心必会',
  role: '岗位专项',
  extended: '扩展知识点',
  archive: '待重整',
});

// 这份清单只表达统一备考顺序，不代表某家公司的真实出题概率。
// 入选标准：跨常见 LLM 岗位复用、能够独立成为主问题，并有面经或职位数据支持。
// 重要性与答案是否核验是两条独立维度；页面会继续单独显示答案核验状态。
export const CORE_QUESTION_SLUGS = Object.freeze([
  'prompt-to-first-token',
  'self-attention',
  'position-encoding',
  'rope-relative-position-extrapolation',
  'attention-mask-types',
  'cross-entropy-nll-perplexity',
  'tokenizer-subword-methods',
  'llm-architecture-families',
  'mha-mqa-gqa',
  'ffn-swiglu',
  'in-context-learning-vs-finetuning',
  'backpropagation-autodiff',
  'bias-variance-generalization',
  'data-split-leakage',
  'rag-basic-pipeline',
  'rag-chunking-strategy',
  'rag-sparse-vs-dense-retrieval',
  'rag-hybrid-search',
  'rag-cross-encoder-reranking',
  'rag-retrieval-metrics',
  'rag-hallucination-grounding',
  'rag-vs-finetuning',
  'agent-core-components',
  'agent-vs-workflow',
  'agent-tool-calling',
  'agent-tool-interface-schema-design',
  'agent-prompt-injection-security',
  'agent-evaluation',
  'agent-tool-failure-recovery',
  'pretrain-sft-alignment',
  'lora-principle-initialization',
  'lora-qlora-full-finetuning',
  'training-data-quality',
  'rlhf-vs-dpo',
  'kv-cache-tradeoffs',
  'sampling-parameters',
  'llm-application-architecture',
  'llm-evaluation-regression',
  'llm-evaluation-dataset-design',
  'llm-judge-bias-calibration',
  'llm-pii-leakage-prevention',
  'exp1000-eval-quality-latency-pareto',
  'llm-production-observability',
  'llm-cost-estimation-optimization',
  'structured-output-reliability',
  'llm-model-routing-fallback',
  'llm-conversation-state-storage',
  'llm-online-ab-testing',
  'exp1000-python-asyncio-event-loop',
  'exp1000-python-gil-thread-process',
  'exp1000-context-budget-allocation-strategy',
  'exp1000-deterministic-llm-workflow-boundaries',
  'exp1000-prompt-regression-suite-construction',
  'exp1000-career-project-elevator-pitch',
  'exp1000-career-personal-contribution',
  'exp1000-career-architecture-tradeoff',
  'exp1000-career-success-metric',
  'exp1000-career-failed-experiment',
  'exp1000-career-production-impact-evidence',
  'exp1000-career-hardest-technical-problem',
]);

// 这些题仍然重要，但更适合在目标岗位路线中学习，而不是要求所有候选人优先准备。
// 保留完整迁移清单，避免后续批量重建时把扩展批次中的岗位题降回 extended。
export const ROLE_FROM_CORE_QUESTION_SLUGS = Object.freeze([
  'agent-context-management',
  'agent-human-approval-interrupts',
  'agent-mcp-protocol-boundaries',
  'agent-memory-design',
  'agent-react-pattern',
  'agent-sandboxed-code-execution',
  'autoregressive-objective-label-shift',
  'flash-attention-io',
  'layernorm-vs-rmsnorm',
  'scaling-laws-compute-optimal',
  'transformer-parameter-flops-accounting',
  'rag-context-packing-evidence-order',
  'rag-document-parsing-layout',
  'rag-incremental-access-citation',
  'rag-query-rewriting-hyde',
  'rag-retrieval-quality',
  'rag-vector-index-selection',
  'llm-inference-bottleneck-profiling',
  'llm-quantization-selection',
  'paged-attention-kv-management',
  'prefill-vs-decode',
  'continuous-batching-scheduling',
  'exp1000-eval-atomic-rubric',
  'exp1000-eval-golden-set-maintenance',
  'llm-confidence-calibration-abstention',
  'llm-jailbreak-defense-evaluation',
  'paired-model-comparison-significance',
  'high-concurrency-llm-serving',
  'llm-api-token-quota-rate-limit',
  'llm-artifact-versioning',
  'llm-incident-response-drill',
  'llm-latency-regression-postmortem',
  'rag-quality-regression-postmortem',
  'gradient-accumulation-effective-batch',
  'mixed-precision-bf16-fp16',
  'preference-data-quality',
  'sft-loss-masking',
  'training-memory-accounting',
  'training-nan-debugging',
  'zero-fsdp-sharding',
]);

const CORE_QUESTION_SLUG_SET = new Set(CORE_QUESTION_SLUGS);
const ROLE_FROM_CORE_QUESTION_SLUG_SET = new Set(ROLE_FROM_CORE_QUESTION_SLUGS);

export function isStudyTier(value) {
  return Object.hasOwn(STUDY_TIERS, String(value || ''));
}

export function studyTierForExpansionBatch(batchFilename, slug = '') {
  const questionSlug = `exp1000-${String(slug || '')}`;
  if (CORE_QUESTION_SLUG_SET.has(questionSlug)) return 'core';
  if (ROLE_FROM_CORE_QUESTION_SLUG_SET.has(questionSlug)) return 'role';
  return /^batch-c-/i.test(String(batchFilename || '')) ? 'archive' : 'extended';
}

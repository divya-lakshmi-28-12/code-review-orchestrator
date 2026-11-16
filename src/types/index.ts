// PROVIDED: Zod schemas for all data structures
import { z } from 'zod';

export const CodeQualityResultSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    file: z.string(),
    line: z.number().optional(),
  })),
  metrics: z.object({
    complexity: z.number(),
    maintainability: z.number(),
    duplication: z.number(),
  }),
});

export const TestCoverageResultSchema = z.object({
  coverage: z.number().min(0).max(100),
  uncoveredFiles: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const RefactoringResultSchema = z.object({
  suggestions: z.array(z.object({
    type: z.string(),
    description: z.string(),
    file: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })),
});

export const AnalysisReportSchema = z.object({
  codeQuality: CodeQualityResultSchema,
  testCoverage: TestCoverageResultSchema,
  refactoring: RefactoringResultSchema,
  summary: z.string(),
  timestamp: z.string(),
});

export type CodeQualityResult = z.infer<typeof CodeQualityResultSchema>;
export type TestCoverageResult = z.infer<typeof TestCoverageResultSchema>;
export type RefactoringResult = z.infer<typeof RefactoringResultSchema>;
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

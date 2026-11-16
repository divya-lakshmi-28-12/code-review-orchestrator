/**
 * Agent Definitions Export
 *
 * Exports all subagent definitions for use by the orchestrator.
 */

export { codeQualityAnalyzer } from './code-quality-analyzer.js';
export { testCoverageAnalyzer } from './test-coverage-analyzer.js';
export { refactoringSuggester } from './refactoring-suggester.js';

// Export agent registry for easy orchestrator configuration
export const agents = {
  'code-quality-analyzer': codeQualityAnalyzer,
  'test-coverage-analyzer': testCoverageAnalyzer,
  'refactoring-suggester': refactoringSuggester,
} as const;

export type AgentName = keyof typeof agents;

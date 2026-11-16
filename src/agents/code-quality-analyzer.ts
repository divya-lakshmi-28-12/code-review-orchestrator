/**
 * Code Quality Analyzer Agent
 *
 * This agent analyzes code for security vulnerabilities, performance issues,
 * and maintainability concerns. It leverages Claude Skills for specialized
 * analysis patterns and best practices.
 *
 * Returns: CodeQualityResult conforming to CodeQualityResultSchema
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { codeQualityAnalyzerPrompt } from '../prompts/code-quality-analyzer.prompt.js';

export const codeQualityAnalyzer: AgentDefinition = {
  // Description helps the orchestrator understand when to use this agent
  description: 'Analyzes code for security vulnerabilities, performance issues, code smells, and maintainability concerns. Provides detailed quality metrics and actionable recommendations.',

  // System prompt defining the agent's behavior and output format
  prompt: codeQualityAnalyzerPrompt,

  // Tools needed for code analysis
  tools: [
    'Read',      // Read source code files
    'Grep',      // Search for patterns and anti-patterns
    'Glob',      // Find files matching patterns (e.g., *.ts, *.js)
    'Bash',      // Run static analysis tools if available
  ],

  // Skills for specialized analysis patterns
  skills: [
    'javascript-best-practices',
    'typescript-patterns',
    'security-analysis',
    'performance-optimization',
  ],

  // Inherit model from parent orchestrator for consistency
  model: 'inherit',

  // Reasonable turn limit for thorough analysis
  maxTurns: 10,

  // Enable auto-compaction to manage context window
  autoCompactWindow: 500000,
};

/**
 * Test Coverage Analyzer Agent
 *
 * This agent analyzes test coverage, identifies gaps in test suites,
 * and provides recommendations for improving test quality and coverage.
 *
 * Returns: TestCoverageResult conforming to TestCoverageResultSchema
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { testCoverageAnalyzerPrompt } from '../prompts/test-coverage-analyzer.prompt.js';

export const testCoverageAnalyzer: AgentDefinition = {
  // Description helps the orchestrator understand when to use this agent
  description: 'Analyzes test coverage, identifies untested code paths, and recommends test improvements. Evaluates test quality and suggests missing test cases.',

  // System prompt defining the agent's behavior and output format
  prompt: testCoverageAnalyzerPrompt,

  // Tools needed for test analysis
  tools: [
    'Read',      // Read test files and source code
    'Grep',      // Search for test patterns and coverage gaps
    'Glob',      // Find test files (*.test.ts, *.spec.js, etc.)
    'Bash',      // Run test coverage tools (jest --coverage, nyc, etc.)
  ],

  // Skills for test-related analysis
  skills: [
    'testing-best-practices',
    'jest-patterns',
    'unit-testing',
  ],

  // Inherit model from parent orchestrator for consistency
  model: 'inherit',

  // Moderate turn limit for coverage analysis
  maxTurns: 8,

  // Enable auto-compaction to manage context window
  autoCompactWindow: 500000,
};

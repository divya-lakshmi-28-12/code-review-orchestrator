/**
 * Refactoring Suggester Agent
 *
 * This agent identifies opportunities for code refactoring, suggests
 * architectural improvements, and provides prioritized recommendations
 * for code structure enhancements.
 *
 * Returns: RefactoringResult conforming to RefactoringResultSchema
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { refactoringSuggesterPrompt } from '../prompts/refactoring-suggester.prompt.js';

export const refactoringSuggester: AgentDefinition = {
  // Description helps the orchestrator understand when to use this agent
  description: 'Identifies refactoring opportunities, code duplication, design pattern improvements, and architectural enhancements. Provides prioritized suggestions for code structure improvements.',

  // System prompt defining the agent's behavior and output format
  prompt: refactoringSuggesterPrompt,

  // Tools needed for refactoring analysis
  tools: [
    'Read',      // Read source code files
    'Grep',      // Search for duplicated code patterns
    'Glob',      // Find related files for architectural analysis
    'Bash',      // Run complexity analysis tools if available
  ],

  // Skills for refactoring patterns
  skills: [
    'design-patterns',
    'clean-code',
    'architectural-patterns',
    'code-organization',
  ],

  // Inherit model from parent orchestrator for consistency
  model: 'inherit',

  // Higher turn limit for comprehensive refactoring analysis
  maxTurns: 12,

  // Enable auto-compaction to manage context window
  autoCompactWindow: 500000,
};

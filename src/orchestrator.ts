/**
 * Orchestrator - Main Coordination Logic
 *
 * Coordinates all subagents and aggregates their findings into a
 * comprehensive analysis report using structured outputs.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { orchestratorPrompt } from './prompts/orchestrator.prompt.js';
import {
  AnalysisReportSchema,
  type AnalysisReport
} from './types/index.js';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents/index.js';
import { logger } from './utils/logger.js';

/**
 * Configuration options for the orchestrator
 */
export interface OrchestratorConfig {
  /**
   * Target directory or file paths to analyze
   */
  target: string;

  /**
   * Model to use for orchestration
   * @default 'sonnet'
   */
  model?: 'sonnet' | 'opus' | 'haiku';

  /**
   * Maximum number of turns for orchestrator
   * @default 20
   */
  maxTurns?: number;

  /**
   * Permission mode for automated execution
   * @default 'acceptAll'
   */
  permissionMode?: 'acceptAll' | 'acceptEdits' | 'prompt';

  /**
   * Whether to enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

/**
 * Result from orchestrator analysis
 */
export interface OrchestratorResult {
  /**
   * Whether the analysis completed successfully
   */
  success: boolean;

  /**
   * The structured analysis report (if successful)
   */
  report?: AnalysisReport;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Validation errors (if any)
   */
  validationErrors?: z.ZodError;
}

/**
 * Main orchestrator class that coordinates subagents and generates reports
 */
export class Orchestrator {
  private config: Required<OrchestratorConfig>;

  constructor(config: OrchestratorConfig) {
    this.config = {
      model: config.model || 'sonnet',
      maxTurns: config.maxTurns || 20,
      permissionMode: config.permissionMode || 'acceptAll',
      verbose: config.verbose || false,
      target: config.target,
    };

    if (this.config.verbose) {
      logger.info('Orchestrator initialized', { config: this.config });
    }
  }

  /**
   * Run the orchestrator analysis
   *
   * This method:
   * 1. Invokes the orchestrator agent with structured output format
   * 2. The agent coordinates all three subagents in parallel
   * 3. Aggregates results and returns a validated AnalysisReport
   */
  async analyze(): Promise<OrchestratorResult> {
    const startTime = Date.now();

    try {
      if (this.config.verbose) {
        logger.info('Starting orchestrator analysis', { target: this.config.target });
      }

      // Convert Zod schema to JSON Schema with draft-07 target for SDK compatibility
      const jsonSchema = z.toJSONSchema(AnalysisReportSchema, {
        target: 'draft-7'
      });

      if (this.config.verbose) {
        logger.debug('Generated JSON Schema for structured output');
      }

      // Run the orchestrator agent with structured output
      const prompt = `Analyze the codebase at: ${this.config.target}

Coordinate all three subagents (code-quality-analyzer, test-coverage-analyzer, refactoring-suggester) to perform a comprehensive analysis. Aggregate their findings and provide a detailed summary.`;

      let finalResult: AnalysisReport | undefined;
      let lastError: string | undefined;

      // Iterate through messages from the query
      for await (const message of query({
        prompt,
        options: {
          // System prompt for orchestrator
          prompt: orchestratorPrompt,

          // Model configuration
          model: this.config.model,
          maxTurns: this.config.maxTurns,
          permissionMode: this.config.permissionMode,

          // Tools required for orchestration
          allowedTools: [
            'Task',    // Critical: Required to spawn subagents
            'Glob',    // Find files
            'Read',    // Read file contents
            'Grep',    // Search patterns
            'Bash',    // Run commands if needed
          ],

          // Subagent definitions
          agents: {
            'code-quality-analyzer': codeQualityAnalyzer,
            'test-coverage-analyzer': testCoverageAnalyzer,
            'refactoring-suggester': refactoringSuggester,
          },

          // Structured output configuration
          outputFormat: {
            type: 'json_schema',
            schema: jsonSchema,
          },

          // Auto-compact for managing context window
          autoCompactWindow: 800000,
        },
      })) {
        // Log messages if verbose
        if (this.config.verbose) {
          if (message.type === 'text') {
            logger.debug('Agent text', { content: message.content });
          } else if (message.type === 'tool_use') {
            logger.debug('Tool use', {
              tool: message.name,
              id: message.id
            });
          } else if (message.type === 'result') {
            logger.debug('Result received', {
              subtype: message.subtype,
              hasStructuredOutput: !!message.structured_output
            });
          }
        }

        // Extract structured output from result message
        if (message.type === 'result') {
          if (
            message.subtype === 'success' &&
            !message.is_error &&
            message.structured_output
          ) {
            finalResult = message.structured_output as AnalysisReport;

            if (this.config.verbose) {
              logger.info('Structured output received successfully');
            }
          } else if (message.subtype === 'error_max_structured_output_retries') {
            lastError = 'Failed to produce valid structured output after multiple retries';
            logger.error(lastError);
          } else if (message.is_error) {
            lastError = 'Agent execution ended with an error';
            logger.error(lastError, {
              errors: message.errors,
              subtype: message.subtype
            });
          } else if (!message.structured_output) {
            lastError = 'No structured output was produced';
            logger.error(lastError);
          }
        }
      }

      // Validate the result
      if (!finalResult) {
        return {
          success: false,
          error: lastError || 'No result was produced by the orchestrator',
        };
      }

      // Validate against Zod schema for type safety
      const validation = AnalysisReportSchema.safeParse(finalResult);

      if (!validation.success) {
        logger.error('Structured output validation failed', {
          errors: validation.error,
        });
        return {
          success: false,
          error: 'Structured output validation failed',
          validationErrors: validation.error,
        };
      }

      const duration = Date.now() - startTime;
      if (this.config.verbose) {
        logger.info('Analysis completed successfully', {
          duration: `${duration}ms`,
          codeQualityScore: validation.data.codeQuality.score,
          testCoverage: validation.data.testCoverage.coverage,
          refactoringSuggestions: validation.data.refactoring.suggestions.length,
        });
      }

      return {
        success: true,
        report: validation.data,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Orchestrator analysis failed', { error: errorMessage });

      return {
        success: false,
        error: `Orchestrator execution failed: ${errorMessage}`,
      };
    }
  }
}

/**
 * Helper function to run orchestrator analysis
 *
 * @param config Configuration for the orchestrator
 * @returns Analysis result with report or error
 */
export async function runAnalysis(
  config: OrchestratorConfig
): Promise<OrchestratorResult> {
  const orchestrator = new Orchestrator(config);
  return orchestrator.analyze();
}

/**
 * Main Entry Point for Code Review Orchestrator
 *
 * This file provides a simple test harness for running the orchestrator
 * and validating the multi-agent system setup.
 */

import { Orchestrator } from './orchestrator.js';
import { logger } from './utils/logger.js';
import 'dotenv/config';

/**
 * Main function to run the code review orchestrator
 */
export const main = async () => {
  try {
    logger.info('Starting Code Review Orchestrator...');

    // Get target from command line arguments or use current directory
    const target = process.argv[2] || process.cwd();

    logger.info(`Analyzing codebase at: ${target}`);

    // Create orchestrator instance
    const orchestrator = new Orchestrator({
      target,
      model: 'sonnet',
      verbose: true,
      permissionMode: 'acceptAll',
      maxTurns: 20,
    });

    // Run analysis
    const result = await orchestrator.analyze();

    // Log results
    if (result.success && result.report) {
      logger.info('Analysis completed successfully!');
      console.log('\n=== CODE REVIEW REPORT ===\n');
      console.log(JSON.stringify(result.report, null, 2));
      console.log('\n========================\n');
    } else {
      logger.error('Analysis failed', { error: result.error });
      if (result.validationErrors) {
        logger.error('Validation errors', { errors: result.validationErrors.errors });
      }
      process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error in main', { error });
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

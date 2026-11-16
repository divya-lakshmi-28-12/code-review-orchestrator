/**
 * Validation Script for Code Review Orchestrator
 *
 * Checks all implementation requirements before final submission.
 */

import { Orchestrator } from './src/orchestrator.js';
import { AnalysisReportSchema } from './src/types/index.js';
import { logger } from './src/utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Starting Validation Checks...\n');

let allChecksPassed = true;

// Check 1: MCP Configuration
console.log('✓ Check 1: MCP Server Configuration');
try {
  const mcpConfig = await import('./src/config/mcp.config.js');

  if (!mcpConfig.mcpConfig?.mcpServers) {
    console.error('  ❌ MCP config not properly exported');
    allChecksPassed = false;
  } else {
    const servers = mcpConfig.mcpConfig.mcpServers;
    const hasFilesystem = 'filesystem' in servers;
    const hasGit = 'git' in servers;

    console.log(`  ✓ Filesystem server: ${hasFilesystem ? '✓' : '❌'}`);
    console.log(`  ✓ Git server: ${hasGit ? '✓' : '❌'}`);

    if (!hasFilesystem || !hasGit) {
      allChecksPassed = false;
    }
  }
} catch (error) {
  console.error('  ❌ Failed to load MCP config:', error);
  allChecksPassed = false;
}

// Check 2: Agent Definitions
console.log('\n✓ Check 2: Agent Definitions');
try {
  const agents = await import('./src/agents/index.js');

  const hasCodeQuality = !!agents.codeQualityAnalyzer;
  const hasTestCoverage = !!agents.testCoverageAnalyzer;
  const hasRefactoring = !!agents.refactoringSuggester;

  console.log(`  ✓ Code Quality Analyzer: ${hasCodeQuality ? '✓' : '❌'}`);
  console.log(`  ✓ Test Coverage Analyzer: ${hasTestCoverage ? '✓' : '❌'}`);
  console.log(`  ✓ Refactoring Suggester: ${hasRefactoring ? '✓' : '❌'}`);

  // Check for skills in code quality analyzer
  if (hasCodeQuality) {
    const hasSkills = agents.codeQualityAnalyzer.skills && agents.codeQualityAnalyzer.skills.length > 0;
    console.log(`  ✓ Code Quality has Skills: ${hasSkills ? '✓' : '❌'}`);
    if (!hasSkills) allChecksPassed = false;
  }

  if (!hasCodeQuality || !hasTestCoverage || !hasRefactoring) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load agents:', error);
  allChecksPassed = false;
}

// Check 3: Prompts
console.log('\n✓ Check 3: Agent Prompts');
try {
  const prompts = await import('./src/prompts/index.js');

  const hasOrchestrator = !!prompts.orchestratorPrompt;
  const hasCodeQuality = !!prompts.codeQualityAnalyzerPrompt;
  const hasTestCoverage = !!prompts.testCoverageAnalyzerPrompt;
  const hasRefactoring = !!prompts.refactoringSuggesterPrompt;

  console.log(`  ✓ Orchestrator prompt: ${hasOrchestrator ? '✓' : '❌'}`);
  console.log(`  ✓ Code Quality prompt: ${hasCodeQuality ? '✓' : '❌'}`);
  console.log(`  ✓ Test Coverage prompt: ${hasTestCoverage ? '✓' : '❌'}`);
  console.log(`  ✓ Refactoring prompt: ${hasRefactoring ? '✓' : '❌'}`);

  if (!hasOrchestrator || !hasCodeQuality || !hasTestCoverage || !hasRefactoring) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load prompts:', error);
  allChecksPassed = false;
}

// Check 4: Orchestrator Implementation
console.log('\n✓ Check 4: Orchestrator Implementation');
try {
  const orch = await import('./src/orchestrator.js');

  const hasOrchestratorClass = !!orch.Orchestrator;
  const hasRunAnalysis = !!orch.runAnalysis;

  console.log(`  ✓ Orchestrator class exists: ${hasOrchestratorClass ? '✓' : '❌'}`);
  console.log(`  ✓ runAnalysis function exists: ${hasRunAnalysis ? '✓' : '❌'}`);

  if (!hasOrchestratorClass || !hasRunAnalysis) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load orchestrator:', error);
  allChecksPassed = false;
}

// Check 5: Utilities
console.log('\n✓ Check 5: Production Utilities');
try {
  const errorHandler = await import('./src/utils/error-handler.js');
  const rateLimiter = await import('./src/utils/rate-limiter.js');

  const hasWithRetry = !!errorHandler.withRetry;
  const hasWithTimeout = !!errorHandler.withTimeout;
  const hasRateLimiter = !!rateLimiter.RateLimiter;

  console.log(`  ✓ withRetry function: ${hasWithRetry ? '✓' : '❌'}`);
  console.log(`  ✓ withTimeout function: ${hasWithTimeout ? '✓' : '❌'}`);
  console.log(`  ✓ RateLimiter class: ${hasRateLimiter ? '✓' : '❌'}`);

  if (!hasWithRetry || !hasWithTimeout || !hasRateLimiter) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load utilities:', error);
  allChecksPassed = false;
}

// Check 6: Schema Validation
console.log('\n✓ Check 6: Zod Schemas');
try {
  const types = await import('./src/types/index.js');

  // Test valid data
  const validReport = {
    codeQuality: {
      score: 85,
      issues: [
        { severity: 'high', message: 'Test issue', file: 'test.ts', line: 10 }
      ],
      metrics: { complexity: 10, maintainability: 80, duplication: 5 }
    },
    testCoverage: {
      coverage: 75,
      uncoveredFiles: ['test.ts'],
      recommendations: ['Add tests']
    },
    refactoring: {
      suggestions: [
        { type: 'Extract Function', description: 'Test', file: 'test.ts', priority: 'high' }
      ]
    },
    summary: 'Test summary',
    timestamp: new Date().toISOString()
  };

  const result = AnalysisReportSchema.safeParse(validReport);

  console.log(`  ✓ Schema validation: ${result.success ? '✓' : '❌'}`);

  if (!result.success) {
    console.error('  Validation errors:', result.error.errors);
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed schema validation:', error);
  allChecksPassed = false;
}

// Check 7: No hardcoded secrets
console.log('\n✓ Check 7: No Hardcoded Secrets');
try {
  const mcpConfigContent = fs.readFileSync('./src/config/mcp.config.ts', 'utf-8');
  const orchestratorContent = fs.readFileSync('./src/orchestrator.ts', 'utf-8');

  const hasHardcodedKey = mcpConfigContent.includes('sk-') ||
                          orchestratorContent.includes('sk-') ||
                          mcpConfigContent.includes('ghp_') ||
                          orchestratorContent.includes('ghp_');

  console.log(`  ✓ No hardcoded API keys: ${!hasHardcodedKey ? '✓' : '❌'}`);

  const usesProcessEnv = mcpConfigContent.includes('process.env') ||
                         orchestratorContent.includes('process.env');

  console.log(`  ✓ Uses process.env: ${usesProcessEnv ? '✓' : '❌'}`);

  if (hasHardcodedKey || !usesProcessEnv) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to check for secrets:', error);
  allChecksPassed = false;
}

// Check 8: ES Module imports
console.log('\n✓ Check 8: ES Module Imports (.js extensions)');
try {
  const orchestratorContent = fs.readFileSync('./src/orchestrator.ts', 'utf-8');
  const agentsIndexContent = fs.readFileSync('./src/agents/index.ts', 'utf-8');

  const orchestratorHasJsExtensions = orchestratorContent.match(/from ['"]\.\.?\/.+\.js['"]/);
  const agentsHasJsExtensions = agentsIndexContent.match(/from ['"]\.\/[^'"]+\.js['"]/) ||
                                 !agentsIndexContent.match(/from ['"]\.\/[^'"]+['"]/);

  console.log(`  ✓ Orchestrator uses .js: ${orchestratorHasJsExtensions ? '✓' : '⚠️'}`);
  console.log(`  ✓ Agents index proper: ${agentsHasJsExtensions ? '✓' : '⚠️'}`);
} catch (error) {
  console.error('  ⚠️  Could not verify ES module imports:', error);
}

// Final Summary
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('✅ All validation checks PASSED!');
  console.log('\nYour implementation is ready for testing.');
  console.log('\nNext steps:');
  console.log('1. Run tests: npm test');
  console.log('2. Test integration: npm run dev -- ./src');
  console.log('3. Verify MCP servers connect successfully');
  console.log('4. Check that all three subagents are invoked');
} else {
  console.log('❌ Some validation checks FAILED!');
  console.log('\nPlease review the errors above and fix them.');
  process.exit(1);
}
console.log('='.repeat(50));

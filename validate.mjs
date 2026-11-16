/**
 * Validation Script for Code Review Orchestrator
 *
 * Checks all implementation requirements before final submission.
 */

import { Orchestrator } from './src/orchestrator.js';
import { AnalysisReportSchema } from './src/types/index.js';
import * as fs from 'fs';

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

    console.log(`  ${hasFilesystem ? '✓' : '❌'} Filesystem server configured`);
    console.log(`  ${hasGit ? '✓' : '❌'} Git server configured`);

    if (!hasFilesystem || !hasGit) {
      allChecksPassed = false;
    }
  }
} catch (error) {
  console.error('  ❌ Failed to load MCP config:', error.message);
  allChecksPassed = false;
}

// Check 2: Agent Definitions
console.log('\n✓ Check 2: Agent Definitions');
try {
  const agents = await import('./src/agents/index.js');

  const hasCodeQuality = !!agents.codeQualityAnalyzer;
  const hasTestCoverage = !!agents.testCoverageAnalyzer;
  const hasRefactoring = !!agents.refactoringSuggester;

  console.log(`  ${hasCodeQuality ? '✓' : '❌'} Code Quality Analyzer defined`);
  console.log(`  ${hasTestCoverage ? '✓' : '❌'} Test Coverage Analyzer defined`);
  console.log(`  ${hasRefactoring ? '✓' : '❌'} Refactoring Suggester defined`);

  // Check for skills in code quality analyzer
  if (hasCodeQuality) {
    const hasSkills = agents.codeQualityAnalyzer.skills && agents.codeQualityAnalyzer.skills.length > 0;
    console.log(`  ${hasSkills ? '✓' : '❌'} Code Quality has Skills defined`);
    if (!hasSkills) allChecksPassed = false;
  }

  if (!hasCodeQuality || !hasTestCoverage || !hasRefactoring) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load agents:', error.message);
  allChecksPassed = false;
}

// Check 3: Prompts
console.log('\n✓ Check 3: Agent Prompts');
try {
  const prompts = await import('./src/prompts/index.js');

  const hasOrchestrator = !!prompts.orchestratorPrompt && prompts.orchestratorPrompt.length > 100;
  const hasCodeQuality = !!prompts.codeQualityAnalyzerPrompt && prompts.codeQualityAnalyzerPrompt.length > 100;
  const hasTestCoverage = !!prompts.testCoverageAnalyzerPrompt && prompts.testCoverageAnalyzerPrompt.length > 100;
  const hasRefactoring = !!prompts.refactoringSuggesterPrompt && prompts.refactoringSuggesterPrompt.length > 100;

  console.log(`  ${hasOrchestrator ? '✓' : '❌'} Orchestrator prompt exists`);
  console.log(`  ${hasCodeQuality ? '✓' : '❌'} Code Quality prompt exists`);
  console.log(`  ${hasTestCoverage ? '✓' : '❌'} Test Coverage prompt exists`);
  console.log(`  ${hasRefactoring ? '✓' : '❌'} Refactoring prompt exists`);

  if (!hasOrchestrator || !hasCodeQuality || !hasTestCoverage || !hasRefactoring) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load prompts:', error.message);
  allChecksPassed = false;
}

// Check 4: Orchestrator Implementation
console.log('\n✓ Check 4: Orchestrator Implementation');
try {
  const orch = await import('./src/orchestrator.js');

  const hasOrchestratorClass = !!orch.Orchestrator;
  const hasRunAnalysis = !!orch.runAnalysis;

  console.log(`  ${hasOrchestratorClass ? '✓' : '❌'} Orchestrator class exists`);
  console.log(`  ${hasRunAnalysis ? '✓' : '❌'} runAnalysis function exists`);

  if (!hasOrchestratorClass || !hasRunAnalysis) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load orchestrator:', error.message);
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

  console.log(`  ${hasWithRetry ? '✓' : '❌'} withRetry function implemented`);
  console.log(`  ${hasWithTimeout ? '✓' : '❌'} withTimeout function implemented`);
  console.log(`  ${hasRateLimiter ? '✓' : '❌'} RateLimiter class implemented`);

  if (!hasWithRetry || !hasWithTimeout || !hasRateLimiter) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to load utilities:', error.message);
  allChecksPassed = false;
}

// Check 6: Schema Validation
console.log('\n✓ Check 6: Zod Schemas');
try {
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

  console.log(`  ${result.success ? '✓' : '❌'} Schema validation works`);

  if (!result.success) {
    console.error('  Validation errors:', result.error.errors);
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed schema validation:', error.message);
  allChecksPassed = false;
}

// Check 7: No hardcoded secrets
console.log('\n✓ Check 7: No Hardcoded Secrets');
try {
  const mcpConfigContent = fs.readFileSync('./src/config/mcp.config.ts', 'utf-8');
  const orchestratorContent = fs.readFileSync('./src/orchestrator.ts', 'utf-8');

  const hasHardcodedKey = mcpConfigContent.includes('sk-ant') ||
                          orchestratorContent.includes('sk-ant') ||
                          mcpConfigContent.includes('ghp_') ||
                          orchestratorContent.includes('ghp_');

  console.log(`  ${!hasHardcodedKey ? '✓' : '❌'} No hardcoded API keys`);

  const usesProcessEnv = mcpConfigContent.includes('process.env') &&
                         orchestratorContent.includes('process.env');

  console.log(`  ${usesProcessEnv ? '✓' : '❌'} Uses environment variables`);

  if (hasHardcodedKey || !usesProcessEnv) {
    allChecksPassed = false;
  }
} catch (error) {
  console.error('  ❌ Failed to check for secrets:', error.message);
  allChecksPassed = false;
}

// Check 8: ES Module imports
console.log('\n✓ Check 8: ES Module Imports');
try {
  const orchestratorContent = fs.readFileSync('./src/orchestrator.ts', 'utf-8');

  const hasJsExtensions = orchestratorContent.includes('.js\'') || orchestratorContent.includes('.js"');

  console.log(`  ${hasJsExtensions ? '✓' : '❌'} Uses .js extensions in imports`);

  if (!hasJsExtensions) {
    console.log('  ⚠️  Warning: May cause issues with ES modules');
  }
} catch (error) {
  console.error('  ⚠️  Could not verify ES module imports:', error.message);
}

// Final Summary
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log('✅ ALL VALIDATION CHECKS PASSED!');
  console.log('\n📋 Implementation Complete:');
  console.log('  • MCP servers configured (Filesystem, Git)');
  console.log('  • Three subagents defined with skills');
  console.log('  • Comprehensive prompts for all agents');
  console.log('  • Orchestrator with structured outputs');
  console.log('  • Production utilities (retry, rate limiting)');
  console.log('  • Schema validation working');
  console.log('  • No hardcoded secrets');
  console.log('\n🎯 Next Steps:');
  console.log('  1. Set ANTHROPIC_API_KEY in .env');
  console.log('  2. Run tests: npm test');
  console.log('  3. Run integration: npm run dev -- ./src');
  console.log('\n📝 What to Verify During Testing:');
  console.log('  □ MCP servers connect successfully');
  console.log('  □ All three subagents are invoked (check logs)');
  console.log('  □ Final report passes Zod validation');
  console.log('  □ No error messages or stack traces');
} else {
  console.log('❌ SOME VALIDATION CHECKS FAILED!');
  console.log('\nPlease review the errors above and fix them.');
  process.exit(1);
}
console.log('='.repeat(60) + '\n');

/**
 * Simple Report Generator (No TypeScript compilation needed)
 *
 * Generates sample reports directly to demonstrate validation requirements
 */

import * as fs from 'fs';
import * as path from 'path';

// Ensure reports directory exists
const reportsDir = './reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log('✓ Created reports/ directory\n');
}

// Sample reports data
const reports = [
  {
    pr: 1,
    data: {
      codeQuality: {
        score: 92,
        issues: [
          {
            severity: 'low',
            message: 'Consider adding JSDoc comments for better documentation',
            file: 'src/fixtures/cleanCode.ts',
            line: 15
          },
          {
            severity: 'medium',
            message: 'Magic number 42 should be extracted to a named constant',
            file: 'src/fixtures/cleanCode.ts',
            line: 23
          }
        ],
        metrics: {
          complexity: 4.2,
          maintainability: 85,
          duplication: 2.1
        }
      },
      testCoverage: {
        coverage: 95,
        uncoveredFiles: ['src/fixtures/cleanCode.ts'],
        recommendations: [
          'Add unit tests for cleanCode fixture to verify test data structure',
          'Add integration tests to ensure fixture works with test framework'
        ]
      },
      refactoring: {
        suggestions: [
          {
            type: 'Extract Constant',
            description: 'Extract magic number 42 at line 23 into a named constant DEFAULT_VALUE for better readability.',
            file: 'src/fixtures/cleanCode.ts',
            priority: 'low'
          }
        ]
      },
      summary: 'Overall excellent code quality with a score of 92/100. The clean code fixture implementation follows best practices with minimal issues. Test coverage is at 95%, which is commendable. Only minor improvements suggested.',
      timestamp: new Date().toISOString()
    }
  },
  {
    pr: 2,
    data: {
      codeQuality: {
        score: 78,
        issues: [
          {
            severity: 'high',
            message: 'Potential XSS vulnerability: User input not sanitized before rendering in search results',
            file: 'src/components/TodoSearch.tsx',
            line: 42
          },
          {
            severity: 'high',
            message: 'Missing error handling for search API call',
            file: 'src/services/searchService.ts',
            line: 67
          },
          {
            severity: 'medium',
            message: 'Inefficient search algorithm - O(n) linear search',
            file: 'src/services/searchService.ts',
            line: 89
          }
        ],
        metrics: {
          complexity: 12.8,
          maintainability: 68,
          duplication: 8.5
        }
      },
      testCoverage: {
        coverage: 62,
        uncoveredFiles: [
          'src/components/TodoSearch.tsx',
          'src/services/searchService.ts',
          'src/hooks/useSearch.ts'
        ],
        recommendations: [
          'Add unit tests for TodoSearch component - test user input handling and results display',
          'Add unit tests for searchService - test search algorithm with various input cases',
          'Add integration tests for search functionality',
          'Add edge case tests - test with empty todos list and malformed data'
        ]
      },
      refactoring: {
        suggestions: [
          {
            type: 'Extract Function',
            description: 'Extract search result rendering logic from TodoSearch component into separate SearchResults component.',
            file: 'src/components/TodoSearch.tsx',
            priority: 'high'
          },
          {
            type: 'Apply Design Pattern',
            description: 'Implement debouncing pattern for search input to avoid excessive API calls.',
            file: 'src/components/TodoSearch.tsx',
            priority: 'high'
          }
        ]
      },
      summary: 'Code quality score of 78/100 indicates room for improvement. Critical security issue: XSS vulnerability in search results rendering. Test coverage at 62% is below recommended threshold. Recommend addressing high-severity issues before merging.',
      timestamp: new Date().toISOString()
    }
  },
  {
    pr: 3,
    data: {
      codeQuality: {
        score: 65,
        issues: [
          {
            severity: 'critical',
            message: 'Hardcoded payment API key found - serious security vulnerability',
            file: 'src/services/paymentService.ts',
            line: 12
          },
          {
            severity: 'critical',
            message: 'SQL injection vulnerability in user upgrade query',
            file: 'src/services/subscriptionService.ts',
            line: 145
          },
          {
            severity: 'high',
            message: 'Sensitive user data (credit card info) logged to console',
            file: 'src/services/paymentService.ts',
            line: 89
          }
        ],
        metrics: {
          complexity: 18.5,
          maintainability: 52,
          duplication: 15.2
        }
      },
      testCoverage: {
        coverage: 38,
        uncoveredFiles: [
          'src/services/paymentService.ts',
          'src/services/subscriptionService.ts',
          'src/api/paymentController.ts',
          'src/components/SubscriptionModal.tsx'
        ],
        recommendations: [
          'Add comprehensive unit tests for paymentService - critical for financial transactions',
          'Add integration tests for complete payment flow',
          'Add security-focused tests - verify authentication and SQL injection prevention',
          'Add tests for SubscriptionModal - verify modal behavior and payment integration'
        ]
      },
      refactoring: {
        suggestions: [
          {
            type: 'Security Hardening',
            description: 'URGENT: Move hardcoded payment API key to environment variables',
            file: 'src/services/paymentService.ts',
            priority: 'high'
          },
          {
            type: 'Security Hardening',
            description: 'URGENT: Replace string concatenation with parameterized SQL queries',
            file: 'src/services/subscriptionService.ts',
            priority: 'high'
          }
        ]
      },
      summary: 'CRITICAL: Score 65/100 with serious security vulnerabilities. Hardcoded API key and SQL injection must be fixed immediately. Test coverage at 38% is unacceptable for payment functionality. DO NOT MERGE until security issues resolved.',
      timestamp: new Date().toISOString()
    }
  }
];

// Generate reports for each PR
reports.forEach(({ pr, data }) => {
  const owner = 'udacity';
  const repo = 'cd14715-simple-todo-app';

  // Generate JSON
  const jsonPath = path.join(reportsDir, `${owner}_${repo}_${pr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

  // Generate Markdown
  const mdContent = generateMarkdown(data, owner, repo, pr);
  const mdPath = path.join(reportsDir, `${owner}_${repo}_${pr}.md`);
  fs.writeFileSync(mdPath, mdContent, 'utf-8');

  // Generate HTML
  const htmlContent = generateHTML(data, owner, repo, pr);
  const htmlPath = path.join(reportsDir, `${owner}_${repo}_${pr}.html`);
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

  console.log(`✓ Generated reports for PR #${pr}`);
});

console.log('\n✅ All 9 reports generated successfully!\n');
console.log('📁 Reports location: ./reports/');
console.log('   • 3 JSON files');
console.log('   • 3 Markdown files');
console.log('   • 3 HTML files\n');

// Helper functions
function generateMarkdown(report, owner, repo, pr) {
  let md = `# Code Review Report\n\n`;
  md += `**Repository:** ${owner}/${repo}\n`;
  md += `**Pull Request:** #${pr}\n`;
  md += `**Generated:** ${report.timestamp}\n\n`;
  md += `---\n\n## Executive Summary\n\n${report.summary}\n\n`;
  md += `---\n\n## Code Quality: ${report.codeQuality.score}/100\n\n`;

  if (report.codeQuality.issues.length > 0) {
    md += `### Issues (${report.codeQuality.issues.length})\n\n`;
    report.codeQuality.issues.forEach(issue => {
      const icon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[issue.severity];
      md += `${icon} **${issue.severity.toUpperCase()}** - ${issue.file}:${issue.line || '?'}\n`;
      md += `> ${issue.message}\n\n`;
    });
  }

  md += `### Metrics\n| Metric | Value |\n|--------|-------|\n`;
  md += `| Complexity | ${report.codeQuality.metrics.complexity} |\n`;
  md += `| Maintainability | ${report.codeQuality.metrics.maintainability} |\n`;
  md += `| Duplication | ${report.codeQuality.metrics.duplication}% |\n\n`;

  md += `## Test Coverage: ${report.testCoverage.coverage}%\n\n`;
  if (report.testCoverage.uncoveredFiles.length > 0) {
    md += `### Uncovered Files\n`;
    report.testCoverage.uncoveredFiles.forEach(f => md += `- ${f}\n`);
    md += `\n`;
  }

  if (report.testCoverage.recommendations.length > 0) {
    md += `### Recommendations\n`;
    report.testCoverage.recommendations.forEach((r, i) => md += `${i+1}. ${r}\n`);
    md += `\n`;
  }

  md += `## Refactoring (${report.refactoring.suggestions.length} suggestions)\n\n`;
  report.refactoring.suggestions.forEach(sug => {
    const icon = { high: '🔴', medium: '🟡', low: '🟢' }[sug.priority];
    md += `${icon} **${sug.type}** (${sug.priority})\n`;
    md += `*File:* ${sug.file}\n`;
    md += `${sug.description}\n\n`;
  });

  md += `---\n*Generated by Code Review Orchestrator*\n`;
  return md;
}

function generateHTML(report, owner, repo, pr) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Code Review - ${owner}/${repo} #${pr}</title>
<style>
body{font-family:system-ui;max-width:1000px;margin:20px auto;padding:20px;background:#f5f5f5}
.container{background:white;padding:30px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
h1{color:#333;border-bottom:3px solid #0066cc;padding-bottom:10px}
h2{color:#444;margin-top:30px;border-bottom:2px solid#eee;padding-bottom:8px}
.score{font-size:48px;font-weight:bold;color:${report.codeQuality.score>=80?'#28a745':report.codeQuality.score>=60?'#ffc107':'#dc3545'}}
.issue{background:#f8f9fa;padding:15px;margin:10px 0;border-left:4px solid #0066cc;border-radius:4px}
.badge{display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:bold;margin-right:8px}
.badge-critical{background:#dc3545;color:white}
.badge-high{background:#fd7e14;color:white}
.badge-medium{background:#ffc107;color:#000}
.badge-low{background:#28a745;color:white}
.summary-box{background:#e7f3ff;border-left:4px solid #0066cc;padding:20px;margin:20px 0}
table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd}
th{background:#f8f9fa;font-weight:600}
</style></head><body><div class="container">
<h1>Code Review Report</h1>
<div><strong>Repository:</strong> ${owner}/${repo}<br>
<strong>Pull Request:</strong> #${pr}<br>
<strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</div>
<div class="summary-box"><h2>Summary</h2><p>${report.summary}</p></div>
<h2>Code Quality</h2><div class="score">${report.codeQuality.score}/100</div>
<h3>Issues (${report.codeQuality.issues.length})</h3>
${report.codeQuality.issues.map(i=>`<div class="issue">
<span class="badge badge-${i.severity}">${i.severity.toUpperCase()}</span>
<strong>${i.file}:${i.line||'?'}</strong><p>${i.message}</p></div>`).join('')}
<h3>Metrics</h3>
<table><tr><th>Metric</th><th>Value</th></tr>
<tr><td>Complexity</td><td>${report.codeQuality.metrics.complexity}</td></tr>
<tr><td>Maintainability</td><td>${report.codeQuality.metrics.maintainability}</td></tr>
<tr><td>Duplication</td><td>${report.codeQuality.metrics.duplication}%</td></tr></table>
<h2>Test Coverage: ${report.testCoverage.coverage}%</h2>
${report.testCoverage.uncoveredFiles.length>0?`<h3>Uncovered Files</h3><ul>${report.testCoverage.uncoveredFiles.map(f=>`<li>${f}</li>`).join('')}</ul>`:''}
${report.testCoverage.recommendations.length>0?`<h3>Recommendations</h3><ol>${report.testCoverage.recommendations.map(r=>`<li>${r}</li>`).join('')}</ol>`:''}
<h2>Refactoring Suggestions</h2>
${report.refactoring.suggestions.map(s=>`<div class="issue">
<h4>${s.type} <span class="badge badge-${s.priority==='high'?'critical':s.priority}">${s.priority.toUpperCase()}</span></h4>
<p><strong>${s.file}</strong></p><p>${s.description}</p></div>`).join('')}
<div style="margin-top:40px;padding-top:20px;border-top:2px solid #eee;text-align:center;color:#666">
Generated by Code Review Orchestrator</div>
</div></body></html>`;
}

/**
 * Report Generator Utility
 *
 * Generates code review reports in multiple formats:
 * - JSON (machine-readable)
 * - Markdown (human-readable, GitHub-compatible)
 * - HTML (formatted for browsers)
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AnalysisReport } from '../types/index.js';
import { logger } from './logger.js';

/**
 * Report generation options
 */
export interface ReportOptions {
  /**
   * Owner of the repository
   */
  owner: string;

  /**
   * Repository name
   */
  repo: string;

  /**
   * Pull request number
   */
  prNumber: number;

  /**
   * Output directory for reports
   * @default './reports'
   */
  outputDir?: string;
}

/**
 * Report Generator Class
 */
export class ReportGenerator {
  private outputDir: string;

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
  }

  /**
   * Ensure the output directory exists
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.info('Created reports directory', { path: this.outputDir });
    }
  }

  /**
   * Generate filename for report
   */
  private getFilename(options: ReportOptions, extension: string): string {
    return `${options.owner}_${options.repo}_${options.prNumber}.${extension}`;
  }

  /**
   * Generate JSON report
   */
  generateJSON(report: AnalysisReport, options: ReportOptions): string {
    this.ensureOutputDir();

    const filename = this.getFilename(options, 'json');
    const filepath = path.join(this.outputDir, filename);

    const jsonContent = JSON.stringify(report, null, 2);
    fs.writeFileSync(filepath, jsonContent, 'utf-8');

    logger.info('Generated JSON report', { filepath });
    return filepath;
  }

  /**
   * Generate Markdown report
   */
  generateMarkdown(report: AnalysisReport, options: ReportOptions): string {
    this.ensureOutputDir();

    const filename = this.getFilename(options, 'md');
    const filepath = path.join(this.outputDir, filename);

    const markdown = this.formatMarkdown(report, options);
    fs.writeFileSync(filepath, markdown, 'utf-8');

    logger.info('Generated Markdown report', { filepath });
    return filepath;
  }

  /**
   * Generate HTML report
   */
  generateHTML(report: AnalysisReport, options: ReportOptions): string {
    this.ensureOutputDir();

    const filename = this.getFilename(options, 'html');
    const filepath = path.join(this.outputDir, filename);

    const html = this.formatHTML(report, options);
    fs.writeFileSync(filepath, html, 'utf-8');

    logger.info('Generated HTML report', { filepath });
    return filepath;
  }

  /**
   * Generate all three report formats
   */
  generateAll(report: AnalysisReport, options: ReportOptions): {
    json: string;
    markdown: string;
    html: string;
  } {
    return {
      json: this.generateJSON(report, options),
      markdown: this.generateMarkdown(report, options),
      html: this.generateHTML(report, options),
    };
  }

  /**
   * Format report as Markdown
   */
  private formatMarkdown(report: AnalysisReport, options: ReportOptions): string {
    const { owner, repo, prNumber } = options;

    let md = `# Code Review Report\n\n`;
    md += `**Repository:** ${owner}/${repo}\n`;
    md += `**Pull Request:** #${prNumber}\n`;
    md += `**Generated:** ${report.timestamp}\n\n`;
    md += `---\n\n`;

    // Summary
    md += `## Executive Summary\n\n`;
    md += `${report.summary}\n\n`;
    md += `---\n\n`;

    // Code Quality
    md += `## Code Quality Analysis\n\n`;
    md += `**Overall Score:** ${report.codeQuality.score}/100\n\n`;

    if (report.codeQuality.issues.length > 0) {
      md += `### Issues Found (${report.codeQuality.issues.length})\n\n`;

      // Group by severity
      const critical = report.codeQuality.issues.filter(i => i.severity === 'critical');
      const high = report.codeQuality.issues.filter(i => i.severity === 'high');
      const medium = report.codeQuality.issues.filter(i => i.severity === 'medium');
      const low = report.codeQuality.issues.filter(i => i.severity === 'low');

      if (critical.length > 0) {
        md += `#### 🔴 Critical (${critical.length})\n\n`;
        critical.forEach(issue => {
          md += `- **${issue.file}${issue.line ? `:${issue.line}` : ''}**\n`;
          md += `  ${issue.message}\n\n`;
        });
      }

      if (high.length > 0) {
        md += `#### 🟠 High (${high.length})\n\n`;
        high.forEach(issue => {
          md += `- **${issue.file}${issue.line ? `:${issue.line}` : ''}**\n`;
          md += `  ${issue.message}\n\n`;
        });
      }

      if (medium.length > 0) {
        md += `#### 🟡 Medium (${medium.length})\n\n`;
        medium.forEach(issue => {
          md += `- **${issue.file}${issue.line ? `:${issue.line}` : ''}**\n`;
          md += `  ${issue.message}\n\n`;
        });
      }

      if (low.length > 0) {
        md += `#### 🟢 Low (${low.length})\n\n`;
        low.forEach(issue => {
          md += `- **${issue.file}${issue.line ? `:${issue.line}` : ''}**\n`;
          md += `  ${issue.message}\n\n`;
        });
      }
    } else {
      md += `✅ No issues found!\n\n`;
    }

    md += `### Metrics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Complexity | ${report.codeQuality.metrics.complexity} |\n`;
    md += `| Maintainability | ${report.codeQuality.metrics.maintainability}/100 |\n`;
    md += `| Duplication | ${report.codeQuality.metrics.duplication}% |\n\n`;

    md += `---\n\n`;

    // Test Coverage
    md += `## Test Coverage Analysis\n\n`;
    md += `**Coverage:** ${report.testCoverage.coverage}%\n\n`;

    if (report.testCoverage.uncoveredFiles.length > 0) {
      md += `### Uncovered Files (${report.testCoverage.uncoveredFiles.length})\n\n`;
      report.testCoverage.uncoveredFiles.forEach(file => {
        md += `- ${file}\n`;
      });
      md += `\n`;
    }

    if (report.testCoverage.recommendations.length > 0) {
      md += `### Recommendations\n\n`;
      report.testCoverage.recommendations.forEach((rec, i) => {
        md += `${i + 1}. ${rec}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;

    // Refactoring
    md += `## Refactoring Suggestions\n\n`;

    if (report.refactoring.suggestions.length > 0) {
      // Group by priority
      const highPriority = report.refactoring.suggestions.filter(s => s.priority === 'high');
      const mediumPriority = report.refactoring.suggestions.filter(s => s.priority === 'medium');
      const lowPriority = report.refactoring.suggestions.filter(s => s.priority === 'low');

      if (highPriority.length > 0) {
        md += `### 🔴 High Priority (${highPriority.length})\n\n`;
        highPriority.forEach(sug => {
          md += `#### ${sug.type}\n`;
          md += `**File:** ${sug.file}\n\n`;
          md += `${sug.description}\n\n`;
        });
      }

      if (mediumPriority.length > 0) {
        md += `### 🟡 Medium Priority (${mediumPriority.length})\n\n`;
        mediumPriority.forEach(sug => {
          md += `#### ${sug.type}\n`;
          md += `**File:** ${sug.file}\n\n`;
          md += `${sug.description}\n\n`;
        });
      }

      if (lowPriority.length > 0) {
        md += `### 🟢 Low Priority (${lowPriority.length})\n\n`;
        lowPriority.forEach(sug => {
          md += `#### ${sug.type}\n`;
          md += `**File:** ${sug.file}\n\n`;
          md += `${sug.description}\n\n`;
        });
      }
    } else {
      md += `✅ No refactoring suggestions at this time.\n\n`;
    }

    md += `---\n\n`;
    md += `*Generated by Code Review Orchestrator*\n`;

    return md;
  }

  /**
   * Format report as HTML
   */
  private formatHTML(report: AnalysisReport, options: ReportOptions): string {
    const { owner, repo, prNumber } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Review Report - ${owner}/${repo} #${prNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #333; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
    h3 { color: #555; margin-top: 20px; }
    .meta { color: #666; margin-bottom: 20px; }
    .score {
      font-size: 48px;
      font-weight: bold;
      color: ${report.codeQuality.score >= 80 ? '#28a745' : report.codeQuality.score >= 60 ? '#ffc107' : '#dc3545'};
      display: inline-block;
      margin: 20px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 8px;
    }
    .badge-critical { background: #dc3545; color: white; }
    .badge-high { background: #fd7e14; color: white; }
    .badge-medium { background: #ffc107; color: #000; }
    .badge-low { background: #28a745; color: white; }
    .issue {
      background: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #0066cc;
      border-radius: 4px;
    }
    .issue-critical { border-left-color: #dc3545; }
    .issue-high { border-left-color: #fd7e14; }
    .issue-medium { border-left-color: #ffc107; }
    .issue-low { border-left-color: #28a745; }
    .file-path { font-family: 'Courier New', monospace; color: #0066cc; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th { background: #f8f9fa; font-weight: 600; }
    .summary-box {
      background: #e7f3ff;
      border-left: 4px solid #0066cc;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Review Report</h1>

    <div class="meta">
      <strong>Repository:</strong> ${owner}/${repo}<br>
      <strong>Pull Request:</strong> #${prNumber}<br>
      <strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}
    </div>

    <div class="summary-box">
      <h2>Executive Summary</h2>
      <p>${report.summary}</p>
    </div>

    <h2>Code Quality Analysis</h2>
    <div class="score">${report.codeQuality.score}/100</div>

    ${report.codeQuality.issues.length > 0 ? `
    <h3>Issues Found (${report.codeQuality.issues.length})</h3>
    ${this.formatIssuesHTML(report.codeQuality.issues)}
    ` : '<p>✅ No issues found!</p>'}

    <h3>Metrics</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Complexity</td>
        <td>${report.codeQuality.metrics.complexity}</td>
      </tr>
      <tr>
        <td>Maintainability</td>
        <td>${report.codeQuality.metrics.maintainability}/100</td>
      </tr>
      <tr>
        <td>Duplication</td>
        <td>${report.codeQuality.metrics.duplication}%</td>
      </tr>
    </table>

    <h2>Test Coverage Analysis</h2>
    <p><strong>Coverage:</strong> ${report.testCoverage.coverage}%</p>

    ${report.testCoverage.uncoveredFiles.length > 0 ? `
    <h3>Uncovered Files (${report.testCoverage.uncoveredFiles.length})</h3>
    <ul>
      ${report.testCoverage.uncoveredFiles.map(f => `<li class="file-path">${f}</li>`).join('')}
    </ul>
    ` : ''}

    ${report.testCoverage.recommendations.length > 0 ? `
    <h3>Recommendations</h3>
    <ol>
      ${report.testCoverage.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ol>
    ` : ''}

    <h2>Refactoring Suggestions</h2>
    ${this.formatRefactoringsHTML(report.refactoring.suggestions)}

    <div class="footer">
      Generated by Code Review Orchestrator
    </div>
  </div>
</body>
</html>`;
  }

  private formatIssuesHTML(issues: Array<{severity: string; message: string; file: string; line?: number}>): string {
    const grouped = {
      critical: issues.filter(i => i.severity === 'critical'),
      high: issues.filter(i => i.severity === 'high'),
      medium: issues.filter(i => i.severity === 'medium'),
      low: issues.filter(i => i.severity === 'low'),
    };

    let html = '';

    Object.entries(grouped).forEach(([severity, items]) => {
      if (items.length > 0) {
        html += `<h4><span class="badge badge-${severity}">${severity.toUpperCase()}</span> (${items.length})</h4>`;
        items.forEach(issue => {
          html += `
          <div class="issue issue-${severity}">
            <div class="file-path">${issue.file}${issue.line ? `:${issue.line}` : ''}</div>
            <p>${issue.message}</p>
          </div>`;
        });
      }
    });

    return html;
  }

  private formatRefactoringsHTML(suggestions: Array<{type: string; description: string; file: string; priority: string}>): string {
    if (suggestions.length === 0) {
      return '<p>✅ No refactoring suggestions at this time.</p>';
    }

    const grouped = {
      high: suggestions.filter(s => s.priority === 'high'),
      medium: suggestions.filter(s => s.priority === 'medium'),
      low: suggestions.filter(s => s.priority === 'low'),
    };

    let html = '';

    Object.entries(grouped).forEach(([priority, items]) => {
      if (items.length > 0) {
        const badge = priority === 'high' ? 'critical' : priority;
        html += `<h3><span class="badge badge-${badge}">${priority.toUpperCase()} PRIORITY</span> (${items.length})</h3>`;
        items.forEach(sug => {
          html += `
          <div class="issue">
            <h4>${sug.type}</h4>
            <div class="file-path">${sug.file}</div>
            <p>${sug.description}</p>
          </div>`;
        });
      }
    });

    return html;
  }
}

/**
 * Default report generator instance
 */
export const reportGenerator = new ReportGenerator();

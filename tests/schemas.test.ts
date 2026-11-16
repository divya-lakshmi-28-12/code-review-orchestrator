/**
 * Comprehensive Unit Tests for Zod Schemas
 *
 * Tests valid data, invalid data, edge cases, and JSON schema export
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringResultSchema,
  AnalysisReportSchema,
  type CodeQualityResult,
  type TestCoverageResult,
  type RefactoringResult,
  type AnalysisReport,
} from '../src/types/index.js';

describe('CodeQualityResultSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid code quality result', () => {
      const validData: CodeQualityResult = {
        score: 85,
        issues: [
          {
            severity: 'high',
            message: 'Potential SQL injection vulnerability',
            file: 'src/database.ts',
            line: 42,
          },
          {
            severity: 'medium',
            message: 'Missing error handling',
            file: 'src/api.ts',
          },
        ],
        metrics: {
          complexity: 12.5,
          maintainability: 78,
          duplication: 5.2,
        },
      };

      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
      const parsed = CodeQualityResultSchema.parse(validData);
      expect(parsed).toEqual(validData);
    });

    it('should accept result with no issues', () => {
      const validData: CodeQualityResult = {
        score: 100,
        issues: [],
        metrics: {
          complexity: 5,
          maintainability: 95,
          duplication: 0,
        },
      };

      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept all severity levels', () => {
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = [
        'low',
        'medium',
        'high',
        'critical',
      ];

      severities.forEach((severity) => {
        const data = {
          score: 50,
          issues: [
            {
              severity,
              message: 'Test issue',
              file: 'test.ts',
            },
          ],
          metrics: { complexity: 10, maintainability: 50, duplication: 10 },
        };

        expect(() => CodeQualityResultSchema.parse(data)).not.toThrow();
      });
    });
  });

  describe('Invalid Data', () => {
    it('should reject score out of range', () => {
      const invalidData = {
        score: 101, // Invalid: > 100
        issues: [],
        metrics: { complexity: 10, maintainability: 50, duplication: 10 },
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject negative score', () => {
      const invalidData = {
        score: -1, // Invalid: < 0
        issues: [],
        metrics: { complexity: 10, maintainability: 50, duplication: 10 },
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        score: 50,
        issues: [
          {
            severity: 'invalid', // Invalid enum value
            message: 'Test',
            file: 'test.ts',
          },
        ],
        metrics: { complexity: 10, maintainability: 50, duplication: 10 },
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        score: 50,
        // Missing issues array
        metrics: { complexity: 10, maintainability: 50, duplication: 10 },
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('Edge Cases', () => {
    it('should accept boundary values', () => {
      const minScore = { score: 0, issues: [], metrics: { complexity: 0, maintainability: 0, duplication: 0 } };
      const maxScore = { score: 100, issues: [], metrics: { complexity: 999, maintainability: 100, duplication: 100 } };

      expect(() => CodeQualityResultSchema.parse(minScore)).not.toThrow();
      expect(() => CodeQualityResultSchema.parse(maxScore)).not.toThrow();
    });

    it('should handle optional line number', () => {
      const withLine = {
        score: 50,
        issues: [{ severity: 'low' as const, message: 'Test', file: 'test.ts', line: 10 }],
        metrics: { complexity: 10, maintainability: 50, duplication: 10 },
      };

      const withoutLine = {
        score: 50,
        issues: [{ severity: 'low' as const, message: 'Test', file: 'test.ts' }],
        metrics: { complexity: 10, maintainability: 50, duplication: 10 },
      };

      expect(() => CodeQualityResultSchema.parse(withLine)).not.toThrow();
      expect(() => CodeQualityResultSchema.parse(withoutLine)).not.toThrow();
    });
  });

  describe('JSON Schema Export', () => {
    it('should export valid JSON schema', () => {
      const jsonSchema = z.toJSONSchema(CodeQualityResultSchema, { target: 'draft-7' });

      expect(jsonSchema).toHaveProperty('type', 'object');
      expect(jsonSchema).toHaveProperty('properties');
      expect(jsonSchema).toHaveProperty('required');
      expect(jsonSchema.required).toContain('score');
      expect(jsonSchema.required).toContain('issues');
      expect(jsonSchema.required).toContain('metrics');
    });
  });
});

describe('TestCoverageResultSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid test coverage result', () => {
      const validData: TestCoverageResult = {
        coverage: 75.5,
        uncoveredFiles: ['src/utils/helper.ts', 'src/lib/parser.ts'],
        recommendations: [
          'Add unit tests for helper.ts utility functions',
          'Add integration tests for parser.ts',
        ],
      };

      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept empty arrays', () => {
      const validData: TestCoverageResult = {
        coverage: 100,
        uncoveredFiles: [],
        recommendations: [],
      };

      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Invalid Data', () => {
    it('should reject coverage out of range', () => {
      const invalidData = {
        coverage: 150, // Invalid: > 100
        uncoveredFiles: [],
        recommendations: [],
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject wrong type for uncoveredFiles', () => {
      const invalidData = {
        coverage: 50,
        uncoveredFiles: 'not an array', // Invalid type
        recommendations: [],
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('Edge Cases', () => {
    it('should accept boundary values', () => {
      const minCoverage = { coverage: 0, uncoveredFiles: [], recommendations: [] };
      const maxCoverage = { coverage: 100, uncoveredFiles: [], recommendations: [] };

      expect(() => TestCoverageResultSchema.parse(minCoverage)).not.toThrow();
      expect(() => TestCoverageResultSchema.parse(maxCoverage)).not.toThrow();
    });
  });
});

describe('RefactoringResultSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid refactoring result', () => {
      const validData: RefactoringResult = {
        suggestions: [
          {
            type: 'Extract Function',
            description: 'Extract validation logic from saveUser() function',
            file: 'src/user.service.ts',
            priority: 'high',
          },
          {
            type: 'Extract Constant',
            description: 'Replace magic number 42 with named constant',
            file: 'src/config.ts',
            priority: 'low',
          },
        ],
      };

      expect(() => RefactoringResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept all priority levels', () => {
      const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

      priorities.forEach((priority) => {
        const data = {
          suggestions: [
            {
              type: 'Test',
              description: 'Test description',
              file: 'test.ts',
              priority,
            },
          ],
        };

        expect(() => RefactoringResultSchema.parse(data)).not.toThrow();
      });
    });

    it('should accept empty suggestions', () => {
      const validData: RefactoringResult = {
        suggestions: [],
      };

      expect(() => RefactoringResultSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Invalid Data', () => {
    it('should reject invalid priority', () => {
      const invalidData = {
        suggestions: [
          {
            type: 'Test',
            description: 'Test',
            file: 'test.ts',
            priority: 'critical', // Invalid enum value
          },
        ],
      };

      expect(() => RefactoringResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        suggestions: [
          {
            type: 'Test',
            // Missing description
            file: 'test.ts',
            priority: 'low',
          },
        ],
      };

      expect(() => RefactoringResultSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });
});

describe('AnalysisReportSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid analysis report', () => {
      const validData: AnalysisReport = {
        codeQuality: {
          score: 85,
          issues: [
            {
              severity: 'high',
              message: 'Security issue',
              file: 'src/auth.ts',
              line: 10,
            },
          ],
          metrics: {
            complexity: 12,
            maintainability: 80,
            duplication: 5,
          },
        },
        testCoverage: {
          coverage: 75,
          uncoveredFiles: ['src/utils.ts'],
          recommendations: ['Add tests for utils.ts'],
        },
        refactoring: {
          suggestions: [
            {
              type: 'Extract Function',
              description: 'Refactor large method',
              file: 'src/service.ts',
              priority: 'medium',
            },
          ],
        },
        summary: 'Code analysis complete. 1 critical issue found.',
        timestamp: '2024-01-15T10:30:00Z',
      };

      expect(() => AnalysisReportSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Invalid Data', () => {
    it('should reject missing nested required fields', () => {
      const invalidData = {
        codeQuality: {
          score: 85,
          // Missing issues and metrics
        },
        testCoverage: {
          coverage: 75,
          uncoveredFiles: [],
          recommendations: [],
        },
        refactoring: {
          suggestions: [],
        },
        summary: 'Test',
        timestamp: '2024-01-15T10:30:00Z',
      };

      expect(() => AnalysisReportSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('JSON Schema Export', () => {
    it('should export valid JSON schema for full report', () => {
      const jsonSchema = z.toJSONSchema(AnalysisReportSchema, { target: 'draft-7' });

      expect(jsonSchema).toHaveProperty('type', 'object');
      expect(jsonSchema).toHaveProperty('properties');
      expect(jsonSchema.required).toContain('codeQuality');
      expect(jsonSchema.required).toContain('testCoverage');
      expect(jsonSchema.required).toContain('refactoring');
      expect(jsonSchema.required).toContain('summary');
      expect(jsonSchema.required).toContain('timestamp');
    });
  });
});

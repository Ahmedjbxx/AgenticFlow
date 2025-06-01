// AgenticFlow Quality Gates Configuration
// Defines all quality standards, thresholds, and enforcement rules

export const qualityGatesConfig = {
  // Meta information
  version: '1.0.0',
  lastUpdated: '2024-12-31',
  description: 'Enterprise-grade quality gates for AgenticFlow monorepo',

  // Global quality standards
  global: {
    // Code coverage requirements
    coverage: {
      // Minimum coverage thresholds
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      
      // Package-specific overrides
      packageOverrides: {
        '@agenticflow/types': {
          statements: 95, // Types should be well-tested
          branches: 90,
          functions: 95,
          lines: 95
        },
        '@agenticflow/core': {
          statements: 85, // Core logic needs high coverage
          branches: 80,
          functions: 85,
          lines: 85
        },
        '@agenticflow/ui': {
          statements: 70, // UI components can be lower
          branches: 65,
          functions: 70,
          lines: 70
        }
      },

      // Enforcement rules
      enforcement: {
        blockPR: true,         // Block PR if coverage drops
        allowDecrease: 2,      // Allow max 2% decrease
        requireIncrease: false, // Don't require increase for all changes
        exemptFiles: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/*.stories.ts',
          '**/test-utils/**',
          '**/mocks/**'
        ]
      }
    },

    // Security requirements
    security: {
      vulnerabilities: {
        critical: 0,     // Zero critical vulnerabilities allowed
        high: 0,         // Zero high vulnerabilities allowed
        medium: 5,       // Max 5 medium vulnerabilities
        low: 10          // Max 10 low vulnerabilities
      },
      
      // License compliance
      licenses: {
        allowed: [
          'MIT',
          'Apache-2.0',
          'BSD-2-Clause', 
          'BSD-3-Clause',
          'ISC',
          'Unlicense'
        ],
        blocked: [
          'GPL-2.0',
          'GPL-3.0',
          'AGPL-1.0',
          'AGPL-3.0',
          'LGPL-2.0',
          'LGPL-2.1',
          'LGPL-3.0'
        ]
      },

      // Dependency security
      dependencies: {
        maxAge: 365,           // Dependencies older than 1 year flagged
        autoUpdate: true,      // Allow automatic security updates
        requireApproval: [     // Packages requiring manual approval
          'react',
          'react-dom',
          '@google/genai',
          'reactflow'
        ]
      }
    },

    // Performance budgets
    performance: {
      // Build performance
      build: {
        maxTime: 120,          // Max 2 minutes for full build
        maxTimeIncremental: 30, // Max 30s for incremental build
        maxMemory: 4096,       // Max 4GB memory usage
        
        // Package-specific build times
        packageLimits: {
          '@agenticflow/types': 10,    // 10 seconds
          '@agenticflow/config': 15,   // 15 seconds
          '@agenticflow/core': 30,     // 30 seconds
          '@agenticflow/ui': 45,       // 45 seconds
          '@agenticflow/nodes': 20     // 20 seconds
        }
      },

      // Bundle size limits
      bundle: {
        // Global limits (in KB)
        maxSize: 2048,         // 2MB total
        maxSizeWarning: 1536,  // 1.5MB warning threshold
        
        // Package-specific limits
        packageLimits: {
          '@agenticflow/core': 512,    // 512KB
          '@agenticflow/ui': 768,      // 768KB
          '@agenticflow/nodes': 256,   // 256KB
          '@agenticflow/editor': 512,  // 512KB
          '@agenticflow/types': 64     // 64KB
        },

        // Asset limits
        assets: {
          maxImageSize: 500,     // 500KB per image
          maxFontSize: 200,      // 200KB per font
          maxVideoSize: 5120     // 5MB per video
        }
      },

      // Runtime performance
      runtime: {
        // Core Web Vitals targets
        lcp: 2500,            // Largest Contentful Paint < 2.5s
        fid: 100,             // First Input Delay < 100ms
        cls: 0.1,             // Cumulative Layout Shift < 0.1
        fcp: 1800,            // First Contentful Paint < 1.8s
        ttfb: 600,            // Time to First Byte < 600ms

        // Memory usage
        maxMemoryUsage: 50,   // 50MB max in browser
        memoryLeakThreshold: 5 // 5MB increase indicates leak
      }
    },

    // Code quality metrics
    codeQuality: {
      // TypeScript strictness
      typescript: {
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        exactOptionalPropertyTypes: true
      },

      // Linting requirements
      linting: {
        maxErrors: 0,         // Zero linting errors allowed
        maxWarnings: 10,      // Max 10 warnings allowed
        
        // Critical rules that cannot be violated
        criticalRules: [
          '@typescript-eslint/no-explicit-any',
          '@typescript-eslint/no-unsafe-assignment',
          'react-hooks/exhaustive-deps',
          'react-hooks/rules-of-hooks'
        ]
      },

      // Code complexity
      complexity: {
        maxCyclomaticComplexity: 15,  // Max cyclomatic complexity
        maxCognitiveComplexity: 20,   // Max cognitive complexity
        maxFileLines: 500,            // Max lines per file
        maxFunctionLines: 100         // Max lines per function
      },

      // Documentation requirements
      documentation: {
        requireJSDoc: true,           // JSDoc required for public APIs
        minDescriptionLength: 20,     // Min 20 chars for descriptions
        requireExamples: false,       // Examples not required yet
        requireTypeAnnotations: true  // Type annotations required
      }
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      // Relaxed standards for development
      coverage: {
        statements: 60,   // Lower coverage requirement
        enforcement: {
          blockPR: false  // Don't block in development
        }
      },
      security: {
        vulnerabilities: {
          medium: 10,     // Allow more medium vulnerabilities
          low: 20         // Allow more low vulnerabilities
        }
      },
      performance: {
        build: {
          maxTime: 180    // Allow longer build times
        }
      }
    },

    staging: {
      // Production-like standards
      coverage: {
        statements: 75,   // Slightly lower than production
        enforcement: {
          blockPR: true,
          allowDecrease: 3
        }
      }
    },

    production: {
      // Strictest standards
      coverage: {
        statements: 85,   // Higher than global minimum
        enforcement: {
          blockPR: true,
          allowDecrease: 1, // Minimal decrease allowed
          requireIncrease: true
        }
      },
      security: {
        vulnerabilities: {
          critical: 0,
          high: 0,
          medium: 2,      // Very few medium vulnerabilities
          low: 5          // Few low vulnerabilities
        }
      }
    }
  },

  // Quality gate definitions
  gates: {
    // Pre-commit gates
    preCommit: {
      required: ['lint', 'typecheck', 'format'],
      optional: ['test:unit'],
      timeout: 60 // 1 minute timeout
    },

    // Pre-push gates
    prePush: {
      required: ['lint', 'typecheck', 'test:unit', 'build'],
      optional: ['test:integration'],
      timeout: 300 // 5 minute timeout
    },

    // Pull request gates
    pullRequest: {
      required: [
        'lint',
        'typecheck', 
        'test:unit',
        'test:integration',
        'build',
        'security:audit',
        'coverage:check',
        'performance:budget'
      ],
      optional: ['test:e2e'],
      timeout: 1800 // 30 minute timeout
    },

    // Release gates
    release: {
      required: [
        'lint',
        'typecheck',
        'test:unit',
        'test:integration', 
        'test:e2e',
        'build',
        'security:audit',
        'coverage:check',
        'performance:budget',
        'license:check',
        'docs:check'
      ],
      timeout: 3600 // 1 hour timeout
    }
  },

  // Reporting configuration
  reporting: {
    // Coverage reports
    coverage: {
      formats: ['lcov', 'html', 'json', 'text-summary'],
      outputDir: 'coverage',
      includeAll: true,
      thresholds: true
    },

    // Quality reports
    quality: {
      generateReport: true,
      includeMetrics: [
        'coverage',
        'complexity',
        'duplication',
        'maintainability',
        'security',
        'performance'
      ],
      outputFormat: 'html',
      outputDir: 'reports/quality'
    },

    // Performance reports
    performance: {
      bundleAnalysis: true,
      runtimeMetrics: true,
      compareBaseline: true,
      outputDir: 'reports/performance'
    }
  },

  // Integration settings
  integrations: {
    // GitHub integration
    github: {
      createChecks: true,
      commentOnPR: true,
      updateStatus: true,
      failOnGateFailure: true
    },

    // SonarQube integration (future)
    sonarqube: {
      enabled: false,
      projectKey: 'agenticflow',
      qualityGate: 'AgenticFlow Quality Gate'
    },

    // Codecov integration
    codecov: {
      enabled: true,
      token: '${CODECOV_TOKEN}',
      fail: true,
      threshold: 2
    }
  }
};

// Export individual configurations for easier import
export const coverageConfig = qualityGatesConfig.global.coverage;
export const securityConfig = qualityGatesConfig.global.security;
export const performanceConfig = qualityGatesConfig.global.performance;
export const codeQualityConfig = qualityGatesConfig.global.codeQuality;

export default qualityGatesConfig; 
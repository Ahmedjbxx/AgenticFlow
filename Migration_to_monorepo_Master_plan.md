
# 🎯 **AgenticFlow → Enterprise Monorepo Migration - COMPREHENSIVE MASTER PLAN**

## 📊 **Executive Summary**

**Migration Complexity**: 🔴 **ENTERPRISE-LEVEL** (10x more complex than initially assessed)
**Timeline**: **12 weeks** (was 8 weeks)
**Risk Level**: 🔴 **HIGH** (without proper development infrastructure)
**Success Dependency**: Development infrastructure MUST be completed first

---

## 🚨 **PHASE -1: DEVELOPMENT INFRASTRUCTURE FOUNDATION (Week -1)**
*Without this, everything else fails*

### **🔥 Priority 0: Code Quality Infrastructure** ⭐⭐⭐⭐⭐⭐
*BLOCKS ALL DEVELOPMENT*

**Day 1: Biome Setup (Modern Linter/Formatter)**
```bash
# CRITICAL: Install Biome for enterprise code quality
pnpm add -D @biomejs/biome@^1.9.0

# Create biome.jsonc
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": { "clientKind": "git", "enabled": true, "useIgnoreFile": true },
  "files": { "ignore": ["**/.turbo", "**/coverage", "**/dist", "**/node_modules"] },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "quoteStyle": "single"
    }
  }
}

# BLOCKER: Without this, code formatting is inconsistent across team
```

**Day 2: Prettier Configuration (Vue/CSS/Markdown)**
```bash
# CRITICAL: Prettier for file types Biome doesn't handle
pnpm add -D prettier@^3.0.0

# Create .prettierrc.js
module.exports = {
  semi: true,
  trailingComma: 'all',
  bracketSpacing: true,
  useTabs: true,
  tabWidth: 2,
  arrowParens: 'always',
  singleQuote: true,
  endOfLine: 'lf',
  printWidth: 100,
  overrides: [
    { files: "*.vue", options: { parser: "vue" } },
    { files: "*.css", options: { parser: "css" } },
    { files: "*.scss", options: { parser: "scss" } }
  ]
};

# BLOCKER: Vue/CSS files won't be formatted without this
```

**Day 3: Git Hooks with Lefthook**
```bash
# CRITICAL: Automated code quality enforcement
pnpm add -D lefthook@^1.7.15

# Create lefthook.yml
pre-commit:
  commands:
    biome_check:
      glob: 'packages/**/*.{js,ts,json}'
      run: pnpm biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
      skip: [merge, rebase]
    prettier_check:
      glob: 'packages/**/*.{vue,yml,md,css,scss}'
      run: pnpm prettier --write --ignore-unknown --no-error-on-unmatched-pattern {staged_files}
      stage_fixed: true
      skip: [merge, rebase]

# Install hooks
pnpm lefthook install

# BLOCKER: Without automated enforcement, code quality degrades immediately
```

**Day 4: PNPM Configuration**
```bash
# CRITICAL: .npmrc for proper package management
cat > .npmrc << 'EOF'
audit = false
fund = false
update-notifier = false
auto-install-peers = true
strict-peer-dependencies = false
prefer-workspace-packages = true
link-workspace-packages = deep
hoist = true
shamefully-hoist = true
hoist-workspace-packages = false
loglevel = warn
package-manager-strict = false
package-import-method = clone-or-copy
EOF

# BLOCKER: Package management fails without proper configuration
```

**Day 5: EditorConfig & Shared Configs**
```bash
# CRITICAL: Consistent editor settings
cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = tab
indent_size = 2

[*.{json,yml,yaml}]
indent_style = space
indent_size = 2
EOF

# Create shared configuration packages
mkdir -p packages/@agenticflow/{biome-config,prettier-config,lefthook-config}

# DEPENDENCY: All packages need consistent editor settings
```

**Day 6-7: Configuration Package Creation**
```bash
# Create packages/@agenticflow/biome-config/package.json
{
  "name": "@agenticflow/biome-config",
  "version": "0.1.0",
  "main": "biome.jsonc",
  "files": ["biome.jsonc"]
}

# Create packages/@agenticflow/prettier-config/package.json  
{
  "name": "@agenticflow/prettier-config",
  "version": "0.1.0",
  "main": ".prettierrc.js",
  "files": [".prettierrc.js"]
}

# DEPENDENCY: Other packages will extend these configs
```

---

## 🧪 **PHASE 0: TESTING INFRASTRUCTURE FOUNDATION (Week 0)**
*Must be bulletproof before migration*

### **🔥 Priority 1: Advanced Jest Configuration** ⭐⭐⭐⭐⭐
*Enterprise testing foundation*

**Day 1-2: Jest Master Configuration**
```bash
# CRITICAL: Enterprise-grade Jest setup
pnpm add -D jest@^29.6.2 ts-jest@^29.1.1 jest-environment-jsdom@^29.6.2
pnpm add -D jest-expect-message@^1.1.3 jest-junit@^16.0.0
pnpm add -D @types/jest@^29.5.3

# Create jest.config.js (enterprise version)
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('get-tsconfig').getTsconfig().config;

const tsJestOptions = {
  isolatedModules: true,
  tsconfig: {
    ...compilerOptions,
    declaration: false,
    sourceMap: true,
  },
};

const isCoverageEnabled = process.env.COVERAGE_ENABLED === 'true';

module.exports = {
  verbose: true,
  testEnvironment: 'node',
  testRegex: '\\.(test|spec)\\.(js|ts)$',
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  transform: { '^.+\\.ts$': ['ts-jest', tsJestOptions] },
  moduleNameMapper: compilerOptions?.paths
    ? pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: `<rootDir>${compilerOptions.baseUrl ? `/${compilerOptions.baseUrl.replace(/^\.\//, '')}` : ''}`,
      })
    : {},
  setupFilesAfterEnv: ['jest-expect-message'],
  collectCoverage: isCoverageEnabled,
  coverageReporters: ['text-summary', 'lcov', 'html-spa'],
  collectCoverageFrom: ['src/**/*.ts'],
  workerIdleMemoryLimit: '1MB',
  reporters: process.env.CI === 'true' ? ['default', 'jest-junit'] : ['default'],
};

# BLOCKER: Without proper Jest config, testing is unreliable
```

**Day 3: Vitest Configuration**
```bash
# CRITICAL: Vitest for frontend packages
pnpm add -D vitest@^1.0.0 @vitest/coverage-v8@^1.0.0

# Create vitest.workspace.ts
export default [
  'packages/ui',
  'packages/hooks',
  'packages/templates'
];

# Create packages/@agenticflow/vitest-config/package.json
{
  "name": "@agenticflow/vitest-config",
  "version": "0.1.0",
  "main": "vitest.config.ts",
  "dependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}

# DEPENDENCY: Frontend packages need Vitest instead of Jest
```

**Day 4-5: Coverage Strategy Setup**
```bash
# CRITICAL: codecov.yml for enterprise coverage tracking
cat > codecov.yml << 'EOF'
codecov:
  max_report_age: off
  require_ci_to_pass: true

coverage:
  status:
    patch: false
    project:
      default:
        threshold: 0.5

component_management:
  individual_components:
    - component_id: backend_packages
      name: Backend
      paths:
        - packages/types/**
        - packages/core/**
        - packages/config/**
        - packages/nodes/**
    - component_id: frontend_packages
      name: Frontend  
      paths:
        - packages/ui/**
        - packages/hooks/**
        - packages/styles/**
    - component_id: testing_packages
      name: Testing
      paths:
        - packages/testing/**
        - packages/templates/**

ignore:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/e2e/**"
EOF

# QUALITY: Component-based coverage tracking
```

**Day 6-7: Test Utilities Migration**
```bash
# CRITICAL: Preserve existing test utilities
mkdir -p packages/testing/src

# Move and enhance tests/testUtils.tsx
mv tests/testUtils.tsx packages/testing/src/
# Enhance with monorepo-specific utilities
# Add package-level test helpers
# Create mock factories for each package

# DEPENDENCY: All packages need these test utilities
```

### **🔥 Priority 2: Environment & Security Setup** ⭐⭐⭐⭐⭐
*Security foundation*

**Day 7: Comprehensive Environment Setup**
```bash
# CRITICAL: Complete environment variable system
cat > .env.example << 'EOF'
# AgenticFlow Environment Configuration

# API Keys (REQUIRED)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Execution Settings
VITE_DEFAULT_TIMEOUT=10000
VITE_MAX_ITERATIONS=100
VITE_RETRY_ATTEMPTS=3

# AI Configuration
VITE_GEMINI_MODEL=gemini-pro
VITE_GEMINI_TEMPERATURE=0.7

# UI Settings
VITE_THEME=light
VITE_AUTO_SAVE=true
VITE_DEBUG_MODE=false

# Development
VITE_HOT_RELOAD=true
VITE_SOURCE_MAPS=true

# Testing
COVERAGE_ENABLED=false
TEST_TIMEOUT=30000

# Build
NODE_OPTIONS=--max-old-space-size=4096
EOF

# Update .gitignore for security
cat >> .gitignore << 'EOF'

# Environment files
.env
.env.local
.env.*.local

# Test coverage
coverage/
.nyc_output/

# Build artifacts
.turbo/
*.tsbuildinfo

# Logs
logs/
*.log

# Editor
.vscode/
.idea/

EOF

# BLOCKER: Without proper environment setup, development fails
```

---

## 🏗️ **PHASE 1: MONOREPO FOUNDATION (Week 1)**
*Build the architectural skeleton*

### **🔥 Priority 3: Package Manager & Workspace Setup** ⭐⭐⭐⭐⭐
*Everything depends on this*

**Day 1: Monorepo Infrastructure**
```bash
# CRITICAL: Remove old system, install new
rm package-lock.json
rm -rf node_modules

# Install PNPM globally
npm install -g pnpm@10.2.1

# Create pnpm-workspace.yaml with catalog
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - packages/*
  - packages/@agenticflow/*

catalog:
  # Core dependencies
  react: ^19.1.0
  react-dom: ^19.1.0
  typescript: ^5.7.2
  
  # Build tools
  vite: ^6.2.0
  turbo: ^2.3.3
  tsup: ^8.4.0
  
  # UI libraries
  reactflow: ^11.11.4
  zustand: ^5.0.5
  '@google/genai': ^1.3.0
  react-mentions: ^4.4.10
  
  # Styling
  tailwindcss: ^3.4.0
  '@tailwindcss/forms': ^0.5.7
  postcss: ^8.4.0
  autoprefixer: ^10.4.0
  
  # Testing
  jest: ^29.6.2
  vitest: ^1.0.0
  '@testing-library/react': ^14.0.0
  '@testing-library/jest-dom': ^6.0.0
  
  # Code quality
  '@biomejs/biome': ^1.9.0
  prettier: ^3.0.0
  lefthook: ^1.7.15
  
  # Type definitions
  '@types/node': ^22.14.0
  '@types/react': ^19.1.6
  '@types/react-dom': ^19.1.5
  '@types/jest': ^29.5.3
EOF

# BLOCKER: Can't create packages without workspace setup
```

**Day 2: Turborepo Configuration**
```bash
# CRITICAL: Enterprise Turborepo setup
pnpm add -D turbo@2.3.3

# Create turbo.json (enterprise configuration)
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "stream",
  "globalEnv": [
    "CI",
    "COVERAGE_ENABLED",
    "NODE_ENV",
    "VITE_*"
  ],
  "tasks": {
    "clean": {
      "cache": false
    },
    "build:backend": {
      "dependsOn": ["@agenticflow/types#build", "@agenticflow/core#build", "@agenticflow/config#build"]
    },
    "build:frontend": {
      "dependsOn": ["@agenticflow/ui#build", "@agenticflow/styles#build"]
    },
    "build:nodes": {
      "dependsOn": ["@agenticflow/nodes#build"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "**/*.test.ts", "**/*.spec.ts"]
    },
    "test:backend": {
      "dependsOn": [
        "@agenticflow/types#test",
        "@agenticflow/core#test", 
        "@agenticflow/config#test",
        "@agenticflow/nodes#test"
      ],
      "outputs": ["coverage/**"]
    },
    "test:frontend": {
      "dependsOn": [
        "@agenticflow/ui#test",
        "@agenticflow/hooks#test",
        "@agenticflow/styles#test"
      ],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^typecheck"]
    },
    "format": {},
    "format:check": {}
  }
}
EOF

# DEPENDENCY: All builds depend on this orchestration
```

**Day 3: Root Package Configuration**
```bash
# CRITICAL: Root package.json with proper scripts
cat > package.json << 'EOF'
{
  "name": "agenticflow-monorepo",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@10.2.1",
  "engines": {
    "node": ">=20.15.0",
    "pnpm": ">=10.2.1"
  },
  "scripts": {
    "prepare": "lefthook install",
    "preinstall": "node scripts/block-npm-install.js",
    
    "build": "turbo run build",
    "build:backend": "turbo run build:backend", 
    "build:frontend": "turbo run build:frontend",
    "build:nodes": "turbo run build:nodes",
    
    "dev": "turbo run dev --parallel --env-mode=loose",
    "dev:backend": "turbo run dev --filter='@agenticflow/{types,core,config,nodes}'",
    "dev:frontend": "turbo run dev --filter='@agenticflow/{ui,hooks,styles}'",
    
    "test": "turbo run test",
    "test:backend": "turbo run test:backend --concurrency=1",
    "test:frontend": "turbo run test:frontend --concurrency=1", 
    "test:watch": "turbo run test:watch",
    "test:coverage": "COVERAGE_ENABLED=true turbo run test",
    
    "lint": "turbo run lint",
    "lintfix": "turbo run lintfix",
    "typecheck": "turbo run typecheck",
    
    "format": "turbo run format && node scripts/format.mjs",
    "format:check": "turbo run format:check",
    
    "clean": "turbo run clean",
    "reset": "node scripts/reset.mjs"
  },
  "devDependencies": {
    "@agenticflow/biome-config": "workspace:*",
    "@agenticflow/prettier-config": "workspace:*",
    "@agenticflow/typescript-config": "workspace:*",
    "turbo": "catalog:",
    "lefthook": "catalog:",
    "@biomejs/biome": "catalog:",
    "prettier": "catalog:"
  }
}
EOF

# DEPENDENCY: All package scripts depend on this
```

**Day 4-5: Shared Configuration Packages**
```bash
# CRITICAL: Create all shared config packages

# TypeScript config package
mkdir -p packages/@agenticflow/typescript-config
cat > packages/@agenticflow/typescript-config/package.json << 'EOF'
{
  "name": "@agenticflow/typescript-config",
  "version": "0.1.0",
  "main": "tsconfig.base.json",
  "files": ["tsconfig.*.json"]
}
EOF

cat > packages/@agenticflow/typescript-config/tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext", 
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
EOF

# Vite config package  
mkdir -p packages/@agenticflow/vite-config
cat > packages/@agenticflow/vite-config/package.json << 'EOF'
{
  "name": "@agenticflow/vite-config",
  "version": "0.1.0",
  "main": "index.ts",
  "dependencies": {
    "vite": "catalog:",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
EOF

# DEPENDENCY: All packages need these configs
```

**Day 6-7: Package Directory Structure**
```bash
# CRITICAL: Create all package directories with proper structure
mkdir -p packages/{types,core,config,nodes,ui,hooks,templates,styles,testing}

# Create package.json for each package with proper workspace dependencies
# Each package needs:
# - Proper name (@agenticflow/packagename)
# - Version (0.1.0)
# - Dependencies with workspace:* protocol
# - Build scripts
# - Test scripts
# - Development dependencies

# DEPENDENCY: Import refactoring needs these to exist
```

---

## 🔧 **PHASE 2: DEPENDENCY MIGRATION (Week 2)**
*Fix external dependencies and build system*

### **🔥 Priority 4: CDN to NPM Migration** ⭐⭐⭐⭐⭐
*Blocks entire build system*

**Day 1-2: Remove All CDN Dependencies**
```bash
# CRITICAL: Eliminate all external CDN imports

# Update index.html - REMOVE:
# <script src="https://cdn.tailwindcss.com"></script>
# <script type="importmap">...</script>

# New index.html (clean version):
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AgenticFlow - Universal Agentic Automation System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# BLOCKER: Vite cannot bundle CDN imports
```

**Day 3-4: Tailwind CSS Package Setup**
```bash
# CRITICAL: Convert Tailwind from CDN to proper build system

# Create packages/styles package
cd packages/styles
cat > package.json << 'EOF'
{
  "name": "@agenticflow/styles",
  "version": "0.1.0",
  "main": "dist/index.css",
  "files": ["dist/**/*"],
  "scripts": {
    "build": "tailwindcss -i ./src/index.css -o ./dist/index.css --minify",
    "dev": "tailwindcss -i ./src/index.css -o ./dist/index.css --watch",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "tailwindcss": "catalog:",
    "@tailwindcss/forms": "catalog:",
    "autoprefixer": "catalog:",
    "postcss": "catalog:"
  },
  "devDependencies": {
    "@agenticflow/typescript-config": "workspace:*"
  }
}
EOF

# Create src/index.css
mkdir src
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* AgenticFlow custom styles */
@layer components {
  .node-selected {
    @apply ring-2 ring-blue-500 ring-opacity-50;
  }
  
  .flow-background {
    @apply bg-gray-50 dark:bg-gray-900;
  }
}
EOF

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['../*/src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        agenticflow: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#06B6D4'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
EOF

# DEPENDENCY: UI package needs this styles package
```

**Day 5-7: React Dependencies Migration**
```bash
# CRITICAL: Move React from CDN to npm packages

# All packages using React get these in package.json:
"peerDependencies": {
  "react": "catalog:",
  "react-dom": "catalog:"
},
"devDependencies": {
  "react": "catalog:",
  "react-dom": "catalog:",
  "@types/react": "catalog:",
  "@types/react-dom": "catalog:"
}

# ReactFlow package dependency:
"dependencies": {
  "reactflow": "catalog:"
}

# Update all import statements from CDN imports to proper ES modules
# Create import migration script for systematic updates

# BLOCKER: Build system can't work with CDN React
```

### **🔥 Priority 5: Environment System** ⭐⭐⭐⭐⭐
*Configuration foundation*

**Day 6-7: Advanced Configuration System**
```bash
# CRITICAL: Move AppConfig to packages/config

# Create packages/config/src/environment.ts
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: AppConfig;
  
  private constructor() {
    this.validateEnvironment();
    this.config = this.createConfig();
  }
  
  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }
  
  private validateEnvironment(): void {
    const required = [
      'VITE_GEMINI_API_KEY',
      'VITE_DEFAULT_TIMEOUT',
      'VITE_GEMINI_MODEL'
    ];
    
    const missing = required.filter(key => !import.meta.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  private createConfig(): AppConfig {
    return {
      execution: {
        defaultTimeout: parseInt(import.meta.env.VITE_DEFAULT_TIMEOUT || '10000'),
        maxIterations: parseInt(import.meta.env.VITE_MAX_ITERATIONS || '100'),
        retryAttempts: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3'),
      },
      api: {
        geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        defaultModel: import.meta.env.VITE_GEMINI_MODEL || 'gemini-pro',
      },
      ui: {
        theme: (import.meta.env.VITE_THEME as 'light' | 'dark') || 'light',
        autoSave: import.meta.env.VITE_AUTO_SAVE === 'true',
        debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      },
    };
  }
  
  public getConfig(): AppConfig {
    return { ...this.config };
  }
  
  // Preserve all existing ConfigManager functionality
}

# BLOCKER: All packages need configuration access
```

---

## 📦 **PHASE 3: CORE PACKAGE MIGRATION (Week 3-4)**
*Move the business logic*

### **🔥 Priority 6: Types Package** ⭐⭐⭐⭐⭐
*Foundation for everything else*

**Week 3, Day 1-2: Types Migration & Enhancement**
```bash
# CRITICAL: Types package is imported by everyone

cd packages/types
cat > package.json << 'EOF'
{
  "name": "@agenticflow/types",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist",
    "test": "jest"
  },
  "devDependencies": {
    "@agenticflow/typescript-config": "workspace:*",
    "@agenticflow/jest-config": "workspace:*",
    "typescript": "catalog:"
  }
}
EOF

# Split types.ts into focused modules:
mkdir src
# src/index.ts - Main exports
# src/nodes.ts - Node-related types  
# src/workflow.ts - Workflow types
# src/execution.ts - Execution types
# src/ui.ts - UI component types
# src/api.ts - API types
# src/config.ts - Configuration types

# Create comprehensive type exports
cat > src/index.ts << 'EOF'
// Node system types
export * from './nodes';
export * from './workflow';
export * from './execution';

// UI types
export * from './ui';

// Configuration types
export * from './config';

// API types
export * from './api';

// Re-export commonly used types
export type {
  // Add most commonly used type aliases here
} from './nodes';
EOF

# BLOCKER: All other packages import from this
```

### **🔥 Priority 7: Core Package Migration** ⭐⭐⭐⭐
*Business logic foundation*

**Week 3, Day 3-5: Core Logic Migration**
```bash
# CRITICAL: Core package contains ApplicationCore

cd packages/core
cat > package.json << 'EOF'
{
  "name": "@agenticflow/core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "@agenticflow/types": "workspace:*",
    "@agenticflow/config": "workspace:*"
  },
  "devDependencies": {
    "@agenticflow/typescript-config": "workspace:*",
    "@agenticflow/jest-config": "workspace:*",
    "@agenticflow/testing": "workspace:*",
    "typescript": "catalog:"
  }
}
EOF

# Move core/ directory contents to packages/core/src/
mv ../../core/* src/

# Update imports throughout core package:
# From: import { ... } from '../types'
# To: import { ... } from '@agenticflow/types'

# Preserve all functionality:
# - ApplicationCore
# - EventBus  
# - NodeRegistry
# - VariableRegistry
# - ExecutionEngine

# DEPENDENCY: Nodes and UI packages need core
```

### **🔥 Priority 8: Configuration Package** ⭐⭐⭐⭐
*Configuration management*

**Week 3, Day 6-7: Configuration Migration**
```bash
# CRITICAL: Config is used everywhere

cd packages/config
cat > package.json << 'EOF'
{
  "name": "@agenticflow/config",
  "version": "0.1.0", 
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist",
    "test": "jest"
  },
  "dependencies": {
    "@agenticflow/types": "workspace:*"
  },
  "devDependencies": {
    "@agenticflow/typescript-config": "workspace:*",
    "@agenticflow/jest-config": "workspace:*",
    "typescript": "catalog:"
  }
}
EOF

# Move config/AppConfig.ts to packages/config/src/
mv ../../config/AppConfig.ts src/

# Enhance configuration system:
# - Environment validation
# - Type-safe configuration access
# - Runtime configuration updates
# - Configuration persistence

# Create src/index.ts
cat > src/index.ts << 'EOF'
export { ConfigManager, configManager } from './AppConfig';
export { EnvironmentManager } from './environment';
export * from './types';
EOF

# DEPENDENCY: All packages need configuration
```

### **🔥 Priority 9: Nodes Package Migration** ⭐⭐⭐
*Node plugin system*

**Week 4, Day 1-3: Nodes System Migration**
```bash
# MEDIUM-HIGH: Node system but isolated

cd packages/nodes
cat > package.json << 'EOF'
{
  "name": "@agenticflow/nodes",
  "version": "0.1.0",
  "main": "dist/index.js", 
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@agenticflow/types": "workspace:*",
    "@agenticflow/core": "workspace:*",
    "@google/genai": "catalog:"
  },
  "devDependencies": {
    "@agenticflow/typescript-config": "workspace:*",
    "@agenticflow/jest-config": "workspace:*",
    "@agenticflow/testing": "workspace:*",
    "typescript": "catalog:"
  }
}
EOF

# Move nodes/ directory to packages/nodes/src/
mv ../../nodes/* src/

# Update all imports to use package references
# Test all 9 built-in nodes still work

# DEPENDENCY: UI package needs node definitions
```

### **🔥 Priority 10: Supporting Packages** ⭐⭐⭐
*Hooks, templates, testing utilities*

**Week 4, Day 4-7: Supporting Package Migration**
```bash
# MEDIUM: Important but can be done in parallel

# Hooks package
cd packages/hooks
cat > package.json << 'EOF'
{
  "name": "@agenticflow/hooks",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch", 
    "test": "vitest"
  },
  "dependencies": {
    "@agenticflow/types": "workspace:*",
    "@agenticflow/core": "workspace:*"
  },
  "peerDependencies": {
    "react": "catalog:"
  },
  "devDependencies": {
    "@agenticflow/typescript-config": "workspace:*",
    "@agenticflow/vitest-config": "workspace:*",
    "react": "catalog:",
    "typescript": "catalog:"
  }
}
EOF

# Move hooks/useVariables.ts to packages/hooks/src/
# Add additional hooks as needed

# Templates package
cd packages/templates
cat > package.json << 'EOF'
{
  "name": "@agenticflow/templates",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@agenticflow/types": "workspace:*"
  }
}
EOF

# Move utils/templates.ts to packages/templates/src/
# Split templates into individual files
# Create template categories

# Testing package
cd packages/testing
mv ../../tests/testUtils.tsx src/
# Enhance with monorepo-specific utilities

# PARALLEL: These can be done simultaneously
```

---

## 🎨 **PHASE 4: UI MIGRATION (Week 5)**
*User interface and services*

### **🔥 Priority 11: UI Package Migration** ⭐⭐⭐⭐
*Main user interface*

**Day 1-4: React Components Migration**
```bash
# HIGH: This is what users interact with

cd packages/ui
cat > package.json << 'EOF'
{
  "name": "@agenticflow/ui", 
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "@agenticflow/types": "workspace:*",
    "@agenticflow/core": "workspace:*",
    "@agenticflow/config": "workspace:*",
    "@agenticflow/hooks": "workspace:*",
    "@agenticflow/styles": "workspace:*",
    "reactflow": "catalog:",
    "react-mentions": "catalog:",
    "zustand": "catalog:"
  },
  "peerDependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@agenticflow/typescript-config": "workspace:*",
    "@agenticflow/vite-config": "workspace:*",
    "@agenticflow/vitest-config": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:"
  }
}
EOF

# Move UI components:
mv ../../components/* src/components/
mv ../../App.tsx src/
mv ../../index.tsx src/main.tsx

# Create vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  envPrefix: 'VITE_',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY)
  }
});
EOF

# Update all imports to use package references
# Validate ReactFlow integration still works

# CRITICAL: This is the main user interface
```

**Day 5-7: Services Migration**
```bash
# MEDIUM: Supporting services for UI

# Move services to packages/ui/src/services/
mv ../../services/* src/services/

# Move remaining utils to packages/ui/src/utils/
mv ../../utils/* src/utils/

# Update service imports throughout UI
# Validate Gemini API integration
# Test all UI interactions

# DEPENDENCY: UI package needs these services
```

---

## 🔄 **PHASE 5: IMPORT REFACTORING (Week 6)**
*Connect all the pieces*

### **🔥 Priority 12: Import Path Migration** ⭐⭐⭐⭐⭐
*Critical for functionality*

**Day 1-4: Systematic Import Updates**
```bash
# CRITICAL: App breaks if imports are wrong

# Create comprehensive import migration script
cat > scripts/migrate-imports.js << 'EOF'
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const importMappings = {
  // From relative imports to package imports
  '../types': '@agenticflow/types',
  '../../types': '@agenticflow/types',
  '../core': '@agenticflow/core', 
  '../../core': '@agenticflow/core',
  '../config': '@agenticflow/config',
  '../../config': '@agenticflow/config',
  '../nodes': '@agenticflow/nodes',
  '../../nodes': '@agenticflow/nodes',
  '../hooks': '@agenticflow/hooks',
  '../styles': '@agenticflow/styles',
  '../templates': '@agenticflow/templates',
  '../testing': '@agenticflow/testing'
};

const updateImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  for (const [oldImport, newImport] of Object.entries(importMappings)) {
    const regex = new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from '${newImport}'`);
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in: ${filePath}`);
  }
};

// Process all TypeScript files
const files = glob.sync('packages/**/src/**/*.{ts,tsx}');
files.forEach(updateImports);
EOF

# Run migration script
node scripts/migrate-imports.js

# Verify all imports resolve correctly
pnpm typecheck

# BLOCKER: Nothing works with broken imports
```

**Day 5-7: Build System Validation**
```bash
# CRITICAL: Must verify everything builds

# Test individual package builds
cd packages/types && pnpm build
cd packages/core && pnpm build  
cd packages/config && pnpm build
cd packages/nodes && pnpm build
cd packages/ui && pnpm build

# Test monorepo build
pnpm build

# Test development workflow
pnpm dev

# Fix any compilation errors
# Verify TypeScript project references work
# Test hot reload functionality

# BLOCKER: Can't proceed if build is broken
```

---

## 🧪 **PHASE 6: TESTING INFRASTRUCTURE (Week 7-8)**
*Quality assurance foundation*

### **🔥 Priority 13: Package-Level Testing** ⭐⭐⭐⭐
*Critical for maintainability*

**Week 7, Day 1-4: Individual Package Testing**
```bash
# MEDIUM-HIGH: Each package needs comprehensive tests

# Create jest.config.js for backend packages (types, core, config, nodes)
# Create vitest.config.ts for frontend packages (ui, hooks, styles)

# Backend package test setup (example for core):
cd packages/core
cat > jest.config.js << 'EOF'
const baseConfig = require('@agenticflow/jest-config');

module.exports = {
  ...baseConfig,
  displayName: 'Core',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ]
};
EOF

# Frontend package test setup (example for ui):
cd packages/ui
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
});
EOF

# Write comprehensive tests for each package
# Test inter-package communication
# Validate all existing functionality

# QUALITY: Essential for long-term maintenance
```

**Week 7, Day 5-7: Integration Testing**
```bash
# MEDIUM: End-to-end workflow validation

# Create packages/integration-tests/
mkdir packages/integration-tests
cat > packages/integration-tests/package.json << 'EOF'
{
  "name": "@agenticflow/integration-tests",
  "private": true,
  "scripts": {
    "test": "jest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@agenticflow/core": "workspace:*",
    "@agenticflow/nodes": "workspace:*",
    "@agenticflow/ui": "workspace:*"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@agenticflow/jest-config": "workspace:*"
  }
}
EOF

# Test complete workflow execution
# Test ReactFlow integration
# Test Gemini API integration
# Test package interactions

# VALIDATION: Ensures migration success
```

**Week 8: Advanced Testing Features**
```bash
# Visual regression testing
# Performance testing
# Load testing
# Security testing
```

---

## ⚙️ **PHASE 7: CI/CD INFRASTRUCTURE (Week 9-10)**
*Enterprise automation*

### **🔥 Priority 14: GitHub Actions Workflows** ⭐⭐⭐⭐
*Enterprise CI/CD*

**Week 9, Day 1-4: Reusable Workflow Creation**
```bash
# MEDIUM-HIGH: Enterprise automation

# Create .github/workflows/units-tests-reusable.yml
cat > .github/workflows/units-tests-reusable.yml << 'EOF'
name: Unit Tests (Reusable)

on:
  workflow_call:
    inputs:
      ref:
        description: 'Git ref to test'
        required: false
        type: string
        default: ''
      cacheKey:
        description: 'Cache key for build artifacts'
        required: true
        type: string
      collectC

# 🎯 **AgenticFlow → Enterprise Monorepo Migration - COMPREHENSIVE MASTER PLAN**

## 🚀 **PHASE 7: PERFORMANCE & OPTIMIZATION (Week 7) - PRIORITY: HIGH**

### **7.1 Build Performance**
**Time: 3 days**
```bash
# Implement caching strategies
packages/
├── shared/
│   └── build-cache/          # Build artifact caching
├── tools/
│   └── performance/          # Performance monitoring
└── config/
    └── optimization/         # Build optimization configs
```

**Critical Tasks:**
- ✅ **Turborepo caching configuration**
  - Local build cache
  - Remote cache setup (Vercel/AWS)
  - Incremental builds
- ✅ **Bundle size optimization**
  - Dynamic imports for node plugins
  - Code splitting strategies
  - Tree shaking configuration
- ✅ **Memory optimization**
  - Worker threads for heavy computations
  - Lazy loading strategies
  - Memory leak prevention

### **7.2 Runtime Performance**
**Time: 2 days**
```typescript
// packages/core/src/performance/
interface PerformanceMetrics {
  buildTime: number;
  bundleSize: number;
  memoryUsage: number;
  testExecutionTime: number;
}

class PerformanceMonitor {
  trackBuildMetrics(): PerformanceMetrics;
  optimizeBundles(): void;
  monitorMemory(): void;
}
```

---

## 🔐 **PHASE 8: SECURITY & COMPLIANCE (Week 8) - PRIORITY: CRITICAL**

### **8.1 Security Infrastructure**
**Time: 4 days**
```bash
# Security setup
.github/
├── security/
│   ├── security-policy.md
│   ├── vulnerability-scan.yml
│   └── dependency-audit.yml
packages/
├── security/
│   ├── auth/               # Authentication modules
│   ├── encryption/         # Data encryption
│   └── audit/             # Security auditing
```

**Critical Tasks:**
- ✅ **Dependency vulnerability scanning**
  - GitHub Dependabot setup
  - NPM audit automation
  - Security policy enforcement
- ✅ **Code security**
  - ESLint security rules
  - SAST (Static Analysis Security Testing)
  - Secrets detection (GitGuardian/TruffleHog)
- ✅ **Package security**
  - Package signing
  - Provenance tracking
  - Supply chain security

### **8.2 Compliance & Auditing**
**Time: 3 days**
```typescript
// packages/security/src/audit/
interface SecurityAudit {
  scanDependencies(): VulnerabilityReport;
  validatePackages(): PackageIntegrity;
  auditCodeChanges(): SecurityReport;
}

interface ComplianceCheck {
  validateLicenses(): LicenseReport;
  checkSecurityPolicies(): PolicyReport;
  generateAuditLog(): AuditLog;
}
```

---

## 📈 **PHASE 9: MONITORING & OBSERVABILITY (Week 9) - PRIORITY: HIGH**

### **9.1 Application Monitoring**
**Time: 3 days**
```bash
# Monitoring infrastructure
packages/
├── monitoring/
│   ├── metrics/           # Performance metrics
│   ├── logging/          # Centralized logging
│   ├── tracing/          # Distributed tracing
│   └── alerts/           # Alert management
├── observability/
│   ├── dashboards/       # Monitoring dashboards
│   └── health-checks/    # Service health monitoring
```

**Critical Tasks:**
- ✅ **Metrics collection**
  - Application performance metrics
  - Build time tracking
  - Error rate monitoring
  - User interaction analytics
- ✅ **Logging system**
  - Structured logging (Winston/Pino)
  - Log aggregation (ELK/Grafana)
  - Error tracking (Sentry)
- ✅ **Health monitoring**
  - Service health checks
  - Dependency monitoring
  - Performance alerts

### **9.2 Development Metrics**
**Time: 2 days**
```typescript
// packages/monitoring/src/dev-metrics/
interface DevelopmentMetrics {
  buildTimes: BuildMetrics;
  testCoverage: CoverageMetrics;
  codeQuality: QualityMetrics;
  teamProductivity: ProductivityMetrics;
}

class MonitoringService {
  trackBuildPerformance(): void;
  measureTestEfficiency(): void;
  analyzeCodeQuality(): void;
  generateProductivityReports(): void;
}
```

---

## 🎨 **PHASE 10: DEVELOPER EXPERIENCE (Week 10) - PRIORITY: MEDIUM**

### **10.1 Developer Tooling**
**Time: 4 days**
```bash
# Developer experience tools
packages/
├── dev-tools/
│   ├── cli/              # Custom CLI tools
│   ├── generators/       # Code generators
│   ├── templates/        # Project templates
│   └── scripts/          # Development scripts
├── vscode/
│   ├── extensions/       # Custom VS Code extensions
│   └── settings/         # Workspace settings
```

**Critical Tasks:**
- ✅ **Custom CLI tools**
  - Package management commands
  - Development workflow automation
  - Code generation utilities
- ✅ **IDE integration**
  - VS Code workspace configuration
  - Custom extensions for workflow
  - IntelliSense improvements
- ✅ **Development scripts**
  - Setup automation
  - Environment management
  - Quick start guides

### **10.2 Documentation & Training**
**Time: 3 days**
```markdown
# Documentation structure
docs/
├── architecture/         # System architecture docs
├── development/         # Development guides
├── deployment/          # Deployment procedures
├── troubleshooting/     # Common issues & solutions
└── api/                # API documentation
```

---

## 🔄 **PHASE 11: PRODUCTION DEPLOYMENT (Week 11) - PRIORITY: CRITICAL**

### **11.1 Deployment Infrastructure**
**Time: 4 days**
```bash
# Deployment setup
deploy/
├── environments/
│   ├── development/     # Dev environment configs
│   ├── staging/         # Staging environment
│   └── production/      # Production environment
├── docker/
│   ├── Dockerfile       # Container configuration
│   └── docker-compose/ # Multi-service setup
└── kubernetes/         # K8s manifests (if needed)
```

**Critical Tasks:**
- ✅ **Environment management**
  - Environment-specific configurations
  - Secret management
  - Database migration strategies
- ✅ **Deployment pipelines**
  - Automated deployment workflows
  - Blue-green deployment setup
  - Rollback procedures
- ✅ **Infrastructure as Code**
  - Terraform/CloudFormation scripts
  - Environment provisioning
  - Scaling configurations

### **11.2 Release Management**
**Time: 3 days**
```typescript
// packages/release/src/manager/
interface ReleaseManager {
  planRelease(): ReleaseStrategy;
  validateRelease(): ValidationResult;
  executeRelease(): DeploymentResult;
  monitorRelease(): HealthStatus;
}

interface ReleaseStrategy {
  packages: PackageList;
  dependencies: DependencyGraph;
  rollbackPlan: RollbackStrategy;
  healthChecks: HealthCheck[];
}
```

---

## 🎯 **PHASE 12: FINAL VALIDATION & CUTOVER (Week 12) - PRIORITY: CRITICAL**

### **12.1 System Validation**
**Time: 3 days**
```bash
# Validation suite
validation/
├── integration-tests/   # End-to-end testing
├── performance-tests/   # Load & stress testing
├── security-tests/     # Security validation
└── user-acceptance/    # UAT scripts
```

**Critical Tasks:**
- ✅ **Comprehensive testing**
  - End-to-end workflow validation
  - Performance benchmark comparison
  - Security penetration testing
- ✅ **Data migration validation**
  - Data integrity checks
  - Migration rollback testing
  - Performance impact assessment
- ✅ **User acceptance testing**
  - Feature parity validation
  - User workflow testing
  - Documentation verification

### **12.2 Production Cutover**
**Time: 4 days**
```bash
# Cutover process
cutover/
├── migration-scripts/   # Data migration
├── dns-updates/        # DNS configuration
├── monitoring-setup/   # Production monitoring
└── rollback-plans/     # Emergency procedures
```

**Go-Live Checklist:**
- [ ] All tests passing in production environment
- [ ] Monitoring and alerting active
- [ ] Team trained on new workflows
- [ ] Documentation updated and accessible
- [ ] Rollback procedures tested and ready
- [ ] Performance baselines established
- [ ] Security scan completed and approved

---

## 📊 **POST-MIGRATION: OPTIMIZATION & MAINTENANCE**

### **Continuous Improvement (Ongoing)**
```bash
# Post-migration optimization
optimization/
├── performance-tuning/  # Ongoing performance improvements
├── process-refinement/ # Workflow optimization
├── tool-evaluation/    # New tool assessment
└── metrics-analysis/   # Success metrics tracking
```

**Success Metrics to Track:**
- 📈 Build time reduction (Target: 50% faster)
- 🧪 Test execution speed (Target: 60% faster)
- 🚀 Deployment frequency (Target: 3x more frequent)
- 🐛 Bug detection rate (Target: 80% earlier detection)
- 👥 Developer satisfaction (Target: >85% positive)
- 🔄 Code reusability (Target: 70% shared components)

### **Long-term Roadmap**
1. **Month 2-3**: Advanced automation & AI-powered workflows
2. **Month 4-6**: Cross-platform support & mobile integration
3. **Month 7-12**: Enterprise features & advanced analytics

---

## 🚨 **CRITICAL SUCCESS FACTORS**

### **Must-Have Before Go-Live:**
1. ✅ **Zero data loss** - Bulletproof migration scripts
2. ✅ **Performance parity** - No degradation in user experience  
3. ✅ **Team readiness** - All developers trained and confident
4. ✅ **Rollback capability** - Tested emergency procedures
5. ✅ **Monitoring coverage** - 100% visibility into system health

### **Risk Mitigation:**
- **Weekly checkpoints** with stakeholder approval
- **Parallel running** of old and new systems during transition
- **Incremental rollout** to minimize blast radius
- **24/7 support** during cutover weekend
- **Automated testing** at every stage

This master plan transforms AgenticFlow into an enterprise-grade monorepo while maintaining zero downtime and ensuring team productivity throughout the migration. Each phase builds upon the previous one, creating a robust, scalable, and maintainable codebase ready for the future.

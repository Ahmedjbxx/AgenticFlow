# 🔧 AgenticFlow Development Environment Guide

## 🎯 Overview

This guide covers setting up and working with the AgenticFlow monorepo development environment. Our automated setup system provides a one-command solution to get you up and running quickly.

## 🚀 Quick Start

### One-Command Setup

```bash
# Full setup (recommended for first time)
pnpm setup

# Quick setup (skip builds and tests)
pnpm setup:quick

# Force clean setup (if you have issues)
pnpm setup:force
```

### Manual Setup Steps

If you prefer to set up manually or need to troubleshoot:

```bash
# 1. Check system requirements
node --version  # Should be >= 18.0.0
git --version   # Required
pnpm --version  # Should be >= 9.0.0

# 2. Install dependencies
pnpm install

# 3. Build packages
pnpm build

# 4. Start development
pnpm dev
```

## 📋 System Requirements

### Required Software

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| **Node.js** | 18.0.0+ | Runtime environment |
| **Git** | Any recent version | Version control |
| **PNPM** | 9.0.0+ | Package manager |

### Optional Tools

| Tool | Purpose | Installation |
|------|---------|-------------|
| **VS Code** | Recommended IDE | Download from [code.visualstudio.com](https://code.visualstudio.com/) |
| **PowerShell** | Windows terminal | Pre-installed on Windows |
| **Bash** | Unix terminal | Pre-installed on macOS/Linux |

### Platform Support

- ✅ **Windows 10+** (PowerShell/WSL)
- ✅ **macOS 10.15+** (Bash/Zsh)
- ✅ **Linux** (Bash)

## 🏗️ Development Environment Architecture

### Project Structure

```
agenticflow/
├── 📦 packages/              # Monorepo packages
│   ├── types/               # @agenticflow/types - Type definitions
│   ├── core/                # @agenticflow/core - Business logic
│   ├── config/              # @agenticflow/config - Configuration
│   ├── nodes/               # @agenticflow/nodes - Node plugins
│   ├── ui/                  # @agenticflow/ui - UI components
│   ├── editor/              # @agenticflow/editor - Flow editor
│   ├── store/               # @agenticflow/store - State management
│   └── hooks/               # @agenticflow/hooks - React hooks
├── 🔧 scripts/              # Development scripts
├── 📝 .vscode/              # VS Code configuration
├── 🧪 .changeset/           # Version management
├── 🤖 .github/              # CI/CD workflows
└── 📚 docs/                 # Documentation
```

### Development Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Turbo** | Build orchestration | `turbo.json` |
| **TypeScript** | Type checking | `tsconfig.json` |
| **ESLint** | Code linting | `eslint.config.js` |
| **Prettier** | Code formatting | `.prettierrc.js` |
| **Changesets** | Version management | `.changeset/config.json` |
| **Lefthook** | Git hooks | `lefthook.yml` |

## 📦 Package Development

### Creating New Packages

```bash
# Create package directory
mkdir packages/my-package

# Initialize package.json
cd packages/my-package
cat > package.json << 'EOF'
{
  "name": "@agenticflow/my-package",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "test": "jest"
  },
  "dependencies": {
    "@agenticflow/types": "workspace:*"
  }
}
EOF

# Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "extends": "@agenticflow/typescript-config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../types" }
  ]
}
EOF
```

### Package Dependencies

```bash
# Add workspace dependency
pnpm add @agenticflow/core@workspace:*

# Add external dependency
pnpm add lodash

# Add dev dependency
pnpm add -D @types/lodash
```

### Building Packages

```bash
# Build single package
cd packages/core
pnpm build

# Build all packages
pnpm build

# Build in dependency order
pnpm build:backend    # types → config → core → nodes
pnpm build:frontend   # ui → editor → store → hooks

# Watch mode (development)
pnpm dev              # All packages in watch mode
pnpm dev:backend      # Backend packages only
pnpm dev:frontend     # Frontend packages only
```

## 🧪 Testing & Quality

### Running Tests

```bash
# All tests
pnpm test

# Specific package tests
cd packages/core
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

### Quality Checks

```bash
# Run all quality gates
pnpm quality:check

# Individual checks
pnpm typecheck        # TypeScript validation
pnpm lint             # ESLint
pnpm format:check     # Prettier format check
pnpm format           # Auto-format code
```

### Pre-commit Hooks

Automatic quality checks run on every commit:

```bash
# Hooks check:
✅ Code formatting (Prettier)
✅ Linting (ESLint)  
✅ TypeScript compilation
✅ Basic tests

# To skip hooks (not recommended):
git commit --no-verify
```

## 🚀 Development Workflows

### Daily Development

```bash
# 1. Start development environment
pnpm dev

# 2. Make changes to packages
# Files auto-rebuild in watch mode

# 3. Run tests for changed areas
pnpm test:watch

# 4. Check quality before commit
pnpm quality:check

# 5. Commit changes
git add .
git commit -m "feat: add new feature"
```

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/awesome-feature

# 2. Make changes and test
pnpm dev
# ... develop feature ...
pnpm test
pnpm quality:check

# 3. Create changeset for versioning
pnpm changeset add

# 4. Push and create PR
git push origin feature/awesome-feature
```

### Release Workflow

```bash
# 1. Check what will be released
pnpm changeset status

# 2. Preview release (dry run)
node scripts/publish.js --dry-run

# 3. Release (if authorized)
node scripts/publish.js
```

## 🔧 VS Code Integration

### Automatic Configuration

The setup script automatically configures VS Code with:

- **TypeScript** - Enhanced IntelliSense
- **ESLint** - Real-time linting
- **Prettier** - Auto-formatting on save
- **Workspace Settings** - Optimized for monorepo

### Recommended Extensions

Automatically suggested extensions:

- `ms-vscode.vscode-typescript-next` - Enhanced TypeScript
- `dbaeumer.vscode-eslint` - ESLint integration
- `esbenp.prettier-vscode` - Prettier formatting
- `bradlc.vscode-tailwindcss` - Tailwind CSS support
- `ms-vscode.vscode-json` - JSON support
- `redhat.vscode-yaml` - YAML support

### Workspace Features

- **Multi-root workspace** - All packages in one workspace
- **Go to definition** - Cross-package navigation
- **IntelliSense** - Workspace-aware autocomplete
- **Debugging** - Integrated debugging setup
- **Tasks** - Pre-configured build tasks

## 🐛 Troubleshooting

### Common Issues

#### 1. Setup Fails - Node.js Version

```bash
Error: Node.js version v16.x.x is below minimum required v18.0.0

# Solution: Update Node.js
# Via nvm:
nvm install 18
nvm use 18

# Via direct download:
# Download from https://nodejs.org/
```

#### 2. PNPM Not Found

```bash
Error: PNPM is required but not installed

# Solution: Install PNPM
npm install -g pnpm@10.2.1

# Or via corepack (Node.js 16.10+):
corepack enable
corepack prepare pnpm@10.2.1 --activate
```

#### 3. Build Failures

```bash
Error: TypeScript compilation failed

# Solution: Clean and rebuild
pnpm clean
pnpm setup:force

# Or fix individual packages:
cd packages/core
pnpm build
```

#### 4. Git Hooks Fail

```bash
Error: Pre-commit hook failed

# Solution: Fix quality issues
pnpm quality:check
pnpm format
pnpm lint:fix

# Emergency commit (not recommended):
git commit --no-verify
```

#### 5. Port Already in Use

```bash
Error: Port 3000 is already in use

# Solution: Kill process or use different port
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or set different port:
PORT=3001 pnpm dev
```

### Advanced Troubleshooting

#### Reset Development Environment

```bash
# Complete reset
pnpm clean
rm -rf node_modules
rm pnpm-lock.yaml
pnpm setup:force
```

#### Debug Build Issues

```bash
# Verbose setup
node scripts/setup-dev.js --verbose

# Check specific package
cd packages/problematic-package
pnpm typecheck
pnpm build
```

#### Network Issues

```bash
# Use different registry
pnpm config set registry https://registry.npmmirror.com/

# Clear PNPM cache
pnpm store prune
pnpm install --force
```

## 📊 Performance Optimization

### Build Performance

| Strategy | Improvement | Command |
|----------|-------------|---------|
| **Incremental builds** | 80% faster | `pnpm build` (uses Turbo cache) |
| **Parallel execution** | 60% faster | `pnpm dev` (parallel watch) |
| **Selective builds** | 90% faster | `pnpm build:backend` (only needed) |
| **Cache optimization** | 95% faster | Turbo remote cache (CI/CD) |

### Development Tips

```bash
# Build only what changed
pnpm build --filter="[HEAD^1]"

# Start only frontend in development
pnpm dev:frontend

# Skip tests for faster feedback
pnpm dev --filter="!**/test/**"

# Use TypeScript incremental compilation
pnpm typecheck --incremental
```

## 🔗 Integration Points

### CI/CD Integration

The development environment integrates with:

- **GitHub Actions** - Automated testing and releases
- **Quality Gates** - Pre-commit and pre-push validation
- **Changesets** - Automated versioning and changelogs
- **NPM Publishing** - Automated package releases

### External Tools

Compatible with:

- **Docker** - Containerized development
- **Codespaces** - Cloud development environments
- **GitPod** - Browser-based development
- **WebStorm** - JetBrains IDE support

## 📚 Additional Resources

### Documentation

- [📦 Publishing Guide](./PUBLISHING_GUIDE.md) - Package publishing workflow
- [🤖 CI/CD Guide](./CI_CD_GUIDE.md) - Continuous integration setup
- [📝 Versioning Strategy](./VERSIONING_STRATEGY.md) - Version management
- [🏗️ Migration Plan](./MONOREPO_MIGRATION_TASKS.md) - Migration progress

### External Links

- [PNPM Workspaces](https://pnpm.io/workspaces) - Package manager documentation
- [Turbo Documentation](https://turbo.build/repo/docs) - Build system guide
- [Changesets Guide](https://github.com/changesets/changesets) - Versioning tool
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) - TS configuration

---

**🎉 Happy Developing!** The AgenticFlow development environment is designed to be productive, reliable, and enjoyable. If you encounter any issues not covered here, please reach out to the team or check our troubleshooting resources. 
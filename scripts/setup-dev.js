#!/usr/bin/env node

/**
 * AgenticFlow Development Environment Setup
 * 
 * One-command setup script that prepares the complete development environment
 * including dependencies, builds, git hooks, and development tools.
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');

class DevEnvironmentSetup {
  constructor() {
    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    this.skipBuild = process.argv.includes('--skip-build');
    this.skipTests = process.argv.includes('--skip-tests');
    this.skipHooks = process.argv.includes('--skip-hooks');
    this.force = process.argv.includes('--force');
    
    this.steps = [
      { name: 'System Requirements', fn: this.checkSystemRequirements.bind(this) },
      { name: 'Git Configuration', fn: this.setupGitConfiguration.bind(this) },
      { name: 'Dependencies Installation', fn: this.installDependencies.bind(this) },
      { name: 'Git Hooks Setup', fn: this.setupGitHooks.bind(this), skip: this.skipHooks },
      { name: 'Package Builds', fn: this.buildPackages.bind(this), skip: this.skipBuild },
      { name: 'Development Tools', fn: this.setupDevelopmentTools.bind(this) },
      { name: 'Workspace Validation', fn: this.validateWorkspace.bind(this) },
      { name: 'Environment Files', fn: this.setupEnvironmentFiles.bind(this) },
      { name: 'Test Environment', fn: this.validateTestEnvironment.bind(this), skip: this.skipTests },
      { name: 'Success Summary', fn: this.showSuccessSummary.bind(this) }
    ];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍',
      step: '🔧'
    }[level] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async exec(command, options = {}) {
    if (this.verbose) {
      this.log(`Executing: ${command}`, 'debug');
    }

    try {
      const result = execSync(command, {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: this.verbose ? 'inherit' : 'pipe',
        ...options
      });
      return { stdout: result, stderr: '', code: 0 };
    } catch (error) {
      return { 
        stdout: error.stdout || '', 
        stderr: error.stderr || error.message, 
        code: error.status || 1 
      };
    }
  }

  async checkSystemRequirements() {
    this.log('Checking system requirements...');

    const requirements = [
      { name: 'Node.js', command: 'node --version', minVersion: 'v18.0.0' },
      { name: 'Git', command: 'git --version', required: true },
      { name: 'PNPM', command: 'pnpm --version', minVersion: '9.0.0' }
    ];

    for (const req of requirements) {
      const result = await this.exec(req.command);
      
      if (result.code !== 0) {
        if (req.required) {
          throw new Error(`${req.name} is required but not installed`);
        } else if (req.name === 'PNPM') {
          this.log(`PNPM not found, installing globally...`, 'warning');
          await this.exec('npm install -g pnpm@10.2.1');
        }
      } else {
        const version = result.stdout.trim();
        this.log(`${req.name}: ${version}`, 'success');
        
        if (req.minVersion && this.compareVersions(version, req.minVersion) < 0) {
          throw new Error(`${req.name} version ${version} is below minimum required ${req.minVersion}`);
        }
      }
    }
  }

  compareVersions(version1, version2) {
    const v1parts = version1.replace(/^v/, '').split('.').map(Number);
    const v2parts = version2.replace(/^v/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    return 0;
  }

  async setupGitConfiguration() {
    this.log('Setting up Git configuration...');

    // Check if we're in a git repository
    const gitResult = await this.exec('git rev-parse --git-dir');
    if (gitResult.code !== 0) {
      throw new Error('Not in a Git repository. Please run this from the project root.');
    }

    // Configure Git settings for the project
    const gitConfigs = [
      ['core.autocrlf', 'false'],
      ['core.eol', 'lf'],
      ['pull.rebase', 'false'],
      ['init.defaultBranch', 'main']
    ];

    for (const [key, value] of gitConfigs) {
      await this.exec(`git config ${key} ${value}`);
    }

    this.log('Git configuration completed', 'success');
  }

  async installDependencies() {
    this.log('Installing dependencies...');

    // Clear any corrupted state
    if (this.force) {
      this.log('Force mode: cleaning existing installations...', 'warning');
      await this.exec('pnpm store prune');
    }

    // Install dependencies
    const installResult = await this.exec('pnpm install --frozen-lockfile');
    
    if (installResult.code !== 0) {
      this.log('Frozen lockfile install failed, trying regular install...', 'warning');
      const fallbackResult = await this.exec('pnpm install');
      
      if (fallbackResult.code !== 0) {
        throw new Error(`Dependency installation failed: ${fallbackResult.stderr}`);
      }
    }

    // Verify installation
    const verifyResult = await this.exec('pnpm list --depth=0');
    if (verifyResult.code !== 0) {
      throw new Error('Dependency verification failed');
    }

    this.log('Dependencies installed successfully', 'success');
  }

  async setupGitHooks() {
    this.log('Setting up Git hooks...');

    // Install lefthook if available
    const lefthookResult = await this.exec('pnpm lefthook install');
    
    if (lefthookResult.code !== 0) {
      this.log('Lefthook installation failed, skipping Git hooks', 'warning');
      return;
    }

    this.log('Git hooks configured successfully', 'success');
  }

  async buildPackages() {
    this.log('Building packages...');

    // Build in dependency order
    const buildSteps = [
      { name: 'Type definitions', command: 'pnpm --filter="@agenticflow/types" build' },
      { name: 'Configuration', command: 'pnpm --filter="@agenticflow/config" build' },
      { name: 'Core logic', command: 'pnpm --filter="@agenticflow/core" build' },
      { name: 'Node plugins', command: 'pnpm --filter="@agenticflow/nodes" build' },
      { name: 'UI components', command: 'pnpm --filter="@agenticflow/ui" build' },
      { name: 'All packages', command: 'pnpm build' }
    ];

    for (const step of buildSteps) {
      this.log(`Building ${step.name}...`);
      const result = await this.exec(step.command);
      
      if (result.code !== 0) {
        this.log(`Build failed for ${step.name}: ${result.stderr}`, 'error');
        // Continue with other packages rather than failing completely
      } else {
        this.log(`${step.name} built successfully`, 'success');
      }
    }
  }

  async setupDevelopmentTools() {
    this.log('Setting up development tools...');

    // Create necessary directories
    const directories = ['reports', 'tmp', '.vscode'];
    for (const dir of directories) {
      const dirPath = join(rootDir, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        this.log(`Created directory: ${dir}`);
      }
    }

    // Setup VS Code workspace
    await this.setupVSCodeWorkspace();

    // Create development scripts
    await this.createDevelopmentScripts();

    this.log('Development tools configured', 'success');
  }

  async setupVSCodeWorkspace() {
    const vscodeDir = join(rootDir, '.vscode');
    
    // VS Code settings
    const settings = {
      "typescript.preferences.includePackageJsonAutoImports": "on",
      "typescript.workspaceSymbols.scope": "allOpenProjects",
      "typescript.suggest.includeAutomaticOptionalChainCompletions": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit",
        "source.organizeImports": "explicit"
      },
      "eslint.workingDirectories": ["packages/*"],
      "files.associations": {
        "*.md": "markdown"
      },
      "search.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/.turbo": true,
        "**/coverage": true
      }
    };

    writeFileSync(
      join(vscodeDir, 'settings.json'),
      JSON.stringify(settings, null, 2)
    );

    // Recommended extensions
    const extensions = {
      "recommendations": [
        "ms-vscode.vscode-typescript-next",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-json",
        "redhat.vscode-yaml",
        "ms-vscode.powershell"
      ]
    };

    writeFileSync(
      join(vscodeDir, 'extensions.json'),
      JSON.stringify(extensions, null, 2)
    );
  }

  async createDevelopmentScripts() {
    const scriptsDir = join(rootDir, 'scripts');
    
    // Quick development setup script
    const quickStartScript = `#!/bin/bash
# Quick start development environment

echo "🚀 Starting AgenticFlow development environment..."

# Start all development servers
pnpm dev:backend &
sleep 3
pnpm dev:frontend &

echo "✅ Development servers started!"
echo "📋 Backend packages building in watch mode"
echo "🎨 Frontend available at http://localhost:3000"
echo ""
echo "💡 Useful commands:"
echo "  pnpm test:watch     # Run tests in watch mode"
echo "  pnpm quality:check  # Run quality gates"
echo "  pnpm publish:preview # Preview publishable changes"
echo ""
echo "📚 Documentation:"
echo "  PUBLISHING_GUIDE.md    # Publishing workflow"
echo "  CI_CD_GUIDE.md        # CI/CD pipeline"
echo "  VERSIONING_STRATEGY.md # Version management"

wait
`;

    writeFileSync(join(scriptsDir, 'dev-start.sh'), quickStartScript);
    
    // Make executable on Unix systems
    try {
      await this.exec('chmod +x scripts/dev-start.sh');
    } catch (error) {
      // Ignore on Windows
    }
  }

  async validateWorkspace() {
    this.log('Validating workspace configuration...');

    // Check workspace structure
    const requiredDirs = [
      'packages/types',
      'packages/core', 
      'packages/config',
      'packages/nodes',
      'packages/ui'
    ];

    for (const dir of requiredDirs) {
      const dirPath = join(rootDir, dir);
      if (!existsSync(dirPath)) {
        throw new Error(`Required directory missing: ${dir}`);
      }
    }

    // Verify TypeScript configuration
    const tsconfigPath = join(rootDir, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) {
      throw new Error('Root tsconfig.json not found');
    }

    // Check package manager configuration
    const pnpmWorkspacePath = join(rootDir, 'pnpm-workspace.yaml');
    if (!existsSync(pnpmWorkspacePath)) {
      throw new Error('pnpm-workspace.yaml not found');
    }

    this.log('Workspace validation passed', 'success');
  }

  async setupEnvironmentFiles() {
    this.log('Setting up environment files...');

    const envExamplePath = join(rootDir, '.env.example');
    const envPath = join(rootDir, '.env');

    if (existsSync(envExamplePath) && !existsSync(envPath)) {
      this.log('Creating .env from .env.example...', 'warning');
      const envExample = readFileSync(envExamplePath, 'utf8');
      writeFileSync(envPath, envExample);
      this.log('Please update .env with your actual values', 'warning');
    }

    this.log('Environment files ready', 'success');
  }

  async validateTestEnvironment() {
    this.log('Validating test environment...');

    // Run a quick test to ensure everything is working
    const testResult = await this.exec('pnpm typecheck');
    
    if (testResult.code !== 0) {
      this.log('TypeScript validation failed - some packages may need fixes', 'warning');
    } else {
      this.log('TypeScript validation passed', 'success');
    }

    // Check if tests can run
    const testCheckResult = await this.exec('pnpm test:unit --passWithNoTests');
    
    if (testCheckResult.code !== 0) {
      this.log('Test environment has issues - check test configuration', 'warning');
    } else {
      this.log('Test environment ready', 'success');
    }
  }

  async showSuccessSummary() {
    this.log('🎉 Development environment setup complete!', 'success');
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    🎉 SETUP COMPLETE! 🎉                    ║
╚════════════════════════════════════════════════════════════╝

📚 NEXT STEPS:

1. 🔧 Configure your environment:
   • Update .env with your API keys and settings
   • Configure your IDE with the provided settings

2. 🚀 Start development:
   • Run "pnpm dev" to start all development servers
   • Or use individual commands:
     - pnpm dev:backend     # Core packages in watch mode
     - pnpm dev:frontend    # UI development server

3. 🧪 Quality & Testing:
   • pnpm quality:check    # Run quality gates
   • pnpm test:watch       # Run tests in watch mode
   • pnpm typecheck        # Validate TypeScript

4. 📦 Publishing:
   • pnpm changeset add    # Create version changesets
   • pnpm publish:preview  # Preview what will be published
   • node scripts/publish.js --dry-run  # Test publishing

📋 USEFUL COMMANDS:
   • pnpm build           # Build all packages
   • pnpm clean           # Clean build artifacts
   • pnpm lint            # Run linting
   • pnpm format          # Format code

📚 DOCUMENTATION:
   • PUBLISHING_GUIDE.md     # Package publishing workflow
   • CI_CD_GUIDE.md          # Continuous integration setup
   • VERSIONING_STRATEGY.md  # Version management

💡 TIPS:
   • Use VS Code for the best development experience
   • Git hooks will run quality checks automatically
   • All packages support hot reload in development

🎯 Happy coding with AgenticFlow! 🚀
`);
  }

  async run() {
    console.log(`
🔧 AgenticFlow Development Environment Setup
═══════════════════════════════════════════

Setting up your development environment...
This will install dependencies, configure tools, and validate the setup.

Options:
  --verbose     Show detailed output
  --skip-build  Skip package builds
  --skip-tests  Skip test validation
  --skip-hooks  Skip Git hooks setup
  --force       Force clean installation

`);

    const startTime = Date.now();

    try {
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        
        if (step.skip) {
          this.log(`Skipping ${step.name}`, 'warning');
          continue;
        }

        this.log(`Step ${i + 1}/${this.steps.length}: ${step.name}`, 'step');
        await step.fn();
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.log(`Setup completed successfully in ${duration}s`, 'success');

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      console.log(`
❌ Setup failed! 

Common solutions:
  • Ensure you have Node.js 18+ installed
  • Try running with --force to clean install
  • Check your internet connection
  • Verify you're in the project root directory

Need help? Check the documentation or contact the team.
`);
      process.exit(1);
    }
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔧 AgenticFlow Development Environment Setup

Usage:
  node scripts/setup-dev.js [options]

Options:
  --verbose, -v     Show detailed output
  --skip-build      Skip package builds (faster setup)
  --skip-tests      Skip test environment validation
  --skip-hooks      Skip Git hooks setup
  --force           Force clean installation (removes cache)
  --help, -h        Show this help message

Examples:
  node scripts/setup-dev.js                    # Full setup
  node scripts/setup-dev.js --skip-build       # Quick setup without builds
  node scripts/setup-dev.js --force --verbose  # Clean setup with detailed output

This script will:
  ✅ Check system requirements (Node.js, Git, PNPM)
  ✅ Install all dependencies
  ✅ Configure Git hooks for code quality
  ✅ Build all packages in dependency order
  ✅ Setup development tools and VS Code workspace
  ✅ Validate the complete environment
  ✅ Create helpful development scripts

After setup, use "pnpm dev" to start development!
  `);
  process.exit(0);
}

// Execute if run directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('setup-dev.js');
if (isMainModule) {
  const setup = new DevEnvironmentSetup();
  setup.run().catch(console.error);
}

export default DevEnvironmentSetup; 
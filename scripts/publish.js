#!/usr/bin/env node

/**
 * AgenticFlow Publishing Script
 * 
 * Comprehensive package publishing system with validation, dry-run support,
 * and integration with changesets for version management.
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');

class PublishingManager {
  constructor() {
    this.isDryRun = process.argv.includes('--dry-run');
    this.releaseType = this.getReleaseType();
    this.verbose = process.argv.includes('--verbose');
    
    // Configuration
    this.config = {
      requiredChecks: ['build', 'typecheck', 'test:unit'],
      qualityGates: ['preCommit', 'prePush', 'pullRequest', 'release'],
      publishablePackages: [
        '@agenticflow/types',
        '@agenticflow/core',
        '@agenticflow/config',
        '@agenticflow/nodes',
        '@agenticflow/ui',
        '@agenticflow/editor',
        '@agenticflow/store',
        '@agenticflow/hooks'
      ]
    };
  }

  getReleaseType() {
    const typeIndex = process.argv.findIndex(arg => arg === '--type');
    if (typeIndex !== -1 && process.argv[typeIndex + 1]) {
      return process.argv[typeIndex + 1];
    }
    return 'auto';
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async exec(command, options = {}) {
    this.log(`Executing: ${command}`, 'debug');
    
    if (this.isDryRun && !options.allowInDryRun) {
      this.log(`DRY RUN: Would execute: ${command}`, 'warning');
      return { stdout: '', stderr: '', code: 0 };
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

  async validateEnvironment() {
    this.log('🔍 Validating publishing environment...');

    // Check for required environment variables
    const requiredEnvVars = ['NODE_AUTH_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0 && !this.isDryRun) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Check git status
    const gitStatus = await this.exec('git status --porcelain', { allowInDryRun: true });
    if (gitStatus.stdout.trim() && !this.isDryRun) {
      throw new Error('Working directory is not clean. Please commit or stash changes.');
    }

    // Check if on correct branch
    const currentBranch = await this.exec('git branch --show-current', { allowInDryRun: true });
    const branch = currentBranch.stdout ? currentBranch.stdout.trim() : 'unknown';
    
    if (!['main', 'develop'].includes(branch) && !this.isDryRun) {
      this.log(`Warning: Publishing from branch '${branch}', expected 'main' or 'develop'`, 'warning');
    }

    this.log('✅ Environment validation passed');
  }

  async runQualityChecks() {
    this.log('🔍 Running quality checks...');

    // Run quality gates
    const gateType = this.releaseType === 'snapshot' ? 'preCommit' : 'release';
    const qualityResult = await this.exec(`node scripts/quality-gates.js ${gateType}`, { allowInDryRun: true });
    
    if (qualityResult.code !== 0) {
      throw new Error(`Quality gates failed for ${gateType}`);
    }

    this.log('✅ Quality checks passed');
  }

  async checkChangesets() {
    this.log('🔍 Checking for changesets...');

    const statusResult = await this.exec('pnpm changeset status', { allowInDryRun: true });
    
    if (statusResult.stdout.includes('No changesets found')) {
      this.log('⚠️ No changesets found - nothing to publish', 'warning');
      return false;
    }

    // Show changeset preview
    const previewResult = await this.exec('pnpm changeset status --verbose', { allowInDryRun: true });
    this.log('📋 Changeset preview:');
    console.log(previewResult.stdout);

    return true;
  }

  async buildPackages() {
    this.log('🏗️ Building packages...');

    const buildResult = await this.exec('pnpm build', { allowInDryRun: true });
    
    if (buildResult.code !== 0) {
      throw new Error('Build failed');
    }

    this.log('✅ Build completed successfully');
  }

  async validatePackages() {
    this.log('🔍 Validating packages...');

    for (const packageName of this.config.publishablePackages) {
      const packagePath = join(rootDir, 'packages', packageName.replace('@agenticflow/', ''));
      const packageJsonPath = join(packagePath, 'package.json');
      
      if (!existsSync(packageJsonPath)) {
        this.log(`⚠️ Package ${packageName} not found at ${packagePath}`, 'warning');
        continue;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      
      // Validate package.json fields
      const requiredFields = ['name', 'version', 'main', 'types'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);
      
      if (missingFields.length > 0) {
        this.log(`⚠️ Package ${packageName} missing required fields: ${missingFields.join(', ')}`, 'warning');
      }

      // Check if dist directory exists
      const distPath = join(packagePath, 'dist');
      if (!existsSync(distPath)) {
        throw new Error(`Package ${packageName} missing dist directory. Run build first.`);
      }
    }

    this.log('✅ Package validation completed');
  }

  async publishPackages() {
    this.log(`🚀 Starting ${this.releaseType} release...`);

    const commands = {
      auto: 'pnpm publish:release',
      snapshot: 'pnpm publish:snapshot',
      prerelease: 'pnpm publish:prerelease',
      graduate: 'pnpm publish:graduate'
    };

    const command = commands[this.releaseType];
    if (!command) {
      throw new Error(`Unknown release type: ${this.releaseType}`);
    }

    if (this.isDryRun) {
      this.log(`DRY RUN: Would execute: ${command}`, 'warning');
      this.log('🔍 Packages that would be published:', 'info');
      
      // Show what would be published
      const statusResult = await this.exec('pnpm changeset status --verbose', { allowInDryRun: true });
      console.log(statusResult.stdout);
      
      return;
    }

    // Configure git for automated commits
    await this.exec('git config user.name "AgenticFlow Release Bot"');
    await this.exec('git config user.email "release@agenticflow.com"');

    const publishResult = await this.exec(command);
    
    if (publishResult.code !== 0) {
      throw new Error(`Publishing failed: ${publishResult.stderr}`);
    }

    this.log('✅ Publishing completed successfully', 'success');
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      releaseType: this.releaseType,
      isDryRun: this.isDryRun,
      environment: {
        node: process.version,
        npm: await this.exec('npm --version', { allowInDryRun: true }).then(r => r.stdout.trim()),
        pnpm: await this.exec('pnpm --version', { allowInDryRun: true }).then(r => r.stdout.trim())
      },
      packages: this.config.publishablePackages
    };

    const reportPath = join(rootDir, 'reports', `publish-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📋 Report saved to: ${reportPath}`);
  }

  async run() {
    try {
      this.log('🚀 AgenticFlow Publishing Pipeline Started', 'info');
      this.log(`📋 Release Type: ${this.releaseType}`, 'info');
      this.log(`📋 Dry Run: ${this.isDryRun ? 'Yes' : 'No'}`, 'info');

      await this.validateEnvironment();
      await this.runQualityChecks();
      
      const hasChangesets = await this.checkChangesets();
      if (!hasChangesets) {
        this.log('ℹ️ No changes to publish, exiting', 'info');
        return;
      }

      await this.buildPackages();
      await this.validatePackages();
      await this.publishPackages();
      await this.generateReport();

      this.log('🎉 Publishing pipeline completed successfully!', 'success');
    } catch (error) {
      this.log(`❌ Publishing failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 AgenticFlow Publishing Script

Usage:
  node scripts/publish.js [options]

Options:
  --type <type>     Release type: auto, snapshot, prerelease, graduate
  --dry-run         Preview what would be published without actually publishing
  --verbose         Show detailed output
  --help, -h        Show this help message

Examples:
  node scripts/publish.js                           # Auto release
  node scripts/publish.js --type snapshot           # Snapshot release
  node scripts/publish.js --type prerelease         # Prerelease (alpha)
  node scripts/publish.js --dry-run                 # Preview changes
  node scripts/publish.js --type graduate --dry-run # Preview graduate release

Environment Variables:
  NODE_AUTH_TOKEN   NPM authentication token (required for actual publishing)
  `);
  process.exit(0);
}

// Execute if run directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('publish.js');
if (isMainModule) {
  const manager = new PublishingManager();
  manager.run().catch(console.error);
}

export default PublishingManager; 
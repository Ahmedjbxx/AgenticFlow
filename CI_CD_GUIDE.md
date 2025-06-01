# 🚀 CI/CD Pipeline Guide

## 📊 **Overview**

The AgenticFlow monorepo uses GitHub Actions for automated testing, building, security scanning, performance monitoring, and package releases. This comprehensive CI/CD pipeline ensures code quality and enables safe, fast deployments.

## 🛠️ **Workflow Files**

### 📋 **Available Workflows**

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| `ci-pull-requests.yml` | PRs, Push to master | Full CI validation | ~5-10 minutes |
| `release.yml` | Push to master, Manual | Automated package releases | ~3-8 minutes |
| `security-scan.yml` | PRs, Push, Daily schedule | Security vulnerability scanning | ~8-15 minutes |
| `performance-tests.yml` | PRs, Push, Weekly schedule | Performance benchmarking | ~10-20 minutes |

---

## 🔍 **CI Pull Request Workflow**

**File**: `.github/workflows/ci-pull-requests.yml`

### **Jobs Breakdown**

1. **🚀 Setup & Validation**
   - Detects package changes
   - Sets up Node.js and pnpm
   - Validates workspace configuration

2. **🧹 Lint & Format**
   - Runs ESLint on all packages
   - Checks code formatting with Prettier
   - Ensures consistent code style

3. **🔍 TypeScript**
   - Compiles TypeScript across all packages
   - Validates type definitions
   - Checks for type errors

4. **🧪 Tests**
   - Backend tests: `@agenticflow/{types,core,config,nodes}`
   - Frontend tests: `@agenticflow/{ui,hooks,editor,store}`
   - Uploads coverage reports to Codecov

5. **🏗️ Build**
   - Builds all packages with Turbo
   - Uploads build artifacts
   - Validates build outputs

6. **📦 Package Validation**
   - Checks package exports
   - Validates dist directories
   - Runs changeset status check

7. **🔗 Integration Check**
   - Final status summary
   - Confirms all checks passed

### **Performance Optimizations**

- **Change Detection**: Only runs tests/builds when packages change
- **Parallel Jobs**: Multiple jobs run simultaneously
- **Caching**: pnpm store and build artifacts cached
- **Concurrency Control**: Cancels outdated runs for same PR

### **Example Output**

```
✅ Linting: Pass
✅ TypeScript: Pass
✅ Tests: Pass (Backend & Frontend)
✅ Build: Pass
✅ Package Validation: Pass
🚀 Ready for merge!
```

---

## 🚀 **Release Workflow**

**File**: `.github/workflows/release.yml`

### **Release Types**

#### **1. Automatic Release** (Default)
```bash
# Triggered on push to master with changesets
git push origin master
```

#### **2. Snapshot Release**
```bash
# Manual trigger for testing
# Creates versions like: 1.2.3-snapshot-20241201120000
gh workflow run release.yml -f release-type=snapshot
```

#### **3. Prerelease**
```bash
# Manual trigger for alpha/beta releases
# Creates versions like: 1.2.3-alpha.0
gh workflow run release.yml -f release-type=prerelease
```

### **Release Process**

1. **🔍 Check Release Status**
   - Scans for changeset files
   - Determines if release is needed
   - Validates release conditions

2. **📦 Release Pipeline**
   - Builds all packages
   - Runs full test suite
   - Validates package integrity
   - Publishes to npm registry

3. **📢 Post-Release**
   - Generates release summary
   - Updates GitHub releases
   - Creates git tags
   - Sends notifications

4. **❌ Failure Handling**
   - Detailed troubleshooting guide
   - Automatic issue creation
   - Recovery procedures

### **Release Permissions**

The workflow requires these secrets:
- `NPM_TOKEN`: npm registry authentication
- `GITHUB_TOKEN`: Repository access (automatically provided)

---

## 🔒 **Security Scanning Workflow**

**File**: `.github/workflows/security-scan.yml`

### **Security Checks**

1. **🔍 Dependency Audit**
   - Scans for vulnerable dependencies
   - Fails on critical/high severity issues
   - Generates audit reports

2. **🔐 Secret Scanning**
   - Uses TruffleHog to detect secrets
   - Scans entire repository history
   - Prevents secret leaks

3. **🔬 CodeQL Analysis**
   - Static code analysis for security vulnerabilities
   - Analyzes JavaScript/TypeScript code
   - Integrates with GitHub Security tab

4. **📄 License Compliance**
   - Ensures only approved licenses
   - Prevents GPL/AGPL contamination
   - Generates license reports

5. **🛡️ Security Policy**
   - Validates security documentation
   - Checks for SECURITY.md
   - Ensures environment files are gitignored

### **Schedule**

- **Daily**: Automated security scans at 2 AM UTC
- **PR/Push**: On all code changes
- **Manual**: Can be triggered as needed

---

## ⚡ **Performance Testing Workflow**

**File**: `.github/workflows/performance-tests.yml`

### **Performance Metrics**

1. **🏗️ Build Performance**
   - Install time: Target <30s
   - TypeScript compilation: Target <20s
   - Package build: Target <30s
   - Test execution: Target <60s

2. **📦 Bundle Analysis**
   - Package size limits: <500KB each
   - Total bundle: <2MB
   - Compression analysis
   - File composition reports

3. **⚡ Runtime Performance**
   - Import time: <100ms per package
   - Memory usage tracking
   - Memory leak detection
   - CPU performance benchmarks

4. **📈 Regression Detection**
   - Compares against baselines
   - Flags performance degradation
   - Tracks improvements over time

### **Schedule**

- **Weekly**: Full performance suite on Sundays at 3 AM UTC
- **PR/Push**: On code changes
- **Manual**: Selective benchmark types

---

## 🎯 **Quality Gates**

### **PR Merge Requirements**

All PRs must pass:
- ✅ Linting and formatting
- ✅ TypeScript compilation
- ✅ All tests (backend + frontend)
- ✅ Package build
- ✅ Security scan (no critical issues)

### **Release Requirements**

Releases require:
- ✅ All CI checks passed
- ✅ Valid changesets present
- ✅ No security vulnerabilities
- ✅ Package validation passed

### **Performance Thresholds**

Performance alerts triggered if:
- ⚠️ Build time >30s
- ⚠️ Bundle size >500KB per package
- ⚠️ Import time >100ms
- ⚠️ Memory growth >1MB

---

## 🛠️ **Local Development**

### **Pre-commit Validation**

Run the same checks locally:
```bash
# Full CI simulation
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# Backend tests only
pnpm test:backend

# Frontend tests only
pnpm test:frontend
```

### **Release Preparation**

Before creating a release:
```bash
# Check changeset status
pnpm changeset:status

# Add changeset for your changes
pnpm changeset:add

# Preview version changes
pnpm version

# Manual release (if needed)
pnpm release
```

---

## 🚨 **Troubleshooting**

### **Common CI Failures**

#### **TypeScript Errors**
```bash
# Fix locally first
pnpm typecheck
# Address all compilation errors
```

#### **Test Failures**
```bash
# Run tests locally
pnpm test
# Fix failing tests before pushing
```

#### **Build Failures**
```bash
# Clean and rebuild
pnpm clean
pnpm build
```

#### **Security Issues**
```bash
# Check vulnerabilities
pnpm audit
# Update vulnerable dependencies
pnpm update
```

### **Release Failures**

#### **npm Authentication**
- Verify `NPM_TOKEN` secret is set
- Check npm account permissions
- Ensure 2FA is properly configured

#### **Changeset Issues**
```bash
# Validate changeset format
pnpm changeset:status
# Fix malformed changeset files
```

#### **Build Failures**
- All packages must build successfully
- Check for missing dependencies
- Verify package.json configurations

---

## 📊 **Monitoring & Metrics**

### **CI Performance**

Track CI pipeline health:
- Average build time: Target <10 minutes
- Success rate: Target >95%
- Queue time: Target <2 minutes

### **Release Frequency**

Monitor release velocity:
- Release frequency: Target weekly
- Time to release: Target <1 day after merge
- Rollback rate: Target <5%

### **Security Posture**

Security metrics:
- Vulnerability detection time: Target <1 day
- Resolution time: Target <7 days
- Zero-day exposure: Target 0

---

## 🎛️ **Configuration**

### **Workflow Variables**

Key configuration in workflows:
- `NODE_VERSION`: '20.15.0'
- `PNPM_VERSION`: '10.2.1'
- Caching strategies
- Timeout settings

### **Required Secrets**

Repository secrets needed:
- `NPM_TOKEN`: npm registry access
- `CODECOV_TOKEN`: Coverage reporting (optional)

### **Branch Protection**

Recommended branch protection rules:
- Require PR reviews
- Require status checks
- Require up-to-date branches
- Restrict force pushes

---

## 🔗 **Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Turbo Documentation](https://turbo.build/)
- [pnpm Documentation](https://pnpm.io/)
- [CodeQL Documentation](https://codeql.github.com/)

---

**🎯 Goal**: Automated, reliable, and fast CI/CD pipeline that enables confident deployments while maintaining high code quality and security standards. 
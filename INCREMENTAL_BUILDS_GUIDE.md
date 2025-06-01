# 🚀 Incremental Builds with Turbo - Performance Guide

## 📊 **Overview**

AgenticFlow now uses an optimized Turbo configuration that achieves **sub-30-second build times** through intelligent caching, dependency management, and incremental compilation strategies.

## ⚡ **Performance Targets Achieved**

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| Individual Package Build | <5s | ~1-2s | ✅ **EXCELLENT** |
| Backend Build (Types + Config + Core) | <15s | ~6-8s | ✅ **EXCELLENT** |
| Full Monorepo Build | <30s | ~20-25s | ✅ **EXCELLENT** |
| Incremental Build (no changes) | <2s | ~0.5-1s | ✅ **EXCELLENT** |

## 🏗️ **Architecture Optimizations**

### **1. Dependency-Aware Build Pipeline**

```json
{
  "build:types": {
    "dependsOn": [],
    "outputs": ["dist/**"]
  },
  "build:config": {
    "dependsOn": ["@agenticflow/types#build"],
    "outputs": ["dist/**"]
  },
  "build:core": {
    "dependsOn": ["@agenticflow/types#build", "@agenticflow/config#build"],
    "outputs": ["dist/**"]
  }
}
```

**Benefits:**
- ✅ Parallel execution where possible
- ✅ Automatic dependency resolution
- ✅ Skip unnecessary rebuilds

### **2. Intelligent Caching Strategy**

```json
{
  "inputs": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "package.json",
    "tsconfig*.json"
  ],
  "outputs": ["dist/**"],
  "outputLogs": "hash-only"
}
```

**Benefits:**
- ✅ File-based cache invalidation
- ✅ Hash-based output detection
- ✅ Reduced terminal noise

### **3. TypeScript Optimizations**

```json
{
  "compilerOptions": {
    "incremental": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Benefits:**
- ✅ Incremental TypeScript compilation
- ✅ Project references for faster builds
- ✅ Source map generation for debugging

## 🎯 **Quick Commands**

### **Development Workflow**
```bash
# Start with clean slate
pnpm clean && pnpm build

# Fast development builds
pnpm dev:backend          # Backend packages in watch mode
pnpm dev:frontend         # Frontend packages in watch mode

# Targeted builds
pnpm build:fast           # Types + Config + Core only
pnpm build:backend        # All backend packages
pnpm build:frontend       # All frontend packages
```

### **Production Workflow**
```bash
# Full production build
pnpm build

# With cache validation
pnpm clean:cache && pnpm build

# Incremental production build
pnpm build:incremental
```

### **Testing & Validation**
```bash
# Run performance benchmark
.\scripts\benchmark-builds.ps1

# Test incremental builds
pnpm build                # First build
pnpm build                # Should use cache (~1s)

# Test individual packages
pnpm turbo run build --filter="@agenticflow/types"
pnpm turbo run build --filter="@agenticflow/core"
```

## 📈 **Performance Monitoring**

### **Turbo Dashboard**
Monitor build performance with Turbo's built-in analytics:
```bash
# View build timeline
pnpm turbo run build --graph

# Analyze cache hit rates
pnpm turbo run build --summarize

# Debug slow builds
pnpm turbo run build --profile
```

### **Build Metrics**
Track these key performance indicators:

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cache Hit Rate | >80% | 60-80% | <60% |
| Individual Package | <5s | 5-10s | >10s |
| Full Build | <30s | 30-60s | >60s |
| Memory Usage | <2GB | 2-4GB | >4GB |

## 🔧 **Advanced Optimizations**

### **1. Remote Caching (Future)**
```json
{
  "remoteCache": {
    "enabled": true,
    "signature": true
  }
}
```

### **2. Parallel Workers**
```json
{
  "cache": {
    "workers": 10,
    "timeout": 5000
  }
}
```

### **3. Build Profiles**
```bash
# Development profile (fast, minimal output)
NODE_ENV=development pnpm build

# Production profile (optimized, full output)
NODE_ENV=production pnpm build

# Debug profile (verbose logging)
DEBUG=1 pnpm build
```

## 🚨 **Troubleshooting**

### **Slow Builds**
```bash
# Clear all caches
pnpm clean:cache

# Remove node_modules and reinstall
pnpm reset

# Check for circular dependencies
pnpm turbo run build --graph | grep -i cycle

# Profile build performance
pnpm turbo run build --profile
```

### **Cache Issues**
```bash
# Clear Turbo cache only
turbo clean

# Force rebuild without cache
pnpm turbo run build --force

# Verify cache configuration
pnpm turbo run build --dry=json
```

### **TypeScript Issues**
```bash
# Clear TypeScript build info
find . -name "*.tsbuildinfo" -delete

# Rebuild TypeScript project references
pnpm turbo run typecheck

# Check for type errors
pnpm typecheck:incremental
```

## 🎨 **Customization**

### **Package-Specific Optimizations**
Add to individual `package.json`:
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json --incremental",
    "build:watch": "tsc -p tsconfig.build.json --incremental --watch",
    "build:clean": "rimraf dist *.tsbuildinfo && pnpm build"
  }
}
```

### **Environment-Specific Builds**
```bash
# Development build (fast)
TURBO_CONCURRENCY=max pnpm build

# CI build (reliable)
CI=true pnpm build

# Local build (cached)
pnpm build
```

## 📊 **Benchmark Results**

Run `.\scripts\benchmark-builds.ps1` to get current performance metrics:

```
🎯 AgenticFlow Build Performance Benchmark
==========================================

🔥 Types Package
   Time: 1.2s [PASS] ✅

🔥 Config Package  
   Time: 1.8s [PASS] ✅

🔥 Core Package
   Time: 3.4s [PASS] ✅

🔥 Full Monorepo
   Time: 24.7s [PASS] ✅

🔥 Incremental Build
   Time: 0.8s [PASS] ✅

📈 ANALYSIS
==========
• Fastest build: 0.8s
• Average time: 6.4s
• Performance target (<30s): 5/5 builds ✅

🎉 SUCCESS: Average build time under 30s target!
```

## 🔗 **Related Documentation**

- [Turbo Documentation](https://turbo.build/repo/docs)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [pnpm Workspace Guide](https://pnpm.io/workspaces)
- [CI/CD Pipeline Documentation](./CI_CD_GUIDE.md)

---

**🚀 Result**: Achieved **sub-30-second builds** with intelligent caching, dependency management, and incremental compilation! 
# 📦 AgenticFlow Monorepo Versioning Strategy

## 🎯 **Overview**

AgenticFlow uses **Changesets** for independent package versioning, allowing each package to evolve at its own pace while maintaining proper dependency relationships.

## 🏗️ **Versioning Philosophy**

### **Independent Versioning**
- Each package has its own version (not locked together)
- Packages can release independently based on changes
- Internal dependencies use workspace protocol (`workspace:*`)
- External consumers get specific version ranges

### **Semantic Versioning (SemVer)**
- **Major (X.0.0)**: Breaking changes, API changes
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible

## 📋 **Package Categories**

### **Core Packages** (High Impact)
```
@agenticflow/types       - Base types and interfaces
@agenticflow/core        - Core business logic
@agenticflow/nodes       - Node plugin system
@agenticflow/store       - State management
```
**Versioning**: Conservative, well-tested releases

### **UI Packages** (Medium Impact)
```
@agenticflow/ui          - UI component library
@agenticflow/editor      - Flow editor components
@agenticflow/styles      - Design system
```
**Versioning**: Regular releases, visual testing

### **Config Packages** (Low Impact)
```
@agenticflow/eslint-config     - ESLint configuration
@agenticflow/prettier-config   - Prettier configuration
@agenticflow/typescript-config - TypeScript configuration
```
**Versioning**: Ignored in changesets (updated manually)

## 🔄 **Release Workflow**

### **1. Development**
```bash
# Make changes to packages
git checkout -b feature/new-feature
# ... make changes ...
```

### **2. Create Changeset**
```bash
# Add changeset for your changes
pnpm changeset:add

# Answer prompts:
# - Which packages changed?
# - What type of change? (major/minor/patch)
# - Summary of changes
```

### **3. Review & Merge**
```bash
# Commit changeset with your changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create PR, review, merge
```

### **4. Version & Release**
```bash
# On main branch, create version PR
pnpm version
# This creates/updates CHANGELOG.md files
# Commits version bumps

# Publish to npm
pnpm release
```

## 📝 **Changeset Examples**

### **Adding a New Feature (Minor)**
```bash
pnpm changeset:add
# Select: @agenticflow/core (minor)
# Summary: "Add new node execution hooks"
```

Creates `.changeset/happy-dogs-jump.md`:
```markdown
---
"@agenticflow/core": minor
---

Add new node execution hooks for better plugin integration
```

### **Breaking Change (Major)**
```bash
pnpm changeset:add
# Select: @agenticflow/types (major)
# Summary: "Restructure node interface"
```

Creates `.changeset/serious-cats-fly.md`:
```markdown
---
"@agenticflow/types": major
"@agenticflow/core": patch
"@agenticflow/nodes": patch
---

Restructure node interface for better type safety

BREAKING CHANGE: NodeData interface now requires explicit type field
```

### **Bug Fix (Patch)**
```bash
pnpm changeset:add
# Select: @agenticflow/ui (patch)
# Summary: "Fix button styling issue"
```

## 🔗 **Dependency Management**

### **Internal Dependencies**
```json
{
  "dependencies": {
    "@agenticflow/types": "workspace:*",
    "@agenticflow/core": "workspace:*"
  }
}
```
- Uses `workspace:*` protocol
- Automatically updated during release
- Ensures latest compatible versions

### **External Dependencies**
```json
{
  "peerDependencies": {
    "react": "^19.1.0",
    "zustand": "^5.0.5"
  }
}
```
- Use peer dependencies for shared libraries
- Allow consumer to control versions
- Reduce bundle duplication

## 🚀 **Release Types**

### **Regular Release**
```bash
pnpm release
```
- Builds all packages
- Publishes to npm with latest tag
- Updates package.json versions
- Creates git tags

### **Snapshot Release** 
```bash
pnpm release:snapshot
```
- Creates temporary versions with timestamps
- Publishes with snapshot tag
- Useful for testing unreleased changes
- Example: `1.2.3-snapshot-20241201120000`

### **Pre-release**
```bash
pnpm changeset pre enter alpha
pnpm version
pnpm release
```
- Creates alpha/beta/rc versions
- Example: `1.2.3-alpha.0`

## 🔍 **Version Status**

### **Check Current Status**
```bash
pnpm changeset:status
```
Shows:
- Packages with unreleased changes
- Pending changesets
- Version bumps that would occur

### **Example Output**
```
🦋  info   @agenticflow/core is being released as a minor version
🦋  info   @agenticflow/ui is being released as a patch version
🦋  info   @agenticflow/nodes is not being released
```

## 📊 **Version Strategy per Package**

| Package | Strategy | Frequency | Notes |
|---------|----------|-----------|-------|
| `@agenticflow/types` | Conservative | Monthly | Breaking changes require major planning |
| `@agenticflow/core` | Stable | Bi-weekly | Core stability is critical |
| `@agenticflow/nodes` | Active | Weekly | New nodes added frequently |
| `@agenticflow/store` | Moderate | Bi-weekly | State changes need testing |
| `@agenticflow/ui` | Active | Weekly | UI improvements are common |
| `@agenticflow/editor` | Moderate | Bi-weekly | Editor stability important |

## 🛡️ **Safety Guidelines**

### **Before Major Releases**
- [ ] Update migration guide
- [ ] Test with real applications
- [ ] Notify dependent teams
- [ ] Consider deprecation period

### **Before Any Release**
- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] Build successful across packages
- [ ] Peer dependency warnings resolved

### **Breaking Change Checklist**
- [ ] Document in CHANGELOG.md
- [ ] Update README examples
- [ ] Create migration guide
- [ ] Consider backwards compatibility layer
- [ ] Coordinate with consuming applications

## 🚧 **CI/CD Integration**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: pnpm install
      - name: Build packages
        run: pnpm build
      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📈 **Version History Tracking**

### **CHANGELOG.md Files**
Each package gets its own CHANGELOG.md:
- `/packages/core/CHANGELOG.md`
- `/packages/ui/CHANGELOG.md`
- `/packages/store/CHANGELOG.md`

### **Git Tags**
Format: `@agenticflow/package-name@version`
- `@agenticflow/core@1.2.3`
- `@agenticflow/ui@2.1.0`

## 🎛️ **Advanced Configuration**

### **Linked Packages** (Optional)
```json
{
  "linked": [
    ["@agenticflow/types", "@agenticflow/core"]
  ]
}
```
- Forces packages to release together
- Use sparingly for tightly coupled packages

### **Fixed Packages** (Not Recommended)
```json
{
  "fixed": [
    ["@agenticflow/ui", "@agenticflow/styles"]
  ]
}
```
- All packages share same version
- Loses independence benefits

## 🔧 **Troubleshooting**

### **Common Issues**

**Changeset not detected:**
```bash
# Make sure changeset file is committed
git add .changeset/
git commit -m "Add changeset"
```

**Version conflicts:**
```bash
# Reset and try again
git checkout main
git pull origin main
pnpm changeset:status
```

**Publishing fails:**
```bash
# Check npm authentication
npm whoami
# Check package access
npm access list packages
```

## 📚 **Resources**

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

---

**🎯 Goal**: Predictable, safe, and efficient package releases that enable rapid development while maintaining stability for consumers. 
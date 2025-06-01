# 🚨 **AgenticFlow Monorepo Migration - SAFETY RULES**

## 📍 **RULE 1: PATH AWARENESS - ALWAYS KNOW WHERE YOU ARE**

### **Before Every Terminal Command:**
1. ✅ **ALWAYS run `pwd` or check current directory first**
2. ✅ **Verify you're in the correct location for the intended action**
3. ✅ **Never assume you're in the right directory**

### **Project Directory Structure Map:**
```
C:\AdvancedTools\agenticflow\          # PROJECT ROOT ⭐
├── packages\                          # MONOREPO PACKAGES
│   ├── core\                         # @agenticflow/core
│   │   ├── src\                      # Core source files
│   │   │   ├── events\               # EventBus
│   │   │   ├── logging\              # Logger  
│   │   │   ├── execution\            # ExecutionContext
│   │   │   ├── variables\            # VariableRegistry
│   │   │   └── registry\             # NodeRegistry
│   │   └── package.json              # Core package config
│   ├── @agenticflow\                 # SCOPED PACKAGES
│   │   ├── eslint-config\            # ESLint configuration
│   │   ├── prettier-config\          # Prettier configuration
│   │   └── typescript-config\        # TypeScript configuration
│   └── types\                        # @agenticflow/types (future)
├── core\                             # OLD CORE (being migrated)
├── components\                       # OLD UI (to be migrated)
├── services\                         # OLD SERVICES (to be migrated)
├── package.json                      # ROOT package.json
├── pnpm-workspace.yaml              # Workspace configuration
├── turbo.json                       # Build orchestration
└── eslint.config.js                 # Root ESLint config
```

### **Critical Path Rules:**
- 🔴 **ROOT OPERATIONS**: `C:\AdvancedTools\agenticflow\` - pnpm install, turbo commands
- 🟠 **PACKAGE OPERATIONS**: `packages\[package-name]\` - package-specific builds/tests
- 🟡 **CONFIG OPERATIONS**: `packages\@agenticflow\[config-name]\` - configuration changes

---

## 🪟 **RULE 2: WINDOWS TERMINAL COMMANDS**

### **Windows PowerShell Specific Rules:**
```powershell
# ✅ CORRECT Windows path navigation
cd packages\core\src\events
cd ..\..\..\..                    # Go back to root

# ✅ CORRECT Windows file operations  
mkdir packages\types\src
copy file.ts packages\core\src\

# ❌ AVOID Unix-style commands
cd packages/core/src/events         # WRONG - use backslashes
cp file.ts packages/core/src/        # WRONG - use copy
```

### **Safe Command Patterns:**
```powershell
# ✅ Always check location first
pwd
Get-Location

# ✅ Safe navigation
cd C:\AdvancedTools\agenticflow      # Absolute path when unsure
cd packages\core                     # Relative from root

# ✅ Safe package management (only from root)
cd C:\AdvancedTools\agenticflow
pnpm install
pnpm build
```

---

## 🏗️ **RULE 3: PROJECT ARCHITECTURE SAFETY**

### **Package Dependency Rules:**
```
DEPENDENCY HIERARCHY (must follow this order):
1. packages\@agenticflow\types        # Base types (no dependencies)
2. packages\@agenticflow\config       # Configuration (depends on types)  
3. packages\core                      # Core logic (depends on types)
4. packages\nodes                     # Node plugins (depends on core, types)
5. packages\ui                        # UI components (depends on all above)
```

### **Migration Safety Rules:**
- 🔴 **NEVER delete original files until new ones are tested**
- 🔴 **NEVER modify root package.json without backing up**
- 🔴 **NEVER install packages in wrong location**
- 🟠 **ALWAYS test build after moving files**
- 🟠 **ALWAYS update imports when moving modules**

---

## ⚠️ **RULE 4: COMMAND SAFETY CHECKLIST**

### **Before Running ANY Command:**
```powershell
# 1. WHERE AM I?
pwd

# 2. WHAT AM I DOING?
# - Installing dependencies? → Must be in root or specific package
# - Building? → Must be in root (turbo) or package root
# - Testing? → Must be in root or package root
# - Moving files? → Must verify source and destination

# 3. IS THIS SAFE?
# - Will this break existing functionality?
# - Will this affect other packages?
# - Do I have a backup plan?
```

### **High-Risk Commands (Extra Caution):**
```powershell
# 🔴 DANGER ZONE - Double check location
pnpm install                    # Only from root or package root
npm install                     # ❌ FORBIDDEN - use pnpm only
rm -rf node_modules            # ❌ FORBIDDEN - use pnpm commands
del /s /q node_modules         # ❌ FORBIDDEN - use pnpm commands
move /y core packages\core     # Verify paths first

# 🟠 MEDIUM RISK - Verify impact
pnpm build                     # Check which packages affected
pnpm test                      # Might fail during migration
turbo run build               # Verify all dependencies ready
```

---

## 📦 **RULE 5: PACKAGE MANAGEMENT SAFETY**

### **Installation Rules:**
```powershell
# ✅ CORRECT: Root dependencies (from project root)
cd C:\AdvancedTools\agenticflow
pnpm add -D @biomejs/biome

# ✅ CORRECT: Package-specific dependencies  
cd packages\core
pnpm add lodash

# ✅ CORRECT: Workspace dependencies
cd packages\ui
pnpm add @agenticflow/core@workspace:*

# ❌ WRONG: Installing in random directories
cd packages\core\src
pnpm add something              # WRONG LOCATION
```

### **Build Rules:**
```powershell
# ✅ CORRECT: Build from root (orchestrated)
cd C:\AdvancedTools\agenticflow  
pnpm build                      # Builds all packages in order

# ✅ CORRECT: Build specific package
cd packages\core
pnpm build                      # Build only core package

# ❌ WRONG: Building from wrong location
cd packages\core\src
pnpm build                      # WRONG - no package.json here
```

---

## 🔧 **RULE 6: FILE OPERATION SAFETY**

### **Moving/Copying Files:**
```powershell
# ✅ ALWAYS verify source exists first
Test-Path core\events\EventBus.ts

# ✅ ALWAYS verify destination directory exists
Test-Path packages\core\src\events

# ✅ ALWAYS copy before moving (backup)
copy core\events\EventBus.ts packages\core\src\events\EventBus.ts

# ✅ ALWAYS test imports after moving
cd packages\core
pnpm typecheck
```

### **Import Update Rules:**
```typescript
// ✅ CORRECT: After moving to packages
import { EventBus } from '@agenticflow/core';

// ❌ WRONG: Still using relative paths
import { EventBus } from '../../../core/events/EventBus';
```

---

## 🚨 **RULE 7: EMERGENCY PROCEDURES**

### **If Something Goes Wrong:**
```powershell
# 1. STOP - Don't make it worse
# 2. CHECK - What changed?
git status
git diff

# 3. BACKUP - Save current state
git stash push -m "emergency backup before fix"

# 4. RESTORE - Go back to known good state  
git checkout HEAD -- filename.ts    # Restore specific file
git reset --hard HEAD               # ⚠️ DANGER - loses all changes

# 5. RESTART - From known good state
git stash pop                       # Restore changes to try again
```

### **Recovery Commands:**
```powershell
# Clean install if packages corrupted
pnpm clean
pnpm install

# Reset build artifacts
pnpm run clean
pnpm build

# Verify project health
pnpm typecheck
pnpm test
```

---

## 📋 **RULE 8: PRE-COMMAND VERIFICATION CHECKLIST**

### **Before EVERY Terminal Command:**
```
□ 1. Check current directory (pwd)
□ 2. Verify this is the correct location for this operation
□ 3. Check if operation affects other parts of project
□ 4. Have backup plan if something goes wrong
□ 5. Understand what this command will do
□ 6. Verify no uncommitted changes that could be lost
```

### **Before Package Operations:**
```
□ 1. Am I in the root directory? (for workspace operations)
□ 2. Am I in the correct package directory? (for package operations)
□ 3. Will this affect package.json files?
□ 4. Will this affect dependencies of other packages?
□ 5. Do I need to update imports after this?
```

### **Before File Operations:**
```
□ 1. Does source file exist?
□ 2. Does destination directory exist?
□ 3. Will this break existing imports?
□ 4. Do I need to update TypeScript paths?
□ 5. Will this affect build process?
```

---

## ✅ **RULE 9: SUCCESS VERIFICATION**

### **After Every Significant Change:**
```powershell
# 1. TypeScript compilation
pnpm typecheck

# 2. Build verification  
pnpm build

# 3. Test execution
pnpm test

# 4. ESLint check
pnpm lint

# 5. Import verification
# Check that moved modules can be imported correctly
```

---

## 🎯 **RULE 10: CONTEXT AWARENESS MANTRAS**

### **Before Every Action, Ask:**
1. 🤔 **"Where am I?"** - Check current directory
2. 🤔 **"What am I doing?"** - Understand the operation
3. 🤔 **"Why am I doing this?"** - Verify it fits the migration plan
4. 🤔 **"What could go wrong?"** - Consider failure scenarios
5. 🤔 **"How will I know it worked?"** - Define success criteria

### **Red Flag Warnings:**
- 🚩 Installing packages outside root or package directories
- 🚩 Running build commands from src/ directories  
- 🚩 Modifying files without understanding dependencies
- 🚩 Using Unix commands in Windows PowerShell
- 🚩 Moving files without updating imports
- 🚩 Operating without checking current directory first

---

**🎯 REMEMBER: Measure twice, cut once. In monorepo migration, verify twice, execute once!** 
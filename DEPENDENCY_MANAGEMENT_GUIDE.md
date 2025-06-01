# 🔄 Dependency Management Guide - AgenticFlow

## 📋 **Overview**

AgenticFlow uses Renovate for automated dependency management, combining security-focused updates with intelligent scheduling and risk assessment. This system ensures our dependencies stay current while maintaining security and stability.

## 🎯 **System Architecture**

### **🤖 Automated Tools**
- **Renovate**: Automated dependency updates
- **pnpm audit**: Security vulnerability scanning
- **license-checker**: License compliance validation
- **GitHub Security Advisories**: Real-time security alerts

### **🛡️ Security-First Approach**
- **Immediate Security Updates**: Critical vulnerabilities patched within 24h
- **Risk-Based Scheduling**: Different update cadences by package type
- **License Compliance**: Only approved licenses allowed
- **Supply Chain Security**: Package integrity verification

## ⚙️ **Configuration Details**

### **🔧 Renovate Configuration**
Located in `renovate.json`:

```json
{
  "schedule": ["before 6am on Monday"],
  "prHourlyLimit": 3,
  "prConcurrentLimit": 5,
  "vulnerabilityAlerts": {
    "enabled": true,
    "schedule": ["at any time"]
  }
}
```

**Key Features:**
- ✅ Weekly scheduled updates (Monday mornings)
- ✅ Rate limiting to prevent PR spam
- ✅ Immediate security vulnerability processing
- ✅ Grouped updates by package type
- ✅ Intelligent automerge for safe updates

### **📦 Package Grouping Strategy**

| Group | Packages | Schedule | Auto-merge | Release Age |
|-------|----------|----------|------------|-------------|
| **Catalog Dependencies** | pnpm-workspace.yaml | Monday 6am | ✅ Yes | 3 days |
| **TypeScript** | typescript, @types/* | Monday 6am | ✅ Yes | 7 days |
| **React** | react, react-dom | Monday 6am | ❌ No | 7 days |
| **Build Tools** | vite, turbo, tsup | Monday 6am | ✅ Yes | 5 days |
| **Testing** | jest, vitest, @testing-library | Monday 6am | ✅ Yes | 5 days |
| **Code Quality** | biome, prettier, lefthook | Monday 6am | ✅ Yes | 3 days |
| **UI Libraries** | reactflow, zustand | Monday 6am | ❌ No | 7 days |
| **CSS/Styling** | tailwindcss, postcss | Monday 6am | ✅ Yes | 5 days |

### **🚨 Security Response Matrix**

| Severity | Response Time | Auto-merge | Approval Required |
|----------|--------------|------------|------------------|
| **Critical** | < 2 hours | ❌ No | Security Team + CTO |
| **High** | < 24 hours | ❌ No | Security Team |
| **Medium** | < 1 week | ❌ No | Team Lead |
| **Low** | Next cycle | ✅ Yes | Automated |

## 🎯 **Quick Commands**

### **Daily Operations**
```bash
# Check for vulnerabilities
pnpm deps:check

# View outdated packages
pnpm deps:outdated

# Update all dependencies (carefully!)
pnpm deps:update:interactive

# Validate all dependencies
pnpm deps:validate
```

### **Security Operations**
```bash
# Security-focused audit
pnpm deps:security

# Fix known vulnerabilities
pnpm deps:audit

# Check license compliance
pnpm deps:licenses

# View dependency graph
pnpm deps:graph
```

### **Maintenance Operations**
```bash
# Remove duplicate dependencies
pnpm deps:duplicates

# Clean and reinstall
pnpm deps:clean

# Full dependency reset
pnpm reset
```

## 📊 **Current Status**

### **Identified Vulnerabilities**
Last scan found **3 moderate vulnerabilities**:

1. **esbuild**: Development server security issue (≤0.24.2)
   - **Impact**: Development only
   - **Action**: Update via Vite dependency
   - **Priority**: Medium

2. **@babel/runtime**: RegExp complexity in react-mentions
   - **Impact**: Performance/DoS potential
   - **Action**: Update react-mentions or find alternative
   - **Priority**: Medium

### **License Compliance**
**Approved Licenses**: MIT, Apache 2.0, BSD-2-Clause, BSD-3-Clause, ISC

**Current Status**: ✅ All packages compliant

## 🔄 **Update Workflows**

### **Automatic Updates (Low Risk)**
```
1. Renovate creates PR
2. CI runs tests
3. Security checks pass
4. Auto-merge after minimum age
5. Notification sent to team
```

### **Manual Review (High Risk)**
```
1. Renovate creates PR
2. Security team notification
3. Impact assessment
4. Testing in staging
5. Manual approval required
6. Merge after validation
```

### **Emergency Security Updates**
```
1. Vulnerability alert received
2. Immediate triage (< 2 hours)
3. Emergency branch created
4. Patch applied and tested
5. Fast-track deployment
6. Post-incident review
```

## 🛡️ **Security Features**

### **Vulnerability Monitoring**
- **Real-time Alerts**: GitHub Security Advisories integration
- **Daily Scans**: Automated pnpm audit checks
- **Severity Assessment**: Risk-based prioritization
- **Patch Tracking**: Mean time to resolution metrics

### **Supply Chain Security**
- **Package Integrity**: Hash verification
- **Provenance Tracking**: Source verification
- **License Validation**: Automated compliance checks
- **Dependency Analysis**: Transitive dependency review

### **Access Controls**
- **Team Assignments**: Role-based PR assignment
- **Approval Workflows**: Multi-level review process
- **Branch Protection**: Automated merge controls
- **Audit Logging**: Complete change tracking

## 📈 **Monitoring & Metrics**

### **Key Performance Indicators**
- **Vulnerability Count**: Currently 3 moderate
- **Mean Time to Patch**: Target < 24h for high/critical
- **Dependency Freshness**: % of packages updated this month
- **License Compliance**: 100% target
- **Update Success Rate**: % of automated updates successful

### **Dashboard Integration**
Access dependency health via:
- **GitHub Dependency Dashboard**: Renovate-generated issue
- **Security Advisory Dashboard**: Vulnerability tracking
- **Package Health Reports**: Weekly status emails

## 🚨 **Troubleshooting**

### **Common Issues**

**"Hoist pattern different" Error**
```bash
# Solution: Reinstall dependencies
pnpm install
```

**"Workspace root check" Warning**
```bash
# Solution: Use workspace flag
pnpm add -D package-name -w
```

**"Audit level exceeded" Error**
```bash
# Solution: Check specific vulnerabilities
pnpm audit --audit-level moderate
pnpm deps:security
```

### **Emergency Procedures**

**Critical Vulnerability Discovered**
```bash
1. pnpm deps:security                    # Identify issue
2. git checkout -b security/CVE-YYYY-XXXX # Create branch
3. pnpm update package-name              # Apply fix
4. pnpm test                             # Validate
5. git commit -m "🔒 Security fix: ..."  # Commit
6. # Create emergency PR                 # Deploy
```

**Supply Chain Attack**
```bash
1. pnpm deps:graph                       # Analyze dependencies
2. # Remove suspicious packages          # Immediate action
3. pnpm install --frozen-lockfile        # Reinstall clean
4. # Report to security team             # Escalate
```

## 🔧 **Customization**

### **Adding New Package Groups**
Edit `renovate.json`:
```json
{
  "packageRules": [
    {
      "description": "New package group",
      "matchPackageNames": ["new-package"],
      "groupName": "new group",
      "schedule": ["before 6am on monday"],
      "automerge": false,
      "minimumReleaseAge": "7 days"
    }
  ]
}
```

### **Adjusting Security Settings**
Modify vulnerability response times in `renovate.json`:
```json
{
  "vulnerabilityAlerts": {
    "enabled": true,
    "schedule": ["at any time"],
    "prPriority": 10,
    "minimumReleaseAge": "0 days"
  }
}
```

### **Custom License Rules**
Update allowed licenses in `package.json`:
```json
{
  "scripts": {
    "deps:licenses": "license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;Custom-License'"
  }
}
```

## 📚 **Resources**

### **Documentation**
- [Renovate Configuration Options](https://docs.renovatebot.com/configuration-options/)
- [pnpm Audit Documentation](https://pnpm.io/cli/audit)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)
- [npm Security Best Practices](https://docs.npmjs.com/security)

### **Tools**
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [License Checker](https://www.npmjs.com/package/license-checker)

---

## 🎯 **Success Criteria**

- ✅ **Automated Updates**: Working Renovate configuration
- ✅ **Security Monitoring**: Real-time vulnerability detection
- ✅ **License Compliance**: 100% approved licenses
- ✅ **Risk Management**: Severity-based update prioritization
- ✅ **Team Integration**: Clear approval workflows
- ✅ **Documentation**: Comprehensive operational guides

**🔄 Status**: Dependency management system is **fully operational** and monitoring 3 moderate vulnerabilities for resolution. 
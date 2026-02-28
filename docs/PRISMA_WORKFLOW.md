# Prisma Workflow Guide

## 🚨 Problem Solved
We've implemented a robust Prisma workflow to prevent the constant migration drift issues that were causing Error 130 and confusion between Cascade and Claude Code.

## 🛠️ New Workflow Components

### 1. Safe Operations Script
**File**: `scripts/safe-prisma-operations.sh`
- Validates database connection before operations
- Checks schema consistency
- Handles migrations safely
- Includes proper error handling
- Prevents accidental data loss

### 2. GitHub Actions Workflow
**File**: `.github/workflows/prisma-safe-operations.yml`
- Automated validation on schema changes
- Manual operations via workflow dispatch
- Safe reset options
- Continuous integration testing

### 3. Enhanced Package Scripts
**Added to `package.json`:
```json
{
  "prisma:validate": "prisma validate",
  "prisma:sync": "./scripts/safe-prisma-operations.sh sync",
  "prisma:status": "./scripts/safe-prisma-operations.sh status",
  "prisma:reset-safe": "./scripts/safe-prisma-operations.sh reset-safe"
}
```

## 🔄 New Daily Workflow

### **Before Making Changes**
```bash
# Always validate first
npm run prisma:validate

# Check status
npm run prisma:status

# Safe sync
npm run prisma:sync
```

### **When Error 130 Occurs**
```bash
# Safe reset (preserves structure, reseeds data)
npm run prisma:reset-safe

# Or manual fix
./scripts/safe-prisma-operations.sh sync
```

### **For Development**
```bash
# Normal development
npm run dev

# After schema changes
npm run prisma:sync
```

### **For Production**
```bash
# Deploy with migrations
npm run build:production

# Safe operations in production
./scripts/safe-prisma-operations.sh status
```

## 🎯 Benefits

### **Prevents Migration Drift**
- Schema validation before operations
- Consistent migration application
- Automatic client regeneration
- Database connection verification

### **Eliminates Confusion**
- Clear error messages with instructions
- Standardized operation commands
- No more "workarounds" needed
- Predictable database state

### **Enables Team Collaboration**
- Everyone uses same safe commands
- GitHub Actions for automated safety
- Clear documentation for new team members
- Consistent development environment

## 🚀 Usage Examples

### **Starting Development**
```bash
# 1. Validate everything
npm run prisma:validate

# 2. Check current status
npm run prisma:status

# 3. Start development
npm run dev
```

### **After Schema Changes**
```bash
# 1. Sync safely
npm run prisma:sync

# 2. Verify everything works
npm run prisma:status
```

### **When Things Go Wrong**
```bash
# 1. Safe reset
npm run prisma:reset-safe

# 2. Back to work
npm run dev
```

### **GitHub Actions**
You can also run operations manually via GitHub Actions:
1. Go to Actions tab in GitHub
2. Select "Safe Prisma Operations" workflow
3. Choose operation: validate, sync, status, or reset-safe
4. Run operation safely

## 📋 Commands Reference

| Command | What it does | When to use |
|----------|----------------|---------------|
| `validate` | Checks database and schema | Before any changes |
| `sync` | Applies schema changes safely | After schema edits |
| `status` | Shows current state | When troubleshooting |
| `reset-safe` | Safe reset with reseed | When Error 130 occurs |

This workflow ensures that **both Cascade and Claude Code** always work with a consistent, reliable database state!

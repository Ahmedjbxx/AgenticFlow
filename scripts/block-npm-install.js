#!/usr/bin/env node

// AgenticFlow Monorepo - Block npm install script
// This script prevents accidental use of npm instead of pnpm

// Check if we're being called by npm specifically (not pnpm)
if (process.env.npm_execpath && 
    process.env.npm_execpath.includes('npm') && 
    !process.env.npm_execpath.includes('pnpm')) {
  console.error('\n❌ Error: This project uses pnpm for package management.');
  console.error('\n📦 Please use pnpm instead of npm:');
  console.error('   ✅ Install dependencies: pnpm install');
  console.error('   ✅ Add package: pnpm add <package>');
  console.error('   ✅ Add dev dependency: pnpm add -D <package>');
  console.error('\n🔧 To install pnpm globally: npm install -g pnpm@10.2.1');
  console.error('\n📚 Learn more: https://pnpm.io/');
  process.exit(1);
}

// If called by pnpm or other package managers, allow it
console.log('✅ Using pnpm package manager - proceeding with installation...'); 
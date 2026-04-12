#!/usr/bin/env node
/**
 * Pre-deploy checks for Elango Surfers
 * Catches the #1 bug: const/let used before declaration in sequential flow
 * (Not inside functions — those run after all declarations)
 */

const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'src', 'App.vue');
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

let errors = 0;

const scriptStart = lines.findIndex(l => l.includes('<script setup>'));
const scriptEnd = lines.findIndex((l, i) => i > scriptStart && l.includes('</script>'));
const scriptLines = lines.slice(scriptStart + 1, scriptEnd);

// Find all module-level const/let declarations in sequential (non-function) code
const moduleDecls = new Map();

let insideFunction = 0; // track nesting depth of functions

for (let i = 0; i < scriptLines.length; i++) {
  const line = scriptLines[i];
  const trimmed = line.trimStart();
  const indent = line.length - trimmed.length;
  
  // Track function depth
  const funcOpens = (trimmed.match(/(?:function\s*\w*|=>\s*\{|=>\s*[^}]*$|\{$)/g) || []).length;
  const closes = (trimmed.match(/^\}/g) || []).length;
  
  // Simple brace counting for function depth
  const opens = (trimmed.match(/\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}/g) || []).length;
  
  if (indent <= 2 && insideFunction === 0) {
    // Top-level sequential code
    const match = trimmed.match(/^(?:const|let)\s+(\w+)\s*=/);
    if (match) {
      const name = match[1];
      if (name.length > 1 && !['if','for','while','switch','case','else','return','new','true','false','null','this','class','import','export','function'].includes(name)) {
        moduleDecls.set(name, i);
      }
    }
    
    // Also check for references before declaration
    for (const [name, declIdx] of moduleDecls) {
      if (i < declIdx) {
        const refRegex = new RegExp(`\\b${name}\\b`);
        const declRegex = new RegExp(`(?:const|let|var|function)\\s+${name}\\b`);
        
        if (refRegex.test(trimmed) && !declRegex.test(trimmed) && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
          const lineNum = scriptStart + 2 + i;
          const declLineNum = scriptStart + 2 + declIdx;
          console.log(`❌ TDZ BUG: '${name}' used at line ${lineNum} but declared at line ${declLineNum}`);
          errors++;
        }
      }
    }
  }
  
  // Rough function depth tracking
  if (trimmed.match(/^(?:const|let|var|function)\s+\w+\s*=\s*(?:async\s+)?(?:function|\(|[^=]*=>)/)) {
    insideFunction++;
  }
  if (trimmed === '}' && insideFunction > 0) {
    insideFunction--;
  }
}

// Check: all texture files exist
const assetDir = path.join(__dirname, '..', 'public', 'assets');
scriptLines.forEach((line, idx) => {
  const match = line.match(/textureLoader\.load\(['"]assets\/([^'"]+)['"]\)/);
  if (match) {
    if (!fs.existsSync(path.join(assetDir, match[1]))) {
      console.log(`❌ MISSING TEXTURE: 'public/assets/${match[1]}' not found`);
      errors++;
    }
  }
});

// Deduplicate errors
console.log(`\n${'='.repeat(50)}`);
if (errors === 0) {
  console.log('✅ All pre-deploy checks passed!');
} else {
  console.log(`❌ Found ${errors} error(s) — DO NOT DEPLOY`);
}
console.log(`${'='.repeat(50)}\n`);

process.exit(errors > 0 ? 1 : 0);
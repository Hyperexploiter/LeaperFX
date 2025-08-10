#!/usr/bin/env node

/**
 * Production Verification Script
 * Verifies that the application is production-ready for client delivery
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Production Verification Check\n');

// Check for mock files
const checkForMockFiles = () => {
  console.log('✅ Checking for mock files...');
  const servicesDir = path.join(__dirname, 'src', 'services');
  const files = fs.readdirSync(servicesDir);
  const mockFiles = files.filter(file => file.toLowerCase().includes('mock'));
  
  if (mockFiles.length > 0) {
    console.log(`❌ Found ${mockFiles.length} mock files:`);
    mockFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  } else {
    console.log('   ✅ No mock files found');
    return true;
  }
};

// Check for console.log statements
const checkForConsoleStatements = () => {
  console.log('✅ Checking for development console statements...');
  const srcDir = path.join(__dirname, 'src');
  let consoleCount = 0;
  
  const scanDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const consoleMatches = content.match(/console\.(log|warn|debug|info)\(/g);
        if (consoleMatches) {
          consoleCount += consoleMatches.length;
        }
      }
    });
  };
  
  scanDirectory(srcDir);
  
  if (consoleCount > 5) { // Allow some console.error statements
    console.log(`   ⚠️  Found ${consoleCount} console statements (review recommended)`);
    return false;
  } else {
    console.log(`   ✅ Found ${consoleCount} console statements (acceptable)`);
    return true;
  }
};

// Check for build success
const checkBuildSuccess = () => {
  console.log('✅ Checking build artifacts...');
  const distDir = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.log('   ❌ No build artifacts found. Run npm run build first');
    return false;
  }
  
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.log('   ❌ No index.html found in build');
    return false;
  }
  
  console.log('   ✅ Build artifacts found');
  return true;
};

// Check for production services
const checkProductionServices = () => {
  console.log('✅ Checking production services...');
  const servicesDir = path.join(__dirname, 'src', 'services');
  const requiredServices = [
    'analyticsService.ts',
    'transactionService.ts',
    'webSocketService.ts',
    'inventoryService.ts',
    'databaseService.ts'
  ];
  
  const missingServices = requiredServices.filter(service => 
    !fs.existsSync(path.join(servicesDir, service))
  );
  
  if (missingServices.length > 0) {
    console.log(`   ❌ Missing production services:`);
    missingServices.forEach(service => console.log(`   - ${service}`));
    return false;
  } else {
    console.log('   ✅ All production services present');
    return true;
  }
};

// Run all checks
const runVerification = () => {
  const checks = [
    checkForMockFiles,
    checkForConsoleStatements, 
    checkBuildSuccess,
    checkProductionServices
  ];
  
  const results = checks.map(check => check());
  const allPassed = results.every(result => result);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 PRODUCTION READY - All checks passed!');
    console.log('✅ Application is ready for client delivery');
  } else {
    console.log('❌ PRODUCTION ISSUES FOUND');
    console.log('⚠️  Please address the issues above before delivery');
  }
  console.log('='.repeat(50));
  
  return allPassed;
};

runVerification();
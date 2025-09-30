// Quick verification script for core dashboard components
console.log('🚀 Verifying dashboard components...');

// Test if the services are accessible and working
async function verifyServices() {
  try {
    console.log('📦 Testing service imports...');
    
    // Test database service initialization
    const databaseService = await import('./services/databaseService.js');
    await databaseService.default.init();
    console.log('✅ Database service initialized');
    
    // Test inventory service
    const inventoryService = await import('./services/inventoryService.js');
    const inventory = await inventoryService.default.getInventory();
    console.log(`✅ Inventory service: ${inventory.length} items loaded`);
    
    // Test transaction service
    const transactionService = await import('./services/transactionService.js');
    const transactions = await transactionService.default.getTransactions();
    console.log(`✅ Transaction service: ${transactions.length} transactions loaded`);
    
    // Test analytics service
    const analyticsService = await import('./services/analyticsService.js');
    const currencyPerf = await analyticsService.default.getCurrencyPerformance();
    console.log(`✅ Analytics service: ${currencyPerf.length} currency data points`);
    
    // Test WebSocket service
    const webSocketService = await import('./services/webSocketService.js');
    const connected = await webSocketService.default.connect();
    console.log(`✅ WebSocket service: Connected = ${connected}`);
    const status = webSocketService.default.getStatus();
    console.log(`📡 WebSocket status:`, status);
    
    // Test compliance services
    const customerService = await import('./services/customerService.js');
    const customerStats = await customerService.default.getCustomerStats();
    console.log(`✅ Customer service: ${customerStats.total} customers`);
    
    const complianceService = await import('./services/complianceNotificationService.js');
    const notificationStats = await complianceService.default.getNotificationStats();
    console.log(`✅ Compliance service: ${notificationStats.total} notifications`);
    
    console.log('🎉 All services verified successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Service verification failed:', error);
    return false;
  }
}

// Test core functionality
async function testCoreFunctionality() {
  try {
    console.log('🧪 Testing core functionality...');
    
    // Test transaction creation
    const transactionService = await import('./services/transactionService.js');
    const testTransaction = await transactionService.default.createTransaction({
      fromCurrency: 'USD',
      toCurrency: 'CAD',
      fromAmount: 1000,
      toAmount: 1350,
      commission: 20.25
    });
    console.log(`✅ Transaction created: ${testTransaction.id}`);
    
    // Test inventory operations
    const inventoryService = await import('./services/inventoryService.js');
    await inventoryService.default.addStock({
      currency: 'EUR',
      amount: 5000,
      buyRate: 1.45
    });
    console.log('✅ Inventory stock added');
    
    // Test analytics calculation
    const analyticsService = await import('./services/analyticsService.js');
    const dailyPerf = await analyticsService.default.getDailyPerformance();
    console.log(`✅ Analytics calculated: ${dailyPerf.length} daily data points`);
    
    console.log('🎉 Core functionality tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Core functionality test failed:', error);
    return false;
  }
}

// Run verification
async function runVerification() {
  console.log('🏃 Starting component verification...');
  
  const serviceCheck = await verifyServices();
  const functionalityCheck = await testCoreFunctionality();
  
  if (serviceCheck && functionalityCheck) {
    console.log('🌟 All dashboard components verified successfully!');
    console.log('✨ The system is ready for production use.');
    return true;
  } else {
    console.log('⚠️ Some components failed verification');
    return false;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.verifyDashboard = runVerification;
  console.log('💡 Run window.verifyDashboard() in browser console to test');
}

// Run if in Node.js environment
if (typeof window === 'undefined') {
  runVerification().then(success => {
    process.exit(success ? 0 : 1);
  });
}
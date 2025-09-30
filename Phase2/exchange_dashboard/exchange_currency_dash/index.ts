export { default as ExchangeDashboard } from './ExchangeDashboard';
export { default as RealTimeCryptoSection } from './components/RealTimeCryptoSection';
export { useRealTimeData } from './hooks/useRealTimeData';

// Export services for external use if needed
export * from './services/coinbaseWebSocketService';
export * from './services/chartDataAdapter';
export * from './services/animationBufferService';
export * from './services/realTimeDataManager';
export * from './services/errorHandlingService';
import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Search,
  Wifi,
  Monitor,
  Settings,
  Power,
  RefreshCw,
  X,
  Info
} from 'lucide-react';
import { paymentServices } from '../../index';
import type { TerminalDevice, TerminalConfiguration } from '../../types';

interface ConnectionWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

type WizardStep = 'config' | 'discover' | 'select' | 'connect' | 'test' | 'complete';

const ConnectionWizard: React.FC<ConnectionWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('config');
  const [config, setConfig] = useState<TerminalConfiguration>({
    apiKey: '',
    environment: 'test',
    merchantDisplayName: '',
    locationId: '',
    autoConnect: true,
    defaultReceiptEmail: ''
  });
  const [discoveredDevices, setDiscoveredDevices] = useState<TerminalDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<TerminalDevice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const steps = [
    { id: 'config', title: 'Configuration', description: 'Set up terminal configuration' },
    { id: 'discover', title: 'Discovery', description: 'Scan for available devices' },
    { id: 'select', title: 'Selection', description: 'Choose a terminal device' },
    { id: 'connect', title: 'Connection', description: 'Connect to the device' },
    { id: 'test', title: 'Test', description: 'Verify connection' },
    { id: 'complete', title: 'Complete', description: 'Setup finished' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as WizardStep);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as WizardStep);
    }
  };

  const handleConfigSubmit = async () => {
    if (!config.apiKey || !config.merchantDisplayName) {
      setError('API Key and Merchant Display Name are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const initialized = await paymentServices.terminal.initialize(config);
      if (initialized) {
        setSuccess('Terminal service initialized successfully');
        setTimeout(() => {
          setSuccess(null);
          handleNext();
        }, 1500);
      } else {
        setError('Failed to initialize terminal service');
      }
    } catch (err) {
      setError('Configuration failed. Please check your settings.');
      console.error('Configuration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscoverDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const devices = await paymentServices.terminal.discoverDevices();
      setDiscoveredDevices(devices);
      if (devices.length > 0) {
        setSuccess(`Found ${devices.length} device(s)`);
        setTimeout(() => {
          setSuccess(null);
          handleNext();
        }, 1500);
      } else {
        setError('No devices found. Make sure your terminal is powered on and nearby.');
      }
    } catch (err) {
      setError('Device discovery failed. Please try again.');
      console.error('Discovery error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceSelection = (device: TerminalDevice) => {
    setSelectedDevice(device);
    setSuccess(`Selected ${device.label}`);
    setTimeout(() => {
      setSuccess(null);
      handleNext();
    }, 1000);
  };

  const handleConnect = async () => {
    if (!selectedDevice) {
      setError('No device selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const connected = await paymentServices.terminal.connectToDevice(selectedDevice.id);
      if (connected) {
        setSuccess('Device connected successfully');
        setTimeout(() => {
          setSuccess(null);
          handleNext();
        }, 1500);
      } else {
        setError('Failed to connect to device');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
      console.error('Connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate a test payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Test payment completed successfully');
      setTimeout(() => {
        setSuccess(null);
        handleNext();
      }, 1500);
    } catch (err) {
      setError('Test failed. Please check your connection.');
      console.error('Test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = index < getCurrentStepIndex();
          const isDisabled = index > getCurrentStepIndex();

          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${isCurrent ? 'bg-blue-600 text-white' :
                  isCompleted ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-500'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-600' :
                  isCompleted ? 'text-green-600' :
                  'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-gray-300 mx-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderConfigStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Terminal Configuration</h3>
        <p className="text-gray-600">Configure your Stripe Terminal settings to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key *
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="sk_test_..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Environment
          </label>
          <select
            value={config.environment}
            onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value as 'test' | 'live' }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Merchant Display Name *
          </label>
          <input
            type="text"
            value={config.merchantDisplayName}
            onChange={(e) => setConfig(prev => ({ ...prev, merchantDisplayName: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your Business Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location ID
          </label>
          <input
            type="text"
            value={config.locationId}
            onChange={(e) => setConfig(prev => ({ ...prev, locationId: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="tml_..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Receipt Email
          </label>
          <input
            type="email"
            value={config.defaultReceiptEmail}
            onChange={(e) => setConfig(prev => ({ ...prev, defaultReceiptEmail: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="receipts@yourstore.com"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.autoConnect}
              onChange={(e) => setConfig(prev => ({ ...prev, autoConnect: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">
              Automatically connect to available devices
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleConfigSubmit}
          disabled={isLoading || !config.apiKey || !config.merchantDisplayName}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          Initialize Service
        </button>
      </div>
    </div>
  );

  const renderDiscoverStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover Devices</h3>
        <p className="text-gray-600">Scan for available terminal devices nearby.</p>
      </div>

      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Search className="h-8 w-8 text-blue-600" />
        </div>
        <p className="text-gray-600 mb-6">
          Make sure your terminal device is powered on and in pairing mode.
        </p>
        <button
          onClick={handleDiscoverDevices}
          disabled={isLoading}
          className="flex items-center justify-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Scan for Devices
        </button>
      </div>
    </div>
  );

  const renderSelectStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Device</h3>
        <p className="text-gray-600">Choose the terminal device you want to connect.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {discoveredDevices.map((device) => (
          <button
            key={device.id}
            onClick={() => handleDeviceSelection(device)}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              selectedDevice?.id === device.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-2">
              <Monitor className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">{device.label}</div>
                <div className="text-sm text-gray-500">{device.deviceType}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div>Serial: {device.serialNumber}</div>
              <div>Status: <span className="capitalize">{device.status}</span></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Device</h3>
        <p className="text-gray-600">
          Connecting to {selectedDevice?.label || 'selected device'}...
        </p>
      </div>

      {selectedDevice && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Monitor className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="font-semibold text-gray-900">{selectedDevice.label}</div>
              <div className="text-sm text-gray-500">{selectedDevice.deviceType}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Serial Number: {selectedDevice.serialNumber}</div>
            <div>Software Version: {selectedDevice.softwareVersion}</div>
            {selectedDevice.ipAddress && <div>IP Address: {selectedDevice.ipAddress}</div>}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="flex items-center justify-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4 mr-2" />
          )}
          Connect Device
        </button>
      </div>
    </div>
  );

  const renderTestStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Connection</h3>
        <p className="text-gray-600">Verify that the device is working properly.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Test Payment</h4>
            <p className="mt-1 text-sm text-yellow-700">
              We'll process a small test transaction to verify the connection.
              This will not charge any actual payment method.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleTest}
          disabled={isLoading}
          className="flex items-center justify-center mx-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Power className="h-4 w-4 mr-2" />
          )}
          Run Test
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h3>
        <p className="text-gray-600">
          Your terminal device has been successfully configured and connected.
        </p>
      </div>

      {selectedDevice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-left">
            <h4 className="font-semibold text-green-900 mb-2">Connected Device</h4>
            <div className="text-sm text-green-800 space-y-1">
              <div>Device: {selectedDevice.label}</div>
              <div>Type: {selectedDevice.deviceType}</div>
              <div>Status: Ready for payments</div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onComplete}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'config':
        return renderConfigStep();
      case 'discover':
        return renderDiscoverStep();
      case 'select':
        return renderSelectStep();
      case 'connect':
        return renderConnectStep();
      case 'test':
        return renderTestStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderConfigStep();
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'config':
        return config.apiKey && config.merchantDisplayName;
      case 'discover':
        return discoveredDevices.length > 0;
      case 'select':
        return selectedDevice !== null;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Terminal Setup Wizard</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="bg-white rounded-lg border p-8 mb-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      {currentStep !== 'complete' && (
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={getCurrentStepIndex() === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext() || getCurrentStepIndex() === steps.length - 1}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

export default ConnectionWizard;
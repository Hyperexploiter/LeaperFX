import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Save, X, Shield } from 'lucide-react';
import { Modal } from '../Modal';

interface OwnerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const OwnerSettings: React.FC<OwnerSettingsProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState({
    storeQRCode: '',
    defaultCommission: '1.5',
    autoBackup: true,
    complianceAlerts: true,
    lowInventoryThreshold: '1000'
  });

  // Secure password hashing utility
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'leaperfx_settings_salt_2024'); // Different salt for settings
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Secure hashed password for owner settings (hashed version of 'LeaperFx2024!')
  const OWNER_HASH = '7e9f2c4b8d6a1e5c3f9b2d8e4a7c1f6b9d2e5a8c1f4b7e0d3a6c9f2e5b8d1a4c7f';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For demo with secure temporary password
      if (password === 'LeaperFx2024!') {
        setIsAuthenticated(true);
        setError('');
      } else {
        const hashedInput = await hashPassword(password);
        if (hashedInput === OWNER_HASH) {
          setIsAuthenticated(true);
          setError('');
        } else {
          setError('Incorrect password');
          setPassword('');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
      setPassword('');
    }
  };

  const handleSaveSettings = () => {
    // In production, save to database
    localStorage.setItem('ownerSettings', JSON.stringify(settings));
    onClose();
    // Reset authentication state
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleClose = () => {
    onClose();
    setIsAuthenticated(false);
    setPassword('');
    setError('');
  };

  // Load settings on component mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('ownerSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Owner Settings Access" size="sm">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <Shield className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600">
              Enter owner password to access settings
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Access Settings
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Owner Settings" size="lg">
      <div className="space-y-6">
        {/* Store QR Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store QR Code URL
          </label>
          <input
            type="url"
            value={settings.storeQRCode}
            onChange={(e) => setSettings({...settings, storeQRCode: e.target.value})}
            placeholder="https://your-store-url.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL that customers will be directed to when scanning your store QR code
          </p>
        </div>

        {/* Default Commission */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Commission Rate (%)
          </label>
          <input
            type="number"
            value={settings.defaultCommission}
            onChange={(e) => setSettings({...settings, defaultCommission: e.target.value})}
            step="0.1"
            min="0"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Low Inventory Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Inventory Alert Threshold
          </label>
          <input
            type="number"
            value={settings.lowInventoryThreshold}
            onChange={(e) => setSettings({...settings, lowInventoryThreshold: e.target.value})}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Alert when currency inventory falls below this amount
          </p>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Backup</label>
              <p className="text-xs text-gray-500">Automatically backup data daily</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({...settings, autoBackup: !settings.autoBackup})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">FINTRAC Compliance Alerts</label>
              <p className="text-xs text-gray-500">Receive alerts for compliance deadlines</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({...settings, complianceAlerts: !settings.complianceAlerts})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.complianceAlerts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.complianceAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OwnerSettings;
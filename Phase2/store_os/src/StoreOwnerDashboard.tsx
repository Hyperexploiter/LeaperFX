import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, BarChart2, Package, LogOut, Menu, X, Shield, Globe, Settings, Users, FileText, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import DraggableCalculator from './components/DraggableCalculator';
import WebsiteNotification from './components/WebsiteNotification';
import RateLockModal from './components/RateLockModal';
import RateAlertModal from './components/RateAlertModal';
import OwnerSettings from './components/OwnerSettings';
import websiteService from './services/websiteService';
import PaymentSettings from './features/payments/components/PaymentSettings';

// Tabs (refactored)
import InventoryTab from './tabs/Inventory';
import TransactionsTab from './tabs/Transactions';
import AnalyticsTab from './tabs/Analytics';
import ClientsTab from './tabs/Clients';
import ComplianceTab from './tabs/Compliance';
import WebsiteTab from './tabs/Website';
import FormsTab from './tabs/Forms';

// Import logo assets
import logoBlack from './assets/logo_black.PNG';
import saadatBlack from "./assets/saadat_black.PNG";

// Type definitions
interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active: boolean;
  onClick: () => void;
}

// Sub-components
const NavItem: React.FC<NavItemProps> = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 ease-in-out ${
      active 
        ? 'bg-blue-100 text-blue-700 shadow-md scale-105' 
        : 'text-gray-600 hover:bg-gray-100 hover:scale-102 hover:shadow-sm'
    }`}
  >
    <div className={`mr-3 transition-transform duration-200 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="font-medium">{text}</span>
  </button>
);

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  
  React.useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center text-sm text-gray-500">
      <Clock className="h-4 w-4 mr-2" />
      {time.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
    </div>
  );
};

// Note: SmartCalculator is now handled by the DraggableCalculator component

export default function StoreOwnerDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [complianceAlert, setComplianceAlert] = useState<{visible: boolean, message: string}>({
    visible: false,
    message: ''
  });
  const [showRateLockModal, setShowRateLockModal] = useState<boolean>(false);
  const [showRateAlertModal, setShowRateAlertModal] = useState<boolean>(false);
  const [selectedRateLock, setSelectedRateLock] = useState<any>(null);
  const [selectedRateAlert, setSelectedRateAlert] = useState<any>(null);
  const [showOwnerSettings, setShowOwnerSettings] = useState<boolean>(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Smooth tab transition handler
  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    // Small delay to show transition effect
    setTimeout(() => {
      setActiveTab(newTab);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 150);
  };
  
  // Listen for FINTRAC compliance events from the calculator
  useEffect(() => {
    const handleComplianceRequired = (event: CustomEvent<{ transactionId: string; requiresLCTR: boolean }>) => {
      const { transactionId, requiresLCTR } = event.detail || { transactionId: '', requiresLCTR: false };
      
      // Switch to the compliance tab
      setActiveTab('compliance');
      
      // Show an alert message
      const message = requiresLCTR 
        ? `Transaction ${transactionId} requires LCTR reporting. Please collect customer information.`
        : `Transaction ${transactionId} requires enhanced record keeping. Please collect customer information.`;
      
      setComplianceAlert({
        visible: true,
        message
      });
      
      // Hide the alert after 10 seconds
      setTimeout(() => {
        setComplianceAlert({
          visible: false,
          message: ''
        });
      }, 10000);
    };
    
    // Add event listener
    window.addEventListener('fintracComplianceRequired', handleComplianceRequired as EventListener);
    
    // Check localStorage for pending compliance transactions on component mount
    const pendingTransaction = localStorage.getItem('pendingComplianceTransaction');
    if (pendingTransaction) {
      try {
        const transaction = JSON.parse(pendingTransaction) as { id: string; timestamp: string };
        // Only show alert if transaction is recent (within last 5 minutes)
        const timestamp = new Date(transaction.timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - timestamp.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff < 5) {
          setActiveTab('compliance');
          setComplianceAlert({
            visible: true,
            message: `Transaction ${transaction.id} requires compliance. Please collect customer information.`
          });
          
          // Hide the alert after 10 seconds
          setTimeout(() => {
            setComplianceAlert({
              visible: false,
              message: ''
            });
          }, 10000);
        } else {
          // Clear old transaction
          localStorage.removeItem('pendingComplianceTransaction');
        }
      } catch (error) {
        console.error('Error parsing pending transaction:', error);
        localStorage.removeItem('pendingComplianceTransaction');
      }
    }
    
    // Clean up
    return () => {
      window.removeEventListener('fintracComplianceRequired', handleComplianceRequired as EventListener);
    };
  }, []);
  
  // Handle viewing a rate lock
  const handleViewRateLock = async (id: string) => {
    try {
      const rateLock = await websiteService.getRateLockById(id);
      if (rateLock) {
        setSelectedRateLock(rateLock);
        setShowRateLockModal(true);
      }
    } catch (error) {
      console.error('Error fetching rate lock:', error);
      // Provide user feedback on error
      // In a real app, you might show a toast notification
    }
  };

  // Handle viewing a rate alert
  const handleViewRateAlert = async (id: string) => {
    try {
      const rateAlert = await websiteService.getRateAlertById(id);
      if (rateAlert) {
        setSelectedRateAlert(rateAlert);
        setShowRateAlertModal(true);
      }
    } catch (error) {
      console.error('Error fetching rate alert:', error);
    }
  };

  // Handle completing a rate lock
  const handleCompleteRateLock = async () => {
    if (!selectedRateLock) return;
    
    try {
      await websiteService.completeRateLock(selectedRateLock.id);
      setShowRateLockModal(false);
      // Show success toast
      // In a real implementation, we would refresh the data
    } catch (error) {
      console.error('Error completing rate lock:', error);
      // Show error toast
    }
  };

  // Handle cancelling a rate lock
  const handleCancelRateLock = async () => {
    if (!selectedRateLock) return;
    
    try {
      await websiteService.cancelRateLock(selectedRateLock.id);
      setShowRateLockModal(false);
      // Show success toast
      // In a real implementation, we would refresh the data
    } catch (error) {
      console.error('Error cancelling rate lock:', error);
      // Show error toast
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <InventoryTab />;
      case 'transactions':
        return <TransactionsTab />;
      case 'clients':
        return <ClientsTab />;
      case 'forms':
        return <FormsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'compliance':
        return <ComplianceTab />;
      case 'website':
        return (
          <WebsiteTab
            onViewRateLock={handleViewRateLock}
            onViewRateAlert={handleViewRateAlert}
          />
        );
      case 'payments':
        return <PaymentSettings />;
      default:
        return <InventoryTab />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Draggable Calculator */}
      <DraggableCalculator />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex-shrink-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex justify-center mb-2">
              <img src={logoBlack} alt="Company Logo" className="h-16 w-auto rounded-xl" />
            </div>
            <div className="flex justify-center">
              <img src={saadatBlack} alt="Saadat Name" className="h-10 w-auto" />
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-gray-800">Owner Dashboard</h2>
              <LiveClock />
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem 
              icon={<Package className="h-5 w-5" />} 
              text="Inventory Management" 
              active={activeTab === 'inventory'} 
              onClick={() => handleTabChange('inventory')} 
            />
            <NavItem 
              icon={<DollarSign className="h-5 w-5" />} 
              text="Transaction History" 
              active={activeTab === 'transactions'} 
              onClick={() => handleTabChange('transactions')} 
            />
            <NavItem 
              icon={<Users className="h-5 w-5" />} 
              text="Client Registry" 
              active={activeTab === 'clients'} 
              onClick={() => handleTabChange('clients')} 
            />
            <NavItem 
              icon={<FileText className="h-5 w-5" />} 
              text="Forms Management" 
              active={activeTab === 'forms'} 
              onClick={() => handleTabChange('forms')} 
            />
            <NavItem 
              icon={<BarChart2 className="h-5 w-5" />} 
              text="Analytics" 
              active={activeTab === 'analytics'} 
              onClick={() => handleTabChange('analytics')} 
            />
            <NavItem 
              icon={<Shield className="h-5 w-5" />} 
              text="FINTRAC Compliance" 
              active={activeTab === 'compliance'} 
              onClick={() => handleTabChange('compliance')} 
            />
            <NavItem
              icon={<Globe className="h-5 w-5" />}
              text="Website Activities"
              active={activeTab === 'website'}
              onClick={() => handleTabChange('website')}
            />
            <NavItem
              icon={<CreditCard className="h-5 w-5" />}
              text="Payment Settings"
              active={activeTab === 'payments'}
              onClick={() => handleTabChange('payments')}
            />
          </nav>
          
          <div className="p-4 border-t">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <header className="mb-4 lg:mb-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{
                    activeTab === 'inventory' ? 'Inventory Management' :
                    activeTab === 'transactions' ? 'Transaction History' :
                    activeTab === 'clients' ? 'Client Registry' :
                    activeTab === 'forms' ? 'Forms Management' :
                    activeTab === 'compliance' ? 'FINTRAC Compliance' :
                    activeTab === 'website' ? 'Website Activities' :
                    activeTab === 'payments' ? 'Payment Settings' :
                    'Business Analytics'
                  }</h1>
                  <p className="text-sm lg:text-base text-gray-600 mt-1">
                    {
                      activeTab === 'inventory' ? 'Manage your currency inventory and exchange rates' :
                      activeTab === 'transactions' ? 'View and manage transaction history' :
                      activeTab === 'forms' ? 'Manage customer forms, QR codes, and ID verification for FINTRAC compliance' :
                      activeTab === 'compliance' ? 'Manage FINTRAC compliance requirements' :
                      activeTab === 'website' ? 'Monitor website orders and activities' :
                      activeTab === 'payments' ? 'Configure payment methods and terminal settings' :
                      'View business performance metrics and analytics'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowOwnerSettings(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                    title="Owner Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <WebsiteNotification 
                    onViewRateLock={handleViewRateLock}
                    onViewRateAlert={handleViewRateAlert}
                  />
                </div>
              </div>
            </header>
          
          {/* Compliance Alert */}
          {complianceAlert.visible && (
            <div className="mb-6 p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-md shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">FINTRAC Compliance Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{complianceAlert.message}</p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={() => setComplianceAlert({ visible: false, message: '' })}
                        className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
            
            <main className={`transition-all duration-300 ease-in-out ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}>
              {renderContent()}
            </main>
          </div>
        </div>
      </div>

      {/* Rate Lock Modal */}
      <RateLockModal
        isOpen={showRateLockModal}
        onClose={() => setShowRateLockModal(false)}
        rateLock={selectedRateLock}
        onComplete={handleCompleteRateLock}
        onCancel={handleCancelRateLock}
      />

      {/* Rate Alert Modal */}
      <RateAlertModal
        isOpen={showRateAlertModal}
        onClose={() => setShowRateAlertModal(false)}
        rateAlert={selectedRateAlert}
        onTrigger={(id) => websiteService.triggerRateAlert(id)}
      />

      {/* Owner Settings Modal */}
      <OwnerSettings
        isOpen={showOwnerSettings}
        onClose={() => setShowOwnerSettings(false)}
      />
    </div>
  );
}
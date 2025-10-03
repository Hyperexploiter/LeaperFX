import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { ExchangeDashboard } from '../exchange_dashboard/exchange_currency_dash';
import StoreOwnerDashboard from './Clients/StoreOwnerDashboard';
import StoreOwnerDashboardSimple from './Clients/StoreOwnerDashboardSimple';
import CustomerMobileForm from './common/components/CustomerMobileForm';
import EnhancedCustomerForm from './common/components/EnhancedCustomerForm';
import { AuthProvider, useAuth } from './common/contexts/AuthContext';
import ErrorBoundary from './common/ErrorBoundary';
import databaseService from './common/services/databaseService';
import './index.css';

// Login Component
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/owner';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Owner Dashboard Login</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your credentials to access the store owner dashboard</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
              Return to Public Dashboard
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Main App Component
function App(): React.ReactElement {
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize the database
        await databaseService.init();
        await databaseService.initializeDefaultData();
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Continue without database - components will handle gracefully
        setIsDbInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isDbInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ExchangeDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/owner" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <StoreOwnerDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner-simple" 
            element={
              <ProtectedRoute>
                <StoreOwnerDashboardSimple />
              </ProtectedRoute>
            } 
          />
          <Route path="/customer-form" element={<CustomerMobileForm />} />
          <Route path="/customer-form/:transactionId" element={<CustomerMobileForm />} />
          <Route path="/form/:sessionId" element={<EnhancedCustomerForm />} />
          <Route path="/form-submitted" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md w-full">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">Form Submitted Successfully</h1>
                <p className="text-gray-600">
                  Thank you for submitting your information. The store owner will review your documents and process your registration.
                </p>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
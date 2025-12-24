import { createContext, useContext, useState, useEffect } from 'react';
import { logInfo, logWarn, logError, logAction, logApi } from '../utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    logInfo('AuthContext', 'Checking for existing session');
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        logInfo('AuthContext', 'Session restored from localStorage', { 
          email: userData.email, 
          method: userData.method 
        });
      } catch (error) {
        logError('AuthContext', 'Error parsing stored user data', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    } else {
      logInfo('AuthContext', 'No existing session found');
    }
    setLoading(false);
  }, []);

  const login = async (userData, authToken) => {
    logAction('AuthContext', 'Login initiated', { 
      email: userData.email, 
      method: userData.method 
    });
    
    try {
      // Store user data and token first (non-blocking)
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', authToken);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      logInfo('AuthContext', 'User session stored in localStorage', {
        email: userData.email,
        name: userData.name
      });

      // Call the HTTP endpoint to record user details (non-blocking, fire and forget)
      let apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
      
      // In development mode, use the Vite proxy to avoid CORS issues
      // The proxy forwards /api/* to http://localhost:5255/*
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        // Convert http://localhost:5255/login to /api/login
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }
      
      // Log the endpoint value for debugging (always log, not just in dev mode)
      console.log('[AuthContext] VITE_API_ENDPOINT value:', import.meta.env.VITE_API_ENDPOINT);
      console.log('[AuthContext] Using endpoint:', apiEndpoint);
      console.log('[AuthContext] Development mode:', import.meta.env.DEV);
      
      if (apiEndpoint) {
        const requestData = {
          name: userData.name,
          email: userData.email,
          method: userData.method || 'oauth',
          authToken: authToken,
        };
        
        logApi('AuthContext', 'POST', apiEndpoint, requestData);
        console.log('[AuthContext] Sending POST request to:', apiEndpoint);
        console.log('[AuthContext] Request data:', requestData);
        
        // Don't await - let it run in the background
        fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })
          .then(async (response) => {
            console.log('[AuthContext] Response received:', response.status, response.statusText);
            if (!response.ok) {
              const errorText = await response.text();
              logWarn('AuthContext', `API endpoint returned non-OK status: ${response.status}`, {
                status: response.status,
                statusText: response.statusText,
                error: errorText
              });
              console.error('[AuthContext] API error:', response.status, errorText);
            } else {
              const responseData = await response.json().catch(() => ({}));
              logApi('AuthContext', 'POST', apiEndpoint, null, responseData);
              logInfo('AuthContext', 'User login successfully recorded in database');
              console.log('[AuthContext] API success:', responseData);
            }
          })
          .catch((error) => {
            // Log but don't throw - login should still succeed
            logWarn('AuthContext', 'Failed to record user login to API endpoint', {
              error: error.message,
              note: 'This is expected if the API service is not yet running.'
            });
            console.error('[AuthContext] Fetch error:', error);
            console.error('[AuthContext] Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
          });
      } else {
        logWarn('AuthContext', 'VITE_API_ENDPOINT not configured. User login not recorded to database.');
        console.warn('[AuthContext] VITE_API_ENDPOINT is undefined or empty');
      }
      
      logInfo('AuthContext', 'Login completed successfully', {
        email: userData.email
      });
    } catch (error) {
      logError('AuthContext', 'Login error', error);
      throw error;
    }
  };

  const logout = () => {
    logAction('AuthContext', 'Logout initiated', {
      email: user?.email || 'unknown'
    });
    
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    
    logInfo('AuthContext', 'User logged out successfully');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


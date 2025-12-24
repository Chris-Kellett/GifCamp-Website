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
      const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
      if (apiEndpoint) {
        const requestData = {
          name: userData.name,
          email: userData.email,
          method: userData.method || 'oauth',
          authToken: authToken,
        };
        
        logApi('AuthContext', 'POST', apiEndpoint, requestData);
        
        // Don't await - let it run in the background
        fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              logWarn('AuthContext', `API endpoint returned non-OK status: ${response.status}`, {
                status: response.status,
                statusText: response.statusText,
                error: errorText
              });
            } else {
              const responseData = await response.json().catch(() => ({}));
              logApi('AuthContext', 'POST', apiEndpoint, null, responseData);
              logInfo('AuthContext', 'User login successfully recorded in database');
            }
          })
          .catch((error) => {
            // Log but don't throw - login should still succeed
            logWarn('AuthContext', 'Failed to record user login to API endpoint', {
              error: error.message,
              note: 'This is expected if the API service is not yet running.'
            });
          });
      } else {
        logWarn('AuthContext', 'VITE_API_ENDPOINT not configured. User login not recorded to database.');
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


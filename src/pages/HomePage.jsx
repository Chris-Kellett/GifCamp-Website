import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logInfo, logAction } from '../utils/logger';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    logInfo('HomePage', 'Home page loaded', {
      isAuthenticated,
      userEmail: user?.email || null
    });
  }, [isAuthenticated, user]);

  return (
    <div className="home-page">
      <div className="home-content">
        <h1>Welcome to GifCamp</h1>
        {isAuthenticated && user ? (
          <div className="user-info">
            <p>Hello, <strong>{user.name}</strong>!</p>
            <p>You are logged in via {user.method || 'OAuth'}.</p>
            {user.picture && (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="user-avatar"
              />
            )}
          </div>
        ) : (
          <p>Please log in to continue.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;


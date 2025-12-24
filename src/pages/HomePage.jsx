import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logInfo, logAction } from '../utils/logger';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const placeholderImage = '/assets/placeholder-avatar.png';

  useEffect(() => {
    logInfo('HomePage', 'Home page loaded', {
      isAuthenticated,
      userEmail: user?.email || null
    });
  }, [isAuthenticated, user]);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.picture]);

  const getAvatarSrc = () => {
    if (!user?.picture || imageError) {
      return placeholderImage;
    }
    return user.picture;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <h1>Welcome to GifCamp</h1>
        {isAuthenticated && user ? (
          <div className="user-info">
            <p>Hello, <strong>{user.name}</strong>!</p>
            <p>You are logged in via {user.method || 'OAuth'}.</p>
            <img 
              src={getAvatarSrc()} 
              alt={user.name} 
              className="user-avatar"
              onError={handleImageError}
            />
          </div>
        ) : (
          <p>Please log in to continue.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;


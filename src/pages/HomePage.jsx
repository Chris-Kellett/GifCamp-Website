import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logInfo, logAction } from '../utils/logger';
import Sidebar from '../components/Sidebar/Sidebar';
import ImagesPage from './ImagesPage';
import WelcomePage from './WelcomePage';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);

  useEffect(() => {
    logInfo('HomePage', 'Home page loaded', {
      isAuthenticated,
      userEmail: user?.email || null
    });
  }, [isAuthenticated, user]);

  const handleCategorySelect = (categoryId, categoryName) => {
    logAction('HomePage', 'Category selected', { categoryId, categoryName });
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName || null);
  };

  // Show welcome page if not authenticated
  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  // Show home page with sidebar if authenticated
  return (
    <div className="home-page">
      <div className="home-page-container">
        <Sidebar
          onCategorySelect={handleCategorySelect}
          selectedCategoryId={selectedCategoryId}
          selectedCategoryName={selectedCategoryName}
        />
        <div className="home-page-main">
          <ImagesPage categoryId={selectedCategoryId} categoryName={selectedCategoryName} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;


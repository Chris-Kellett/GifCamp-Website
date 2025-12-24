import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MenuBar from './MenuBar';
import Footer from './Footer';
import { logInfo } from '../../utils/logger';
import './Layout.css';

const Layout = ({ children }) => {
  const { loading } = useAuth();

  useEffect(() => {
    logInfo('Layout', 'Layout component mounted', { loading });
  }, [loading]);

  if (loading) {
    return (
      <div className="layout-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="layout">
      <MenuBar />
      <main className="layout-main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;


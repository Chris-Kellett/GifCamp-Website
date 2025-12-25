import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logInfo, logError, logAction } from '../../utils/logger';
import CreateCategoryModal from '../CreateCategoryModal/CreateCategoryModal';
import DeleteCategoryModal from '../DeleteCategoryModal/DeleteCategoryModal';
import './Sidebar.css';

const Sidebar = ({ onCategorySelect, selectedCategoryId, selectedCategoryName }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState(null);

  const fetchCategories = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get userId as a number
      const userId = user.id;
      if (!userId) {
        logError('Sidebar', 'User ID not found');
        setLoading(false);
        return;
      }

      logAction('Sidebar', 'Fetching categories', { userId });

      // Get the API endpoint from environment variable
      let apiEndpoint = import.meta.env.VITE_CATEGORIES_ALL_API_ENDPOINT;
      
      if (!apiEndpoint) {
        logError('Sidebar', 'Categories API endpoint not configured');
        setLoading(false);
        return;
      }

      // In development mode, use the Vite proxy
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Read response once
      const responseText = await response.text();
      let responseData = {};
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: !response.ok, description: responseText, categories: [] };
        }
      }

      // Check for errors: HTTP error status OR error field in response
      if (!response.ok) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        logError('Sidebar', 'Failed to fetch categories', { error: errorDescription });
        alert(`Failed to fetch categories: ${errorDescription}`);
        setCategories([]);
        setLoading(false);
        return;
      }

      // Check if response indicates an error
      if (responseData.error === true) {
        const errorDescription = responseData.description || 'An error occurred while fetching categories';
        logError('Sidebar', 'API returned error', { 
          error: true, 
          description: errorDescription
        });
        alert(`Error fetching categories: ${errorDescription}`);
        setCategories([]);
        setLoading(false);
        return;
      }

      // Extract categories from response
      const categories = Array.isArray(responseData.categories) ? responseData.categories : [];
      logInfo('Sidebar', 'Categories fetched successfully', { count: categories.length });
      setCategories(categories);
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch categories';
      logError('Sidebar', 'Error fetching categories', error);
      alert(`Error fetching categories: ${errorMessage}`);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const handleCreateCategory = () => {
    logAction('Sidebar', 'Create category button clicked');
    setIsCreateModalOpen(true);
  };

  const handleCategoryCreated = () => {
    logAction('Sidebar', 'Category created, refreshing list');
    fetchCategories();
  };

  const handleAllClick = () => {
    logAction('Sidebar', 'All button clicked');
    if (onCategorySelect) {
      onCategorySelect(null, null);
    }
  };

  const handleCategoryClick = (category, e) => {
    // Don't trigger category selection if clicking the trash icon
    if (e && e.target.closest('.category-delete-button')) {
      return;
    }
    logAction('Sidebar', 'Category clicked', { id: category.id, name: category.name });
    if (onCategorySelect) {
      onCategorySelect(category.id, category.name);
    }
  };

  const handleDeleteClick = (category, e) => {
    e.stopPropagation();
    logAction('Sidebar', 'Delete category button clicked', { id: category.id, name: category.name });
    setDeleteCategory(category);
  };

  const handleCategoryDeleted = () => {
    logAction('Sidebar', 'Category deleted, refreshing list');
    fetchCategories();
    setDeleteCategory(null);
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <button
            className="sidebar-button"
            onClick={handleAllClick}
            data-selected={selectedCategoryId === null}
          >
            All
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h3 className="sidebar-section-title">Categories</h3>
            <button
              className="sidebar-add-button"
              onClick={handleCreateCategory}
              title="Create Category"
            >
              +
            </button>
          </div>
          {loading ? (
            <div className="sidebar-loading">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="sidebar-empty">
              No Categories, click + to add one.
            </div>
          ) : (
            <div className="sidebar-categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="sidebar-button sidebar-category-button"
                  onClick={(e) => handleCategoryClick(category, e)}
                  data-selected={selectedCategoryId === category.id}
                >
                  <span className="category-name">{category.name}</span>
                  <button
                    className="category-delete-button"
                    onClick={(e) => handleDeleteClick(category, e)}
                    title="Delete category"
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateCategoryModal
          onClose={() => setIsCreateModalOpen(false)}
          onCategoryCreated={handleCategoryCreated}
        />
      )}

      {deleteCategory && (
        <DeleteCategoryModal
          onClose={() => setDeleteCategory(null)}
          category={deleteCategory}
          onCategoryDeleted={handleCategoryDeleted}
        />
      )}
    </>
  );
};

export default Sidebar;


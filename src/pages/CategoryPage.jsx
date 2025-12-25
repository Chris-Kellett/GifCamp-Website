import { useEffect } from 'react';
import { logInfo } from '../utils/logger';
import './CategoryPage.css';

const CategoryPage = ({ categoryId, categoryName }) => {
  useEffect(() => {
    logInfo('CategoryPage', 'Category page loaded', { categoryId, categoryName });
  }, [categoryId, categoryName]);

  return (
    <div className="category-page">
      <div className="category-content">
        <h1>Category</h1>
        {categoryName ? (
          <>
            <p><strong>Name:</strong> {categoryName}</p>
            <p><strong>ID:</strong> {categoryId}</p>
          </>
        ) : (
          <p>Category not found</p>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;


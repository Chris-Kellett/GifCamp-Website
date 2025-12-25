import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logInfo, logError, logAction } from '../utils/logger';
import './ImagesPage.css';

const ImagesPage = ({ categoryId }) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const getCategoryIdForRequest = () => {
    if (categoryId === 'uncategorised') {
      return 0;
    } else if (!categoryId || categoryId === null) {
      return -1; // All page
    } else {
      return typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
    }
  };

  const fetchImages = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Get userId as a number
      const userId = user.id;
      if (!userId) {
        logError('ImagesPage', 'User ID not found');
        setLoading(false);
        return;
      }

      logAction('ImagesPage', 'Fetching images', { categoryId, userId });

      // Get the API endpoint from environment variable
      let apiEndpoint = import.meta.env.VITE_IMAGES_GET_API_ENDPOINT;
      
      if (!apiEndpoint) {
        logError('ImagesPage', 'Images get API endpoint not configured');
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
        categoryId: getCategoryIdForRequest(),
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
          responseData = { error: !response.ok, description: responseText, images: [] };
        }
      }

      // Check for errors: HTTP error status OR error field in response
      if (!response.ok) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorDescription);
        logError('ImagesPage', 'Failed to fetch images', { error: errorDescription });
        setImages([]);
        setLoading(false);
        return;
      }

      // Check if response indicates an error
      if (responseData.error === true) {
        const errorDescription = responseData.description || 'An error occurred while fetching images';
        setError(errorDescription);
        logError('ImagesPage', 'API returned error', { 
          error: true, 
          description: errorDescription
        });
        setImages([]);
        setLoading(false);
        return;
      }

      // Extract images from response
      const imageList = Array.isArray(responseData.images) ? responseData.images : [];
      logInfo('ImagesPage', 'Images fetched successfully', { count: imageList.length });
      setImages(imageList);
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch images';
      setError(errorMessage);
      logError('ImagesPage', 'Error fetching images', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user, categoryId]);

  const handleAddFromUrl = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    if (!user) return;

    setIsAdding(true);
    setError(null);

    try {
      logAction('ImagesPage', 'Adding image from URL', { url: imageUrl, categoryId });

      // Get userId as a number
      const userId = user.id;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Get the API endpoint from environment variable
      let apiEndpoint = import.meta.env.VITE_IMAGES_ADD_LINK_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Images add link API endpoint not configured');
      }
      
      // In development mode, use the Vite proxy
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        categoryId: getCategoryIdForRequest(),
        imageUrl: imageUrl.trim(),
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
          responseData = { error: !response.ok, description: responseText };
        }
      }

      // Check for errors
      if (!response.ok || responseData.error === true) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorDescription);
        logError('ImagesPage', 'Failed to add image from URL', { error: errorDescription });
        return;
      }

      logInfo('ImagesPage', 'Image added successfully from URL', responseData);
      
      // Clear input and refresh images
      setImageUrl('');
      fetchImages();
    } catch (error) {
      const errorMessage = error.message || 'Failed to add image';
      setError(errorMessage);
      logError('ImagesPage', 'Error adding image from URL', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddFromBlob = async (file) => {
    if (!user) return;

    setIsAdding(true);
    setError(null);

    try {
      logAction('ImagesPage', 'Adding image from blob', { fileName: file.name, categoryId });

      // Get userId as a number
      const userId = user.id;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Get the API endpoint from environment variable
      let apiEndpoint = import.meta.env.VITE_IMAGES_ADD_BLOB_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Images add blob API endpoint not configured');
      }
      
      // In development mode, use the Vite proxy
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('userId', typeof userId === 'string' ? parseInt(userId, 10) : userId);
      formData.append('categoryId', getCategoryIdForRequest());
      formData.append('image', file);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      // Read response once
      const responseText = await response.text();
      let responseData = {};
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: !response.ok, description: responseText };
        }
      }

      // Check for errors
      if (!response.ok || responseData.error === true) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorDescription);
        logError('ImagesPage', 'Failed to add image from blob', { error: errorDescription });
        return;
      }

      logInfo('ImagesPage', 'Image added successfully from blob', responseData);
      
      // Refresh images
      fetchImages();
    } catch (error) {
      const errorMessage = error.message || 'Failed to add image';
      setError(errorMessage);
      logError('ImagesPage', 'Error adding image from blob', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleAddFromBlob(imageFile);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleAddFromBlob(file);
    } else {
      setError('Please select an image file');
    }
  };

  return (
    <div className="images-page">
      <div className="images-page-container">
        {/* Top section: Add images */}
        <div className="images-add-section">
          <div className="images-add-controls">
            <input
              type="text"
              className="images-url-input"
              placeholder="Paste an Image URL here..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddFromUrl();
                }
              }}
              disabled={isAdding}
            />
            <button
              className="images-add-button"
              onClick={handleAddFromUrl}
              disabled={isAdding || !imageUrl.trim()}
            >
              Add
            </button>
          </div>
          <div
            ref={dropZoneRef}
            className={`images-drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            Or Drag an Image here.
          </div>
        </div>

        {error && (
          <div className="images-error">
            {error}
          </div>
        )}

        {/* Main section: Image grid */}
        <div className="images-grid-section">
          {loading ? (
            <div className="images-loading">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="images-empty">
              No images yet, add one above.
            </div>
          ) : (
            <div className="images-grid">
              {images.map((image, index) => (
                <div key={index} className="images-grid-item">
                  <img 
                    src={image.url || image} 
                    alt={`Image ${index + 1}`}
                    className="images-grid-image"
                    onError={(e) => {
                      console.error('Failed to load image:', image.url || image);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagesPage;


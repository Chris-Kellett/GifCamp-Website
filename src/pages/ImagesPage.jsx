import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logInfo, logError, logAction } from '../utils/logger';
import ImageLightbox from '../components/ImageLightbox/ImageLightbox';
import './ImagesPage.css';

const ImagesPage = ({ categoryId, categoryName }) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedImageId, setCopiedImageId] = useState(null);
  const [deleteConfirmImageId, setDeleteConfirmImageId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const deleteConfirmTimeoutRef = useRef(null);
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

  const handleCopyLink = async (image) => {
    const imageUrlToCopy = image.url || image;
    
    try {
      await navigator.clipboard.writeText(imageUrlToCopy);
      setCopiedImageId(image.id);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCopiedImageId(null);
      }, 3000);
      
      logAction('ImagesPage', 'Image URL copied to clipboard', { imageId: image.id });
    } catch (error) {
      logError('ImagesPage', 'Failed to copy image URL', error);
      setError('Failed to copy URL to clipboard');
    }
  };

  const handleDeleteClick = (image) => {
    if (deleteConfirmImageId === image.id) {
      // Second click - confirm delete
      handleDeleteImage(image);
    } else {
      // First click - show confirm
      setDeleteConfirmImageId(image.id);
      
      // Clear any existing timeout
      if (deleteConfirmTimeoutRef.current) {
        clearTimeout(deleteConfirmTimeoutRef.current);
      }
      
      // Revert after 3 seconds
      deleteConfirmTimeoutRef.current = setTimeout(() => {
        setDeleteConfirmImageId(null);
      }, 3000);
      
      logAction('ImagesPage', 'Delete confirmation shown', { imageId: image.id });
    }
  };

  const handleDeleteImage = async (image) => {
    if (!user) return;

    // Clear the confirm state
    setDeleteConfirmImageId(null);
    if (deleteConfirmTimeoutRef.current) {
      clearTimeout(deleteConfirmTimeoutRef.current);
    }

    try {
      logAction('ImagesPage', 'Deleting image', { imageId: image.id, categoryId });

      // Get userId as a number
      const userId = user.id;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Get the API endpoint from environment variable
      let apiEndpoint = import.meta.env.VITE_IMAGES_DELETE_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Images delete API endpoint not configured');
      }
      
      // In development mode, use the Vite proxy
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        imageId: typeof image.id === 'string' ? parseInt(image.id, 10) : image.id,
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
        logError('ImagesPage', 'Failed to delete image', { error: errorDescription });
        return;
      }

      logInfo('ImagesPage', 'Image deleted successfully', responseData);
      
      // Refresh images
      fetchImages();
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete image';
      setError(errorMessage);
      logError('ImagesPage', 'Error deleting image', error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (deleteConfirmTimeoutRef.current) {
        clearTimeout(deleteConfirmTimeoutRef.current);
      }
    };
  }, []);

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
                <div 
                  key={image.id || index} 
                  className="images-grid-item"
                  onClick={(e) => {
                    // Only open lightbox if clicking outside the overlay bar
                    if (!e.target.closest('.images-grid-overlay')) {
                      setSelectedImage(image);
                    }
                  }}
                >
                  <img 
                    src={image.url || image} 
                    alt={`Image ${index + 1}`}
                    className="images-grid-image"
                    onError={(e) => {
                      console.error('Failed to load image:', image.url || image);
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="images-grid-overlay">
                    <div className="images-grid-overlay-bar">
                      <button
                        className="images-copy-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(image);
                        }}
                      >
                        {copiedImageId === image.id ? 'Copied ✓' : 'Copy Link'}
                      </button>
                      <button
                        className="images-delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(image);
                        }}
                      >
                        {deleteConfirmImageId === image.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDeleteImage}
        />
      )}
    </div>
  );
};

export default ImagesPage;


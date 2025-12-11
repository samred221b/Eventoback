// Utility functions for the Eventopia backend

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Format date to readable string
 * @param {Date} date 
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time to readable string
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time
 */
const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Generate slug from title
 * @param {string} title 
 * @returns {string} URL-friendly slug
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone 
 * @returns {boolean} Is valid phone
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize user input
 * @param {string} input 
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Generate random string
 * @param {number} length 
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Check if date is in the future
 * @param {Date} date 
 * @returns {boolean} Is future date
 */
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Check if date is today
 * @param {Date} date 
 * @returns {boolean} Is today
 */
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

/**
 * Get time difference in human readable format
 * @param {Date} date 
 * @returns {string} Time difference
 */
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

/**
 * Paginate results
 * @param {number} page 
 * @param {number} limit 
 * @returns {object} Pagination info
 */
const getPagination = (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return {
    offset,
    limit: parseInt(limit),
    page: parseInt(page)
  };
};

/**
 * Create pagination response
 * @param {number} total 
 * @param {number} page 
 * @param {number} limit 
 * @returns {object} Pagination response
 */
const createPaginationResponse = (total, page, limit) => {
  return {
    current: parseInt(page),
    pages: Math.ceil(total / limit),
    total,
    hasNext: page * limit < total,
    hasPrev: page > 1
  };
};

/**
 * Validate coordinates
 * @param {number} lat 
 * @param {number} lng 
 * @returns {boolean} Are valid coordinates
 */
const isValidCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Format currency
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'ETB') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Create success response
 * @param {any} data 
 * @param {string} message 
 * @returns {object} Success response
 */
const createSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

/**
 * Create error response
 * @param {string} error 
 * @param {string} message 
 * @param {number} statusCode 
 * @returns {object} Error response
 */
const createErrorResponse = (error, message, statusCode = 500) => {
  return {
    success: false,
    error,
    message,
    statusCode
  };
};

module.exports = {
  calculateDistance,
  toRadians,
  formatDate,
  formatTime,
  generateSlug,
  isValidEmail,
  isValidPhone,
  sanitizeInput,
  generateRandomString,
  isFutureDate,
  isToday,
  getTimeAgo,
  getPagination,
  createPaginationResponse,
  isValidCoordinates,
  formatCurrency,
  createSuccessResponse,
  createErrorResponse
};

const { verifyFirebaseToken } = require('../config/firebase');

// Middleware to verify Firebase ID token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No authorization header provided'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Development mode bypass for testing
    if (process.env.NODE_ENV === 'development' && token === 'dev-bypass-token') {
      console.log('🚧 Using development bypass token');
      req.user = {
        uid: 'dev-user-123',
        email: 'dev@example.com',
        emailVerified: true,
        name: 'Development User',
        picture: null
      };
      return next();
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyFirebaseToken(token);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // In development, provide more detailed error info
    if (process.env.NODE_ENV === 'development') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or expired token',
        details: error.message
      });
    }
    
    return res.status(401).json({
      error: 'Access denied',
      message: 'Invalid or expired token'
    });
  }
};

// Optional middleware - continues even if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decodedToken = await verifyFirebaseToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          name: decodedToken.name || null,
          picture: decodedToken.picture || null
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};

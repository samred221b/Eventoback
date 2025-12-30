const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    // Get user from Firebase Admin SDK
    const userRecord = await admin.auth().getUser(req.user.uid);
    
    // Check for admin custom claim
    if (userRecord.customClaims && userRecord.customClaims.admin === true) {
      req.user.isAdmin = true;
      return next();
    }

    // Fallback to hardcoded email for backward compatibility (remove after migration)
    if (req.user.email?.toLowerCase() === 'samred221b@gmail.com') {
      console.warn('Using hardcoded admin check - migrate to Firebase custom claims');
      req.user.isAdmin = true;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to verify admin privileges'
    });
  }
};

const optionalAdmin = async (req, res, next) => {
  try {
    // If no user, continue without admin
    if (!req.user || !req.user.uid) {
      req.user.isAdmin = false;
      return next();
    }
    
    // Check if user is admin
    try {
      const userRecord = await admin.auth().getUser(req.user.uid);
      req.user.isAdmin = (userRecord.customClaims && userRecord.customClaims.admin === true) ||
                        req.user.email?.toLowerCase() === 'samred221b@gmail.com';
    } catch (error) {
      req.user.isAdmin = false;
    }
    
    next();
  } catch (error) {
    console.error('Optional admin check error:', error);
    req.user.isAdmin = false;
    next();
  }
};

module.exports = {
  isAdmin,
  optionalAdmin
};

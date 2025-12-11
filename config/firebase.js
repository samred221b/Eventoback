const admin = require('firebase-admin');

// Fix for self-signed certificate issues in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error);
    throw error;
  }
};

// Verify Firebase ID token with retry logic
const verifyFirebaseToken = async (idToken, retryCount = 0) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    
    // Retry once for certificate issues
    if (retryCount === 0 && error.code === 'auth/argument-error' && 
        error.message.includes('SELF_SIGNED_CERT_IN_CHAIN')) {
      console.log('🔄 Retrying token verification due to certificate issue...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return verifyFirebaseToken(idToken, 1);
    }
    
    throw new Error('Invalid or expired token');
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error('User not found');
  }
};

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  getUserByUid,
  admin
};

const admin = require('firebase-admin');
const { initializeFirebase } = require('../config/firebase');

// Initialize Firebase Admin
initializeFirebase();

async function checkAdminStatus() {
  try {
    const email = 'samred221b@gmail.com';
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    if (!userRecord) {
      console.log('❌ User not found:', email);
      return;
    }
    
    console.log('📧 User UID:', userRecord.uid);
    console.log('🔐 Current custom claims:', userRecord.customClaims);
    console.log('👑 Is admin via custom claims:', userRecord.customClaims && userRecord.customClaims.admin === true);
    console.log('📧 Email check:', userRecord.email?.toLowerCase() === 'samred221b@gmail.com');
    
    // Check if admin via either method
    const isAdmin = (userRecord.customClaims && userRecord.customClaims.admin === true) ||
                     (userRecord.email?.toLowerCase() === 'samred221b@gmail.com');
    
    console.log('✅ Final admin status:', isAdmin);
    
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
  }
}

// Run the check
checkAdminStatus();

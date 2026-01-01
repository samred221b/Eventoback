const admin = require('firebase-admin');
const { initializeFirebase } = require('../config/firebase');

// Initialize Firebase Admin
initializeFirebase();

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase Admin SDK connection...');
    
    // Test 1: Check if Firebase is initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.log('❌ Firebase Admin SDK not initialized');
      return;
    }
    
    // Test 2: Try to get user by email
    const email = 'samred221b@gmail.com';
    console.log(`📧 Looking for user: ${email}`);
    
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('✅ User found:', userRecord.uid);
    console.log('🔐 Custom claims:', userRecord.customClaims);
    
    // Test 3: Check admin status
    const isAdmin = (userRecord.customClaims && userRecord.customClaims.admin === true) ||
                   (userRecord.email?.toLowerCase() === 'samred221b@gmail.com');
    
    console.log('👑 Admin status:', isAdmin);
    
    if (isAdmin) {
      console.log('🎉 Admin privileges verified!');
    } else {
      console.log('❌ Admin privileges not found');
    }
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
  }
}

// Run the test
testFirebaseConnection();

const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
// You'll need to add your Firebase service account credentials to your .env file
// or download the JSON file and reference it here
let firebaseApp;
let firebaseAuth = null;

try {
  // Check if Firebase credentials are provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      // Initialize with service account from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log('Firebase Admin SDK initialized with service account');
    } catch (parseError) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', parseError);
      console.log('Firebase authentication will be disabled');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      // Initialize with service account from file
      const path = require('path');
      const fs = require('fs');
      
      // Try different paths to find the service account file
      const possiblePaths = [
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        path.join(__dirname, '..', '..', 'thread-255de-firebase-adminsdk-fbsvc-a20d23a07e.json'),
        path.join(process.cwd(), 'thread-255de-firebase-adminsdk-fbsvc-a20d23a07e.json')
      ];
      
      let serviceAccountFile = null;
      let foundPath = null;
      
      // Try each path until we find the file
      for (const filePath of possiblePaths) {
        if (filePath && fs.existsSync(filePath)) {
          serviceAccountFile = require(filePath);
          foundPath = filePath;
          break;
        }
      }
      
      if (serviceAccountFile) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountFile)
        });
        
        console.log(`Firebase Admin SDK initialized with service account file found at: ${foundPath}`);
      } else {
        console.error('Firebase service account file not found in any of the expected locations');
        console.log('Firebase authentication will be disabled');
      }
    } catch (fileError) {
      console.error('Error loading Firebase service account file:', fileError);
      console.log('Firebase authentication will be disabled');
    }
  } else {
    console.log('No Firebase credentials provided. Firebase authentication will be disabled.');
  }
  
  // Only set up auth if Firebase was initialized successfully
  if (firebaseApp) {
    firebaseAuth = admin.auth();
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Firebase authentication will be disabled');
}

module.exports = {
  admin,
  auth: firebaseAuth,
  isConfigured: !!firebaseAuth
};

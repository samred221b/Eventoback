# Eventopia Backend Setup Guide

## 🚀 Quick Start

Follow these steps to get your Eventopia backend up and running:

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/eventopia?retryWrites=true&w=majority

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Firebase-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Firebase Setup

1. **Go to Firebase Console** → Your Project → Project Settings
2. **Navigate to Service Accounts** tab
3. **Click "Generate new private key"** and download the JSON file
4. **Extract these values** from the downloaded JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 4. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account** at [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create a new cluster** (free tier is fine for development)
3. **Create a database user** with read/write permissions
4. **Whitelist your IP address** in Network Access
5. **Get connection string** and replace in `MONGODB_URI`

### 5. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 6. Seed Sample Data (Optional)

```bash
npm run seed
```

This will create sample organizers and events for testing.

## 🧪 Testing Your Setup

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Eventopia API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Test Firebase Authentication

1. **Get a Firebase ID token** from your React Native app
2. **Test authentication endpoint**:

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Event Creation

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "This is a test event",
    "category": "conference",
    "location": {
      "address": "Test Address",
      "city": "Addis Ababa",
      "country": "Ethiopia",
      "coordinates": {
        "lat": 9.0320,
        "lng": 38.7469
      }
    },
    "date": "2024-12-31T00:00:00.000Z",
    "time": "10:00"
  }'
```

## 📱 Connecting to React Native

### Update CORS Origins

In `server.js`, update the CORS configuration with your Expo development URLs:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:19006',        // Expo web
    'exp://192.168.1.100:19000',    // Replace with your local IP
    'http://192.168.1.100:19000'    // Replace with your local IP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### API Base URL in React Native

In your React Native app, set the API base URL:

```javascript
// For Expo development
const API_BASE_URL = 'http://192.168.1.100:3000/api'; // Replace with your local IP

// For production
const API_BASE_URL = 'https://your-production-domain.com/api';
```

## 🔧 Maintenance Scripts

### Database Cleanup
```bash
npm run cleanup
```

This script:
- Marks past events as completed
- Updates organizer statistics
- Removes duplicate records
- Generates database statistics

### Re-seed Database
```bash
npm run seed
```

Clears existing data and creates fresh sample data.

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
PORT=3000
```

### Deployment Platforms

#### Heroku
```bash
# Install Heroku CLI and login
heroku create eventopia-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set FIREBASE_PROJECT_ID="your-project-id"
heroku config:set FIREBASE_PRIVATE_KEY="your-private-key"
heroku config:set FIREBASE_CLIENT_EMAIL="your-client-email"
git push heroku main
```

#### Railway
```bash
# Install Railway CLI and login
railway login
railway new eventopia-backend
railway add
railway deploy
```

#### Render
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: MongoNetworkError: failed to connect to server
```
**Solution**: Check your MongoDB URI, IP whitelist, and network connection.

#### 2. Firebase Authentication Error
```
Error: Invalid or expired token
```
**Solution**: Verify your Firebase service account credentials and ensure the token is valid.

#### 3. CORS Error in React Native
```
Error: Network request failed
```
**Solution**: Update CORS origins in `server.js` with your development URLs.

#### 4. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill the process using the port or change the PORT in `.env`.

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

### Logs

Check server logs for detailed error information:
```bash
npm run dev
```

## 📞 Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB and Firebase are properly configured
4. Test API endpoints individually using curl or Postman

## 🎉 You're Ready!

Your Eventopia backend is now ready to power your React Native app. The API provides:

- ✅ Firebase Authentication integration
- ✅ Complete CRUD operations for events and organizers
- ✅ Geospatial queries for nearby events
- ✅ Input validation and error handling
- ✅ Security middleware and rate limiting
- ✅ Sample data for testing

Happy coding! 🚀

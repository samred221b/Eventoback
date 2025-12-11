# Eventopia Backend API

A complete Node.js/Express backend for the Eventopia React Native app with Firebase Authentication and MongoDB Atlas integration.

## 🚀 Features

- **Firebase Authentication** - Secure user authentication with Firebase ID tokens
- **MongoDB Atlas** - Cloud database with Mongoose ODM
- **RESTful APIs** - Complete CRUD operations for events and organizers
- **Input Validation** - Joi validation for all endpoints
- **Error Handling** - Comprehensive error handling and logging
- **Security** - Helmet, CORS, rate limiting, and authentication middleware
- **Geospatial Queries** - Find nearby events using MongoDB geospatial features

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Firebase project with Admin SDK credentials

## 🛠️ Installation

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

4. **Configure environment variables in `.env`**
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventopia?retryWrites=true&w=majority

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🔥 Firebase Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (JSON file)
3. Extract the following values for your `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## 🗄️ MongoDB Setup

1. Create a MongoDB Atlas cluster
2. Create a database named `eventopia`
3. Get your connection string and add it to `MONGODB_URI`
4. Whitelist your IP address in Atlas Network Access

## 🚀 Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Verify Firebase Token
```http
POST /api/auth/verify
Authorization: Bearer <firebase-id-token>
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <firebase-id-token>
```

### Organizer Endpoints

#### Get All Organizers
```http
GET /api/organizers?page=1&limit=20&city=Addis Ababa
```

#### Get Organizer by ID
```http
GET /api/organizers/:id
```

#### Update Profile
```http
PUT /api/organizers/profile
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Event organizer with 5 years experience",
  "phone": "+1234567890",
  "location": {
    "address": "123 Main St",
    "city": "Addis Ababa",
    "country": "Ethiopia",
    "coordinates": {
      "lat": 9.0320,
      "lng": 38.7469
    }
  }
}
```

#### Get Organizer Statistics
```http
GET /api/organizers/profile/stats
Authorization: Bearer <firebase-id-token>
```

### Event Endpoints

#### Get All Events
```http
GET /api/events?page=1&limit=20&category=conference&city=Addis Ababa
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Create Event
```http
POST /api/events
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference featuring the latest innovations",
  "category": "conference",
  "location": {
    "address": "Addis Ababa Convention Center",
    "city": "Addis Ababa",
    "country": "Ethiopia",
    "coordinates": {
      "lat": 9.0320,
      "lng": 38.7469
    }
  },
  "date": "2024-12-15T00:00:00.000Z",
  "time": "09:00",
  "capacity": 500,
  "price": 50,
  "featured": false
}
```

#### Update Event
```http
PUT /api/events/:id
Authorization: Bearer <firebase-id-token>
```

#### Delete Event
```http
DELETE /api/events/:id
Authorization: Bearer <firebase-id-token>
```

#### Register for Event
```http
POST /api/events/:id/register
Authorization: Bearer <firebase-id-token>
```

#### Like/Unlike Event
```http
POST /api/events/:id/like
Authorization: Bearer <firebase-id-token>
```

#### Get Featured Events
```http
GET /api/events/featured?limit=10
```

#### Get Nearby Events
```http
GET /api/events/nearby?lat=9.0320&lng=38.7469&radius=10000
```

#### Get Events by Category
```http
GET /api/events/categories/conference?page=1&limit=20
```

## 🔍 Query Parameters

### Events
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Filter by category
- `city` - Filter by city
- `country` - Filter by country
- `featured` - Filter featured events (true/false)
- `search` - Text search in title and description
- `dateFrom` - Filter events from date
- `dateTo` - Filter events to date
- `priceMin` - Minimum price filter
- `priceMax` - Maximum price filter
- `lat` & `lng` - Coordinates for nearby search
- `radius` - Search radius in meters (default: 10000)

### Organizers
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `city` - Filter by city
- `country` - Filter by country
- `verified` - Filter verified organizers (true/false)
- `search` - Text search in name and bio

## 📊 Data Models

### Organizer Schema
```javascript
{
  firebaseUid: String,      // Firebase UID (unique)
  name: String,             // Full name
  email: String,            // Email address
  bio: String,              // Biography
  phone: String,            // Phone number
  location: {
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  profileImage: String,     // Profile image URL
  totalEvents: Number,      // Total events created
  rating: Number,           // Average rating
  isActive: Boolean,        // Account status
  isVerified: Boolean,      // Verification status
  socialLinks: Object,      // Social media links
  createdAt: Date,
  updatedAt: Date
}
```

### Event Schema
```javascript
{
  title: String,            // Event title
  description: String,      // Event description
  image: String,            // Event image URL
  category: String,         // Event category
  location: {
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  date: Date,               // Event date
  time: String,             // Event time (HH:MM)
  organizerId: ObjectId,    // Reference to organizer
  featured: Boolean,        // Featured status
  capacity: Number,         // Maximum attendees
  price: Number,            // Ticket price
  status: String,           // Event status
  attendees: Array,         // Registered attendees
  likes: Array,             // User likes
  views: Number,            // View count
  tags: Array,              // Event tags
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Security Features

- **Firebase ID Token Verification** - All protected routes verify Firebase tokens
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS Protection** - Configured for React Native apps
- **Helmet Security** - Security headers and protection
- **Input Validation** - Joi validation for all inputs
- **Error Handling** - Comprehensive error responses

## 🔧 Development

**Install nodemon for development:**
```bash
npm install -g nodemon
```

**Run with auto-restart:**
```bash
npm run dev
```

**Check API health:**
```bash
curl http://localhost:3000/api/health
```

## 📝 Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## 🚀 Deployment

1. Set `NODE_ENV=production` in environment
2. Configure production MongoDB URI
3. Set up Firebase service account for production
4. Deploy to your preferred platform (Heroku, AWS, etc.)

## 📞 Support

For issues and questions, please check the API documentation or create an issue in the repository.

## 🎯 Next Steps

1. Set up your `.env` file with proper credentials
2. Start the server with `npm run dev`
3. Test the API endpoints with your React Native app
4. Configure Firebase Authentication in your frontend
5. Start building amazing events! 🎉

# NepalCrowdRise Backend API

This is the backend API for the NepalCrowdRise application, built with Node.js, Express, and MongoDB.

## Folder Structure

```
backend/
  ├── controllers/     # Request handlers
  ├── db/              # Database connection
  ├── middlewares/     # Custom middleware functions
  ├── models/          # Mongoose models
  ├── routes/          # API routes
  ├── app.js           # Express app setup
  ├── server.js        # Server entry point
  └── .env             # Environment variables
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)

### Installation

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/nepalcrowdrise
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Auth Routes
- POST `/api/users/register` - Register a new user
- POST `/api/users/login` - Login user

### User Routes
- GET `/api/users/profile` - Get user profile (protected)
- PUT `/api/users/profile` - Update user profile (protected)

## Adding New Features

To add new features:

1. Create a model in the `models` directory
2. Create a controller in the `controllers` directory
3. Create routes in the `routes` directory
4. Add the routes to `app.js` 
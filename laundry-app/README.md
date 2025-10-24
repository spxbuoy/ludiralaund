# Laundry Service Management System

A comprehensive web-based system for managing laundry services, catering to customers, service providers, and administrators.

## Features

- Multi-role system (Customer, Service Provider, Administrator)
- Order management
- Pickup and delivery scheduling
- Payment processing
- User profile management
- Service catalog
- Real-time order tracking

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Paystack integration
- **Real-time Communication**: Socket.IO
- **UI Components**: Material-UI
- **State Management**: Redux Toolkit

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 16 or higher) - [Download from nodejs.org](https://nodejs.org/)
- **MongoDB** - Either:
  - Local MongoDB installation [Download from mongodb.com](https://www.mongodb.com/try/download/community)
  - MongoDB Atlas cloud database (recommended for production)
- **Git** - For cloning the repository

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd laundry-app
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

#### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/laundry-app
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/laundry-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Email Configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Application URL
APP_URL=http://localhost:3000

# Paystack Payment Configuration
PAYSTACK_ENV=test
PAYSTACK_SECRET_KEY_TEST=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY_TEST=pk_test_your_paystack_public_key
PAYSTACK_SECRET_KEY_LIVE=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY_LIVE=pk_live_your_paystack_public_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Mobile Money (MOMO) Configuration (optional)
MOMO_API_USER=your-momo-api-user
MOMO_API_KEY=your-momo-api-key
MOMO_SUBSCRIPTION_KEY=your-momo-subscription-key
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
```

**Note**: For Gmail, you'll need to generate an "App Password" if you have 2-factor authentication enabled.

#### Start the Backend Server

For development (with auto-restart):
```bash
npm run dev
```

For production:
```bash
npm start
```

The backend server will start on `http://localhost:5000`.

### 3. Frontend Setup

Navigate to the frontend directory (laundry-app) and install dependencies:

```bash
cd ../laundry-app
npm install
```

#### Start the Frontend Development Server

```bash
npm start
```

The frontend application will open in your browser at `http://localhost:3000`.

### 4. Database Seeding (Optional)

To populate the database with sample data, run the seeding scripts from the backend directory:

```bash
# Seed services
node seedServices.js

# Seed chats (if needed)
node seedChats.js

# Update users and seed additional data
node updateUserAndSeed.js
```

## Project Structure

```
laundry-app/
├── backend/                    # Backend API server
│   ├── models/                 # MongoDB models
│   ├── routes/                 # API routes
│   ├── services/               # Business logic services
│   ├── middleware/             # Express middleware
│   ├── uploads/                # File uploads directory
│   └── server.js               # Main server file
├── laundry-app/                # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── features/           # Feature-specific logic
│   │   ├── services/           # API service functions
│   │   ├── types/              # TypeScript type definitions
│   │   ├── styles/             # Global styles and themes
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
│   └── package.json
└── README.md
```

## Available Scripts

### Backend Scripts
- `npm start`: Runs the production server
- `npm run dev`: Runs the development server with nodemon
- `npm test`: Runs tests (currently not implemented)

### Frontend Scripts
- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## API Endpoints

The backend provides RESTful API endpoints for:

- **Authentication**: `/api/auth`
- **Users**: `/api/users`
- **Orders**: `/api/orders`
- **Services**: `/api/services`
- **Payments**: `/api/payments`
- **Reviews**: `/api/reviews`
- **Analytics**: `/api/analytics`
- **Chats**: `/api/chats`
- **Loyalty Program**: `/api/loyalty`
- **Order Tracking**: `/api/tracking`

## Deployment

### Backend Deployment
The backend is configured for deployment on Render. Check `render.yaml` for deployment configuration.

### Frontend Deployment
The frontend can be deployed to Vercel, Netlify, or any static hosting service after building:

```bash
npm run build
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally or your Atlas URI is correct
   - Check firewall settings if using local MongoDB

2. **Email Notifications Not Working**
   - Verify EMAIL_USER and EMAIL_PASS in .env
   - For Gmail, ensure you're using an App Password

3. **Payment Integration Issues**
   - Check Paystack keys are correctly set
   - Ensure webhook URL is configured in Paystack dashboard

4. **CORS Errors**
   - Backend CORS is configured for localhost:3000 and production URLs
   - Update CORS origins in server.js if needed

### Development Tips

- Use `npm run dev` for backend to enable auto-restart on file changes
- Frontend proxy is configured to forward API requests to localhost:5000
- Check browser console and backend logs for debugging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
